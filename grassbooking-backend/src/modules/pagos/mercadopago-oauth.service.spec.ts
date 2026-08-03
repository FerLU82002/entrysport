import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoOAuthService } from './mercadopago-oauth.service';

jest.mock('mercadopago', () => {
  const create = jest.fn();
  const refresh = jest.fn();
  return {
    MercadoPagoConfig: jest.fn().mockImplementation((opts) => ({ accessToken: opts.accessToken })),
    OAuth: jest.fn().mockImplementation(() => ({ create, refresh })),
    __oauthCreateMock: create,
    __oauthRefreshMock: refresh,
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mpMock = require('mercadopago');

const CONFIG = {
  MP_PLATFORM_CLIENT_ID: 'client-123',
  MP_PLATFORM_CLIENT_SECRET: 'secret-abc',
  MP_OAUTH_REDIRECT_URI: 'https://goplanu.com/api/pagos/mercadopago/oauth/callback',
  MP_SANDBOX: 'true',
};

describe('MercadoPagoOAuthService', () => {
  let service: MercadoPagoOAuthService;
  let cuentasRepo: any;
  let statesRepo: any;
  let localesService: any;

  const adminLocalA = { id: 10, rol: 'admin_local', idLocal: 1 };
  const adminLocalB = { id: 20, rol: 'admin_local', idLocal: 2 };

  beforeEach(() => {
    jest.clearAllMocks();

    cuentasRepo = {
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
    };
    statesRepo = {
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
    };
    localesService = {
      verificarPropietario: jest.fn((usuario, idLocal) => {
        if (usuario.rol === 'super_admin') return;
        if (usuario.idLocal !== idLocal) {
          throw new ForbiddenException('No tienes permisos sobre este local');
        }
      }),
    };

    service = new MercadoPagoOAuthService(
      cuentasRepo,
      statesRepo,
      localesService,
      new ConfigService(CONFIG),
    );
  });

  describe('iniciarConexion', () => {
    it('genera una URL de autorización con state propio, sin exponer el client_secret', async () => {
      const resultado = await service.iniciarConexion(adminLocalA as any);

      expect(statesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ idLocal: 1, idUsuario: 10, usado: false }),
      );

      const url = new URL(resultado.data.authorizationUrl);
      expect(url.origin + url.pathname).toBe('https://auth.mercadopago.com/authorization');
      expect(url.searchParams.get('client_id')).toBe('client-123');
      expect(url.searchParams.get('redirect_uri')).toBe(CONFIG.MP_OAUTH_REDIRECT_URI);
      expect(url.searchParams.get('state')).toBeTruthy();
      expect(resultado.data.authorizationUrl).not.toContain('secret-abc');
    });

    it('un admin_local sin local propio no puede iniciar conexión', async () => {
      await expect(
        service.iniciarConexion({ id: 99, rol: 'admin_local', idLocal: null } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('manejarCallback', () => {
    const stateVigente = {
      id: 1,
      idLocal: 1,
      idUsuario: 10,
      state: 'state-valido',
      usado: false,
      expiraEn: new Date(Date.now() + 5 * 60 * 1000),
    };

    it('conecta la cuenta correctamente con un state válido', async () => {
      statesRepo.findOne.mockResolvedValue({ ...stateVigente });
      cuentasRepo.findOne.mockResolvedValue(null);
      mpMock.__oauthCreateMock.mockResolvedValue({
        access_token: 'AT-real',
        refresh_token: 'RT-real',
        user_id: 555,
        expires_in: 21600,
        token_type: 'bearer',
        live_mode: false,
      });

      const resultado = await service.manejarCallback('code-abc', 'state-valido');

      expect(resultado.data.idLocal).toBe(1);
      const cuentaGuardada = cuentasRepo.save.mock.calls[0][0];
      expect(cuentaGuardada.estado).toBe('conectada');
      expect(cuentaGuardada.mercadoPagoUserId).toBe('555');
      // nunca se guarda el token en texto plano
      expect(cuentaGuardada.accessTokenEnc).not.toContain('AT-real');
      expect(cuentaGuardada.accessTokenEnc).toContain(':'); // formato iv:tag:cifrado

      expect(statesRepo.save).toHaveBeenCalledWith(expect.objectContaining({ usado: true }));
    });

    it('rechaza un state inexistente', async () => {
      statesRepo.findOne.mockResolvedValue(null);
      await expect(service.manejarCallback('code', 'no-existe')).rejects.toThrow(ForbiddenException);
      expect(mpMock.__oauthCreateMock).not.toHaveBeenCalled();
    });

    it('rechaza un state ya usado (previene replay)', async () => {
      statesRepo.findOne.mockResolvedValue({ ...stateVigente, usado: true });
      await expect(service.manejarCallback('code', 'state-valido')).rejects.toThrow(ForbiddenException);
      expect(mpMock.__oauthCreateMock).not.toHaveBeenCalled();
    });

    it('rechaza un state expirado', async () => {
      statesRepo.findOne.mockResolvedValue({
        ...stateVigente,
        expiraEn: new Date(Date.now() - 1000),
      });
      await expect(service.manejarCallback('code', 'state-valido')).rejects.toThrow(ForbiddenException);
      expect(mpMock.__oauthCreateMock).not.toHaveBeenCalled();
    });

    it('si Mercado Pago rechaza el code, no se guarda ninguna conexión como conectada', async () => {
      statesRepo.findOne.mockResolvedValue({ ...stateVigente });
      cuentasRepo.findOne.mockResolvedValue(null);
      mpMock.__oauthCreateMock.mockRejectedValue(new Error('invalid_grant'));

      await expect(service.manejarCallback('code-malo', 'state-valido')).rejects.toThrow(
        BadRequestException,
      );
      expect(cuentasRepo.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'conectada' }),
      );
    });

    it('reconexión: si el local ya tenía una cuenta, la reemplaza en vez de crear una segunda', async () => {
      statesRepo.findOne.mockResolvedValue({ ...stateVigente });
      cuentasRepo.findOne.mockResolvedValue({
        id: 77,
        idLocal: 1,
        estado: 'conectada',
        mercadoPagoUserId: '111-cuenta-vieja',
      });
      mpMock.__oauthCreateMock.mockResolvedValue({
        access_token: 'AT-nueva',
        refresh_token: 'RT-nueva',
        user_id: 999,
        expires_in: 21600,
      });

      await service.manejarCallback('code-abc', 'state-valido');

      expect(cuentasRepo.create).not.toHaveBeenCalled(); // reutiliza la fila existente (id 77)
      const cuentaGuardada = cuentasRepo.save.mock.calls[0][0];
      expect(cuentaGuardada.id).toBe(77);
      expect(cuentaGuardada.mercadoPagoUserId).toBe('999');
    });
  });

  describe('obtenerAccessTokenVigente', () => {
    it('devuelve el token vigente descifrado sin refrescar si falta tiempo de sobra', async () => {
      const { encriptar } = require('../../common/utils/crypto.util');
      cuentasRepo.findOne.mockResolvedValue({
        idLocal: 1,
        estado: 'conectada',
        accessTokenEnc: encriptar('access-vigente'),
        refreshTokenEnc: encriptar('refresh-vigente'),
        expiraEn: new Date(Date.now() + 60 * 60 * 1000),
      });

      const token = await service.obtenerAccessTokenVigente(1);

      expect(token).toBe('access-vigente');
      expect(mpMock.__oauthRefreshMock).not.toHaveBeenCalled();
    });

    it('refresca automáticamente cuando el token está por expirar', async () => {
      const { encriptar } = require('../../common/utils/crypto.util');
      cuentasRepo.findOne.mockResolvedValue({
        idLocal: 1,
        estado: 'conectada',
        accessTokenEnc: encriptar('access-viejo'),
        refreshTokenEnc: encriptar('refresh-viejo'),
        expiraEn: new Date(Date.now() + 60 * 1000), // expira en 1 minuto, dentro del margen
      });
      mpMock.__oauthRefreshMock.mockResolvedValue({
        access_token: 'access-nuevo',
        refresh_token: 'refresh-nuevo',
        user_id: 555,
        expires_in: 21600,
      });

      const token = await service.obtenerAccessTokenVigente(1);

      expect(mpMock.__oauthRefreshMock).toHaveBeenCalled();
      expect(token).toBe('access-nuevo');
    });

    it('si el refresh falla, marca la cuenta en error y NO devuelve ningún token', async () => {
      const { encriptar } = require('../../common/utils/crypto.util');
      cuentasRepo.findOne.mockResolvedValue({
        idLocal: 1,
        estado: 'conectada',
        accessTokenEnc: encriptar('access-viejo'),
        refreshTokenEnc: encriptar('refresh-viejo'),
        expiraEn: new Date(Date.now() - 1000), // ya expiró
      });
      mpMock.__oauthRefreshMock.mockRejectedValue(new Error('invalid refresh token'));

      await expect(service.obtenerAccessTokenVigente(1)).rejects.toThrow(BadRequestException);

      const cuentaGuardada = cuentasRepo.save.mock.calls.at(-1)[0];
      expect(cuentaGuardada.estado).toBe('error');
    });

    it('rechaza si el local nunca conectó una cuenta', async () => {
      cuentasRepo.findOne.mockResolvedValue(null);
      await expect(service.obtenerAccessTokenVigente(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('aislamiento multi-tenant', () => {
    it('un admin_local que pide el estado de otro local (idLocal=1) solo ve el suyo propio (idLocal=2)', async () => {
      // adminLocalB pertenece al local 2; aunque pase idLocal=1 en el argumento,
      // el servicio debe ignorarlo para roles no-super_admin y consultar SIEMPRE
      // el local del usuario autenticado (defensa en profundidad: el parámetro
      // no confiable ni siquiera se usa para armar el WHERE).
      cuentasRepo.findOne.mockResolvedValue({
        idLocal: 2,
        estado: 'conectada',
        mercadoPagoUserId: 'cuenta-del-local-2',
      });

      const resultado = await service.obtenerEstado(adminLocalB as any, 1);

      expect(cuentasRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { idLocal: 2 } }),
      );
      expect(resultado.data.mercadoPagoUserId).toBe('cuenta-del-local-2');
    });

    it('super_admin sí puede consultar el estado de cualquier local', async () => {
      cuentasRepo.findOne.mockResolvedValue({
        idLocal: 1,
        estado: 'conectada',
        mercadoPagoUserId: '555',
        conectadoEn: new Date(),
      });

      const resultado = await service.obtenerEstado(
        { id: 1, rol: 'super_admin', idLocal: null } as any,
        1,
      );

      expect(resultado.data.conectada).toBe(true);
    });

    it('desconectar solo actúa sobre el local del propio usuario autenticado', async () => {
      cuentasRepo.findOne.mockResolvedValue({ idLocal: 1, estado: 'conectada' });

      await service.desconectar(adminLocalA as any);

      expect(cuentasRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { idLocal: 1 } }),
      );
      const guardado = cuentasRepo.save.mock.calls[0][0];
      expect(guardado.estado).toBe('desconectada');
      expect(guardado.accessTokenEnc).toBeNull();
      expect(guardado.refreshTokenEnc).toBeNull();
    });
  });
});
