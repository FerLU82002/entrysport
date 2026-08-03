import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Pago } from './entities/pago.entity';
import { CuentaMercadoPago } from './entities/cuenta-mercadopago.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Notificacion } from '../notificaciones/entities/notificacion.entity';
import { LocalesService } from '../locales/locales.service';
import { MercadoPagoOAuthService } from './mercadopago-oauth.service';

interface Distribucion {
  montoComisionPlataforma: number;
  montoNetoLocal: number;
}

@Injectable()
export class PagosSplitService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
    @InjectRepository(Reserva)
    private reservasRepository: Repository<Reserva>,
    @InjectRepository(CuentaMercadoPago)
    private cuentasRepository: Repository<CuentaMercadoPago>,
    @InjectRepository(Notificacion)
    private notificacionesRepository: Repository<Notificacion>,
    private localesService: LocalesService,
    private oauthService: MercadoPagoOAuthService,
    private configService: ConfigService,
  ) {}

  porcentajeComisionVigente(): number {
    return Number(this.configService.get<string>('MP_COMMISSION_PERCENTAGE', '10'));
  }

  /**
   * Calcula la comisión de la plataforma y el neto del local trabajando en
   * centavos enteros: el neto es siempre el remanente exacto del total menos
   * la comisión, nunca un redondeo independiente — así la suma jamás tiene
   * drift de un centavo respecto al monto original.
   */
  calcularDistribucion(montoTotal: number, porcentajeComision: number): Distribucion {
    const totalCentavos = Math.round(montoTotal * 100);
    const comisionCentavos = Math.round((totalCentavos * porcentajeComision) / 100);
    const netoCentavos = totalCentavos - comisionCentavos;

    return {
      montoComisionPlataforma: comisionCentavos / 100,
      montoNetoLocal: netoCentavos / 100,
    };
  }

  private async obtenerReservaConPago(idReserva: number, userId: number) {
    const reserva = await this.reservasRepository.findOne({
      where: { id: idReserva },
      relations: ['cancha', 'pago'],
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva #${idReserva} no encontrada`);
    }
    if (reserva.idUsuario !== userId) {
      throw new ForbiddenException('No tienes permisos sobre esta reserva');
    }
    if (!reserva.pago) {
      throw new NotFoundException('Esta reserva no tiene un pago asociado');
    }
    if (reserva.pago.estadoPago === 'pagado') {
      throw new BadRequestException('Esta reserva ya fue pagada');
    }

    return reserva;
  }

  async iniciarPago(idReserva: number, userId: number) {
    const reserva = await this.obtenerReservaConPago(idReserva, userId);
    const idLocal = reserva.cancha.idLocal;
    const pago = reserva.pago;

    // Idempotencia de aplicación: si ya existe una preferencia vigente para
    // este pago, se reutiliza en vez de crear una nueva (reintentos / doble clic).
    if (pago.preferenceId) {
      return {
        data: { preferenceId: pago.preferenceId, externalReference: pago.externalReference },
        message: 'Ya existe una preferencia de pago activa para esta reserva',
      };
    }

    const cuenta = await this.cuentasRepository.findOne({ where: { idLocal } });

    if (!cuenta || cuenta.estado !== 'conectada') {
      throw new BadRequestException(
        'Este local no tiene una cuenta de Mercado Pago conectada. No se puede iniciar el pago.',
      );
    }

    // Puede lanzar BadRequestException si el refresh falla — no debe crearse
    // ninguna preferencia ni marcarse nada como pagado en ese caso.
    const accessToken = await this.oauthService.obtenerAccessTokenVigente(idLocal);

    const moneda = await this.localesService.obtenerMoneda(idLocal);
    const porcentaje = this.porcentajeComisionVigente();

    // El monto SIEMPRE sale de la reserva almacenada, nunca de la solicitud.
    const montoTotal = Number(reserva.montoTotal);
    const { montoComisionPlataforma, montoNetoLocal } = this.calcularDistribucion(
      montoTotal,
      porcentaje,
    );

    const externalReference = `reserva-${reserva.id}-${pago.idempotencyKey}`;

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const resultado = await preference.create({
      body: {
        items: [
          {
            id: String(reserva.id),
            title: `Reserva ${reserva.cancha.nombre} - ${reserva.fechaReserva} ${reserva.horaInicio}`,
            quantity: 1,
            unit_price: montoTotal,
            currency_id: moneda,
          },
        ],
        marketplace_fee: montoComisionPlataforma,
        external_reference: externalReference,
      },
      requestOptions: { idempotencyKey: pago.idempotencyKey },
    });

    if (!resultado.id) {
      throw new BadRequestException('No se pudo generar la preferencia de pago');
    }

    pago.pasarela = 'mercadopago';
    pago.preferenceId = resultado.id;
    pago.externalReference = externalReference;
    pago.mercadoPagoAccountId = cuenta.mercadoPagoUserId;
    pago.montoComisionPlataforma = montoComisionPlataforma;
    pago.montoNetoLocal = montoNetoLocal;
    pago.estadoDistribucion = 'pendiente';
    pago.idLocal = idLocal;
    await this.pagosRepository.save(pago);

    return {
      data: {
        preferenceId: resultado.id,
        initPoint: resultado.init_point,
        externalReference,
        montoTotal,
        montoComisionPlataforma,
        montoNetoLocal,
      },
      message: 'Preferencia de pago creada',
    };
  }

  async confirmarPagoAprobado(params: { reserva: Reserva; paymentId: string }) {
    const pago = params.reserva.pago;
    pago.estadoPago = 'pagado';
    pago.referenciaExterna = params.paymentId;
    pago.estadoDistribucion = 'distribuido';
    pago.fechaPago = new Date();
    const guardado = await this.pagosRepository.save(pago);

    const notificacion = this.notificacionesRepository.create({
      idUsuario: params.reserva.idUsuario,
      idReserva: params.reserva.id,
      tipo: 'confirmacion',
      mensaje: `Tu pago de la reserva del ${params.reserva.fechaReserva} fue confirmado exitosamente`,
    });
    await this.notificacionesRepository.save(notificacion);

    return guardado;
  }
}
