import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { OAuth, MercadoPagoConfig } from 'mercadopago';
import { CuentaMercadoPago } from './entities/cuenta-mercadopago.entity';
import { OauthState } from './entities/oauth-state.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { LocalesService } from '../locales/locales.service';
import { encriptar, desencriptar } from '../../common/utils/crypto.util';

const AUTHORIZE_URL = 'https://auth.mercadopago.com/authorization';
const ESTADO_EXPIRACION_MINUTOS = 10;
/** Margen de seguridad: se refresca el token si expira dentro de este umbral. */
const MARGEN_REFRESH_MS = 5 * 60 * 1000;

@Injectable()
export class MercadoPagoOAuthService {
  constructor(
    @InjectRepository(CuentaMercadoPago)
    private cuentasRepo: Repository<CuentaMercadoPago>,
    @InjectRepository(OauthState)
    private statesRepo: Repository<OauthState>,
    private localesService: LocalesService,
    private configService: ConfigService,
  ) {}

  private clientId(): string {
    return this.configService.getOrThrow<string>('MP_PLATFORM_CLIENT_ID');
  }

  private clientSecret(): string {
    return this.configService.getOrThrow<string>('MP_PLATFORM_CLIENT_SECRET');
  }

  private redirectUri(): string {
    return this.configService.getOrThrow<string>('MP_OAUTH_REDIRECT_URI');
  }

  private esSandbox(): boolean {
    return this.configService.get<string>('MP_SANDBOX', 'true') === 'true';
  }

  /** Cliente SDK usado únicamente para llamar /oauth/token; esa llamada se autentica
   * con client_id/client_secret en el body, no con este accessToken. */
  private oauthClient(): OAuth {
    return new OAuth(new MercadoPagoConfig({ accessToken: this.clientSecret() }));
  }

  /**
   * Genera la URL de autorización para que el admin_local conecte SU PROPIO local.
   * El idLocal nunca viene del cliente: siempre es el del usuario autenticado.
   */
  async iniciarConexion(usuario: Usuario): Promise<{ data: { authorizationUrl: string }; message: string }> {
    if (!usuario.idLocal) {
      throw new BadRequestException('Primero debes registrar tu local');
    }

    const state = randomUUID();
    const expiraEn = new Date(Date.now() + ESTADO_EXPIRACION_MINUTOS * 60 * 1000);

    await this.statesRepo.save(
      this.statesRepo.create({
        idLocal: usuario.idLocal,
        idUsuario: usuario.id,
        state,
        usado: false,
        expiraEn,
      }),
    );

    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set('client_id', this.clientId());
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('platform_id', 'mp');
    url.searchParams.set('redirect_uri', this.redirectUri());
    url.searchParams.set('state', state);

    return { data: { authorizationUrl: url.toString() }, message: 'URL de autorización generada' };
  }

  /**
   * Procesa el callback público de Mercado Pago. La identidad del local a conectar
   * la determina EXCLUSIVAMENTE el `state` guardado en `iniciarConexion` — nunca un
   * parámetro adicional del request.
   */
  async manejarCallback(code: string, state: string): Promise<{ data: { idLocal: number }; message: string }> {
    if (!code || !state) {
      throw new BadRequestException('Callback de Mercado Pago inválido');
    }

    const estadoGuardado = await this.statesRepo.findOne({ where: { state } });

    if (!estadoGuardado) {
      throw new ForbiddenException('state inválido');
    }
    if (estadoGuardado.usado) {
      throw new ForbiddenException('state ya fue utilizado');
    }
    if (estadoGuardado.expiraEn.getTime() < Date.now()) {
      throw new ForbiddenException('state expirado');
    }

    let respuesta;
    try {
      respuesta = await this.oauthClient().create({
        body: {
          client_id: this.clientId(),
          client_secret: this.clientSecret(),
          code,
          redirect_uri: this.redirectUri(),
        },
      });
    } catch (error) {
      await this.marcarError(estadoGuardado.idLocal, 'Fallo al intercambiar el código de autorización');
      throw new BadRequestException('No se pudo completar la conexión con Mercado Pago');
    }

    if (!respuesta.access_token || !respuesta.user_id) {
      await this.marcarError(estadoGuardado.idLocal, 'Respuesta de Mercado Pago incompleta');
      throw new BadRequestException('No se pudo completar la conexión con Mercado Pago');
    }

    await this.guardarConexion(estadoGuardado.idLocal, respuesta);

    estadoGuardado.usado = true;
    await this.statesRepo.save(estadoGuardado);

    return { data: { idLocal: estadoGuardado.idLocal }, message: 'Cuenta de Mercado Pago conectada' };
  }

  private async guardarConexion(idLocal: number, respuesta: {
    access_token?: string;
    refresh_token?: string;
    user_id?: number;
    public_key?: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
    live_mode?: boolean;
  }) {
    let cuenta = await this.cuentasRepo.findOne({ where: { idLocal } });
    if (!cuenta) {
      cuenta = this.cuentasRepo.create({ idLocal });
    }

    cuenta.mercadoPagoUserId = String(respuesta.user_id);
    cuenta.publicKey = respuesta.public_key ?? null;
    cuenta.accessTokenEnc = encriptar(respuesta.access_token!);
    cuenta.refreshTokenEnc = respuesta.refresh_token ? encriptar(respuesta.refresh_token) : null;
    cuenta.tokenType = respuesta.token_type || 'bearer';
    cuenta.scope = respuesta.scope ?? null;
    cuenta.expiraEn = new Date(Date.now() + (respuesta.expires_in ?? 0) * 1000);
    cuenta.liveMode = respuesta.live_mode ?? !this.esSandbox();
    cuenta.estado = 'conectada';
    cuenta.errorMensaje = null;
    cuenta.conectadoEn = new Date();

    await this.cuentasRepo.save(cuenta);
  }

  private async marcarError(idLocal: number, mensaje: string) {
    const cuenta = await this.cuentasRepo.findOne({ where: { idLocal } });
    if (cuenta) {
      cuenta.estado = 'error';
      cuenta.errorMensaje = mensaje;
      await this.cuentasRepo.save(cuenta);
    }
  }

  /**
   * Devuelve un access token vigente para el local, refrescándolo si está por
   * expirar. Si la renovación falla, la cuenta queda marcada en error y se
   * lanza una excepción — el llamador NO debe continuar con el pago.
   */
  async obtenerAccessTokenVigente(idLocal: number): Promise<string> {
    const cuenta = await this.cuentasRepo.findOne({ where: { idLocal } });

    if (!cuenta || cuenta.estado !== 'conectada' || !cuenta.accessTokenEnc) {
      throw new BadRequestException(
        'Este local no tiene una cuenta de Mercado Pago conectada',
      );
    }

    const expiraPronto =
      !cuenta.expiraEn || cuenta.expiraEn.getTime() - Date.now() < MARGEN_REFRESH_MS;

    if (!expiraPronto) {
      return desencriptar(cuenta.accessTokenEnc);
    }

    if (!cuenta.refreshTokenEnc) {
      await this.marcarError(idLocal, 'Token expirado sin refresh_token disponible');
      throw new BadRequestException('La conexión con Mercado Pago expiró, el local debe reconectarla');
    }

    try {
      const respuesta = await this.oauthClient().refresh({
        body: {
          client_id: this.clientId(),
          client_secret: this.clientSecret(),
          refresh_token: desencriptar(cuenta.refreshTokenEnc),
        },
      });

      if (!respuesta.access_token) {
        throw new Error('Respuesta de refresh incompleta');
      }

      await this.guardarConexion(idLocal, respuesta);
      return respuesta.access_token;
    } catch (error) {
      await this.marcarError(idLocal, 'No se pudo renovar el token de Mercado Pago');
      throw new BadRequestException('No se pudo renovar la conexión con Mercado Pago');
    }
  }

  async desconectar(usuario: Usuario): Promise<{ data: null; message: string }> {
    if (!usuario.idLocal) {
      throw new NotFoundException('No tienes un local registrado');
    }
    this.localesService.verificarPropietario(usuario, usuario.idLocal);

    const cuenta = await this.cuentasRepo.findOne({ where: { idLocal: usuario.idLocal } });
    if (!cuenta) {
      throw new NotFoundException('No tienes ninguna cuenta de Mercado Pago conectada');
    }

    cuenta.estado = 'desconectada';
    cuenta.accessTokenEnc = null;
    cuenta.refreshTokenEnc = null;
    await this.cuentasRepo.save(cuenta);

    return { data: null, message: 'Cuenta de Mercado Pago desconectada' };
  }

  async obtenerEstado(usuario: Usuario, idLocal?: number) {
    const objetivo = usuario.rol === 'super_admin' && idLocal ? idLocal : usuario.idLocal;

    if (!objetivo) {
      throw new NotFoundException('No tienes un local registrado');
    }
    this.localesService.verificarPropietario(usuario, objetivo);

    const cuenta = await this.cuentasRepo.findOne({ where: { idLocal: objetivo } });

    return {
      data: {
        conectada: cuenta?.estado === 'conectada',
        estado: cuenta?.estado ?? 'pendiente',
        mercadoPagoUserId: cuenta?.estado === 'conectada' ? cuenta.mercadoPagoUserId : null,
        conectadoEn: cuenta?.conectadoEn ?? null,
      },
      message: 'Estado de conexión obtenido',
    };
  }

  /** Uso interno (split/webhook). Nunca exponer por controller. */
  async obtenerCuenta(idLocal: number): Promise<CuentaMercadoPago | null> {
    return this.cuentasRepo.findOne({ where: { idLocal } });
  }

  /** Único dato que un comprador (no autenticado como dueño del local) puede ver. */
  async obtenerEstadoPublico(idLocal: number): Promise<{ data: { conectada: boolean }; message: string }> {
    const cuenta = await this.cuentasRepo.findOne({ where: { idLocal } });
    return {
      data: { conectada: cuenta?.estado === 'conectada' },
      message: 'Estado público de Mercado Pago',
    };
  }
}
