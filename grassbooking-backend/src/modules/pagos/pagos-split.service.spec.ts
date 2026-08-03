import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PagosSplitService } from './pagos-split.service';

jest.mock('mercadopago', () => {
  const preferenceCreate = jest.fn();
  return {
    MercadoPagoConfig: jest.fn().mockImplementation((opts) => ({ accessToken: opts.accessToken })),
    Preference: jest.fn().mockImplementation(() => ({ create: preferenceCreate })),
    __preferenceCreateMock: preferenceCreate,
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mpMock = require('mercadopago');

describe('PagosSplitService', () => {
  let service: PagosSplitService;
  let pagosRepo: any;
  let reservasRepo: any;
  let cuentasRepo: any;
  let notificacionesRepo: any;
  let localesService: any;
  let oauthService: any;
  let configService: ConfigService;

  const cuentaConectada = {
    idLocal: 1,
    mercadoPagoUserId: 'MP-LOCAL-A-123',
    estado: 'conectada',
    accessTokenEnc: 'enc(access-local-a)',
    expiraEn: new Date(Date.now() + 3600_000),
  };

  // Factory, no un objeto compartido: el servicio muta `pago` en sitio (igual
  // que TypeORM haría con una entidad real), así que cada test necesita su
  // propia copia — de lo contrario las mutaciones de un test contaminan los
  // siguientes.
  const crearReservaBase = () => ({
    id: 55,
    idUsuario: 7,
    montoTotal: 100,
    fechaReserva: '2026-08-10',
    horaInicio: '18:00',
    cancha: { idLocal: 1, nombre: 'Cancha 1' },
    pago: {
      id: 900,
      estadoPago: 'pendiente',
      idempotencyKey: 'idem-fijo-1',
      preferenceId: null,
      externalReference: null,
    },
  });
  let reservaBase: ReturnType<typeof crearReservaBase>;

  beforeEach(() => {
    jest.clearAllMocks();
    reservaBase = crearReservaBase();

    pagosRepo = { save: jest.fn((p) => Promise.resolve(p)) };
    reservasRepo = { findOne: jest.fn() };
    cuentasRepo = { findOne: jest.fn() };
    notificacionesRepo = { create: jest.fn((x) => x), save: jest.fn() };
    localesService = { obtenerMoneda: jest.fn().mockResolvedValue('PEN') };
    oauthService = {
      obtenerAccessTokenVigente: jest.fn().mockResolvedValue('access-local-a-plano'),
    };
    configService = new ConfigService({ MP_COMMISSION_PERCENTAGE: '10' });

    service = new PagosSplitService(
      pagosRepo,
      reservasRepo,
      cuentasRepo,
      notificacionesRepo,
      localesService,
      oauthService,
      configService,
    );
  });

  describe('calcularDistribucion (comisión y redondeo)', () => {
    it('reparte 100 con 10% exactamente en 10 / 90', () => {
      const r = service.calcularDistribucion(100, 10);
      expect(r.montoComisionPlataforma).toBe(10);
      expect(r.montoNetoLocal).toBe(90);
    });

    it('redondea la comisión y ajusta el neto para que la suma sea exacta (33.33 @ 10%)', () => {
      const r = service.calcularDistribucion(33.33, 10);
      // 33.33 * 10% = 3.333 -> redondeado a 3.33
      expect(r.montoComisionPlataforma).toBe(3.33);
      // el neto es el remanente, nunca se redondea de forma independiente
      expect(r.montoNetoLocal).toBe(30.0);
      expect(
        Number((r.montoComisionPlataforma + r.montoNetoLocal).toFixed(2)),
      ).toBe(33.33);
    });

    it('nunca produce drift de centavos en un rango amplio de montos', () => {
      for (let centavos = 1; centavos <= 10000; centavos += 37) {
        const monto = centavos / 100;
        const r = service.calcularDistribucion(monto, 10);
        expect(Number((r.montoComisionPlataforma + r.montoNetoLocal).toFixed(2))).toBe(monto);
      }
    });

    it('comisión de 0% deja el 100% al local', () => {
      const r = service.calcularDistribucion(50, 0);
      expect(r.montoComisionPlataforma).toBe(0);
      expect(r.montoNetoLocal).toBe(50);
    });
  });

  describe('iniciarPago', () => {
    it('usa la cuenta MP conectada del local dueño de la reserva (nunca otra ni una global)', async () => {
      reservasRepo.findOne.mockResolvedValue(reservaBase);
      cuentasRepo.findOne.mockResolvedValue(cuentaConectada);
      mpMock.__preferenceCreateMock.mockResolvedValue({
        id: 'pref-abc',
        init_point: 'https://mp.example/checkout/pref-abc',
      });

      await service.iniciarPago(55, 7);

      expect(cuentasRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { idLocal: 1 } }),
      );
      expect(mpMock.MercadoPagoConfig).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'access-local-a-plano' }),
      );
    });

    it('calcula la comisión en el servidor y la incluye como marketplace_fee', async () => {
      reservasRepo.findOne.mockResolvedValue(reservaBase);
      cuentasRepo.findOne.mockResolvedValue(cuentaConectada);
      mpMock.__preferenceCreateMock.mockResolvedValue({ id: 'pref-abc', init_point: 'https://mp.example/x' });

      await service.iniciarPago(55, 7);

      const bodyEnviado = mpMock.__preferenceCreateMock.mock.calls[0][0].body;
      expect(bodyEnviado.marketplace_fee).toBe(10);
      expect(bodyEnviado.items[0].unit_price).toBe(100);
    });

    it('rechaza el pago si el local no tiene cuenta de Mercado Pago conectada (sin crear preferencia)', async () => {
      reservasRepo.findOne.mockResolvedValue(reservaBase);
      cuentasRepo.findOne.mockResolvedValue(null);

      await expect(service.iniciarPago(55, 7)).rejects.toThrow(BadRequestException);
      expect(mpMock.__preferenceCreateMock).not.toHaveBeenCalled();
    });

    it('rechaza el pago si la cuenta existe pero no está en estado "conectada"', async () => {
      reservasRepo.findOne.mockResolvedValue(reservaBase);
      cuentasRepo.findOne.mockResolvedValue({ ...cuentaConectada, estado: 'error' });

      await expect(service.iniciarPago(55, 7)).rejects.toThrow(BadRequestException);
      expect(mpMock.__preferenceCreateMock).not.toHaveBeenCalled();
    });

    it('detiene el pago sin crear preferencia si la renovación del token falla', async () => {
      reservasRepo.findOne.mockResolvedValue(reservaBase);
      cuentasRepo.findOne.mockResolvedValue(cuentaConectada);
      oauthService.obtenerAccessTokenVigente.mockRejectedValue(
        new BadRequestException('No se pudo renovar el token'),
      );

      await expect(service.iniciarPago(55, 7)).rejects.toThrow(BadRequestException);
      expect(mpMock.__preferenceCreateMock).not.toHaveBeenCalled();
    });

    it('ignora cualquier monto/comisión enviado por el cliente y usa el monto almacenado en la reserva', async () => {
      reservasRepo.findOne.mockResolvedValue(reservaBase);
      cuentasRepo.findOne.mockResolvedValue(cuentaConectada);
      mpMock.__preferenceCreateMock.mockResolvedValue({ id: 'pref-abc', init_point: 'https://mp.example/x' });

      // La firma del método no acepta monto/comisión desde afuera: no hay forma de inyectarlos.
      // @ts-expect-error -- a propósito: iniciarPago no debe aceptar un tercer argumento con montos
      await service.iniciarPago(55, 7, { montoTotal: 1, marketplace_fee: 0 });

      const bodyEnviado = mpMock.__preferenceCreateMock.mock.calls[0][0].body;
      expect(bodyEnviado.items[0].unit_price).toBe(100); // el de la reserva, no el "1" inyectado
      expect(bodyEnviado.marketplace_fee).toBe(10);
    });

    it('rechaza pagar una reserva ajena', async () => {
      reservasRepo.findOne.mockResolvedValue(reservaBase);

      await expect(service.iniciarPago(55, /* userId distinto */ 999)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mpMock.__preferenceCreateMock).not.toHaveBeenCalled();
    });

    it('rechaza pagar una reserva ya pagada', async () => {
      reservasRepo.findOne.mockResolvedValue({
        ...reservaBase,
        pago: { ...reservaBase.pago, estadoPago: 'pagado' },
      });

      await expect(service.iniciarPago(55, 7)).rejects.toThrow(BadRequestException);
      expect(mpMock.__preferenceCreateMock).not.toHaveBeenCalled();
    });

    it('idempotencia: un reintento reutiliza la preferencia ya creada en vez de generar una nueva', async () => {
      const reservaConPreferenciaPrevia = {
        ...reservaBase,
        pago: {
          ...reservaBase.pago,
          preferenceId: 'pref-ya-creada',
          externalReference: 'ext-ya-creada',
        },
      };
      reservasRepo.findOne.mockResolvedValue(reservaConPreferenciaPrevia);
      cuentasRepo.findOne.mockResolvedValue(cuentaConectada);

      const resultado = await service.iniciarPago(55, 7);

      expect(mpMock.__preferenceCreateMock).not.toHaveBeenCalled();
      expect(resultado.data.preferenceId).toBe('pref-ya-creada');
    });

    it('dos solicitudes concurrentes para la misma reserva usan el mismo idempotencyKey al llamar a Mercado Pago', async () => {
      reservasRepo.findOne.mockResolvedValue(reservaBase);
      cuentasRepo.findOne.mockResolvedValue(cuentaConectada);
      mpMock.__preferenceCreateMock.mockResolvedValue({ id: 'pref-abc', init_point: 'https://mp.example/x' });

      await Promise.all([service.iniciarPago(55, 7), service.iniciarPago(55, 7)]);

      const llamadas = mpMock.__preferenceCreateMock.mock.calls;
      const keys = llamadas.map((c: any) => c[0].requestOptions?.idempotencyKey);
      expect(new Set(keys).size).toBe(1);
      expect(keys[0]).toBe('idem-fijo-1');
    });
  });
});
