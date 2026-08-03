import { ConfigService } from '@nestjs/config';
import { MercadoPagoWebhookService } from './mercadopago-webhook.service';

jest.mock('mercadopago', () => {
  const get = jest.fn();
  const validate = jest.fn();
  class InvalidWebhookSignatureErrorMock extends Error {
    constructor(public reason: string) {
      super('firma inválida');
    }
  }
  return {
    MercadoPagoConfig: jest.fn().mockImplementation((opts) => ({ accessToken: opts.accessToken })),
    Payment: jest.fn().mockImplementation(() => ({ get })),
    WebhookSignatureValidator: { validate },
    InvalidWebhookSignatureError: InvalidWebhookSignatureErrorMock,
    __paymentGetMock: get,
    __validateMock: validate,
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mpMock = require('mercadopago');
const InvalidWebhookSignatureErrorMock = mpMock.InvalidWebhookSignatureError;

describe('MercadoPagoWebhookService', () => {
  let service: MercadoPagoWebhookService;
  let pagosRepo: any;
  let eventosRepo: any;
  let localesService: any;
  let pagosSplitService: any;

  const pagoBase = () => ({
    id: 900,
    idLocal: 1,
    monto: 100,
    estadoPago: 'pendiente',
    externalReference: 'reserva-55-idem-1',
    mercadoPagoAccountId: 'MP-LOCAL-A-123',
    montoComisionPlataforma: 10,
    reserva: { id: 55, idUsuario: 7, fechaReserva: '2026-08-10' },
  });

  const detalleAprobadoValido = () => ({
    status: 'approved',
    external_reference: 'reserva-55-idem-1',
    transaction_amount: 100,
    currency_id: 'PEN',
    collector_id: 'MP-LOCAL-A-123',
    marketplace_fee: 10,
  });

  const request = (overrides: Partial<{ xSignature: string; xRequestId: string; dataId: string }> = {}) => ({
    xSignature: 'ts=1,v1=abc',
    xRequestId: 'req-1',
    dataId: 'PAY-1',
    body: { data: { id: 'PAY-1' }, type: 'payment' },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // clearAllMocks no borra mockImplementation() de llamadas anteriores; sin
    // este reset explícito, el mock de firma inválida contaminaría los demás tests.
    mpMock.__validateMock.mockReset();
    mpMock.__paymentGetMock.mockReset();

    pagosRepo = { findOne: jest.fn() };
    eventosRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
    };
    localesService = { obtenerMoneda: jest.fn().mockResolvedValue('PEN') };
    pagosSplitService = { confirmarPagoAprobado: jest.fn().mockResolvedValue(undefined) };

    service = new MercadoPagoWebhookService(
      pagosRepo,
      eventosRepo,
      localesService,
      pagosSplitService,
      new ConfigService({
        MP_WEBHOOK_SECRET: 'secreto-webhook',
        MP_PLATFORM_ACCESS_TOKEN: 'token-plataforma',
      }),
    );
  });

  it('marca la reserva como pagada cuando todo coincide (camino feliz)', async () => {
    mpMock.__paymentGetMock.mockResolvedValue(detalleAprobadoValido());
    pagosRepo.findOne.mockResolvedValue(pagoBase());

    const resultado = await service.procesarNotificacion(request());

    expect(resultado.procesado).toBe(true);
    expect(pagosSplitService.confirmarPagoAprobado).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: 'PAY-1' }),
    );
    expect(eventosRepo.save).toHaveBeenCalledWith(expect.objectContaining({ resultado: 'aprobado' }));
  });

  it('rechaza la notificación si la firma es inválida y no marca nada como pagado', async () => {
    mpMock.__validateMock.mockImplementation(() => {
      throw new InvalidWebhookSignatureErrorMock('SignatureMismatch');
    });

    const resultado = await service.procesarNotificacion(request());

    expect(resultado.procesado).toBe(false);
    expect(mpMock.__paymentGetMock).not.toHaveBeenCalled();
    expect(pagosSplitService.confirmarPagoAprobado).not.toHaveBeenCalled();
    expect(eventosRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ resultado: 'error_validacion' }),
    );
  });

  it('un evento ya aprobado antes no se reprocesa (webhook repetido / idempotencia)', async () => {
    eventosRepo.findOne.mockResolvedValue({ paymentId: 'PAY-1', resultado: 'aprobado', idReservaDetectada: 55 });

    const resultado = await service.procesarNotificacion(request());

    expect(resultado.procesado).toBe(false);
    expect(mpMock.__paymentGetMock).not.toHaveBeenCalled();
    expect(pagosSplitService.confirmarPagoAprobado).not.toHaveBeenCalled();
    expect(eventosRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ resultado: 'ignorado_duplicado' }),
    );
  });

  it('si la reserva ya estaba pagada (p. ej. registrada en efectivo), un webhook tardío no la reprocesa', async () => {
    mpMock.__paymentGetMock.mockResolvedValue(detalleAprobadoValido());
    pagosRepo.findOne.mockResolvedValue({ ...pagoBase(), estadoPago: 'pagado' });

    const resultado = await service.procesarNotificacion(request());

    expect(resultado.procesado).toBe(false);
    expect(pagosSplitService.confirmarPagoAprobado).not.toHaveBeenCalled();
  });

  it('no marca como pagada una reserva cuando el pago está pendiente', async () => {
    mpMock.__paymentGetMock.mockResolvedValue({ ...detalleAprobadoValido(), status: 'pending' });
    pagosRepo.findOne.mockResolvedValue(pagoBase());

    const resultado = await service.procesarNotificacion(request());

    expect(resultado.procesado).toBe(false);
    expect(pagosSplitService.confirmarPagoAprobado).not.toHaveBeenCalled();
    expect(eventosRepo.save).toHaveBeenCalledWith(expect.objectContaining({ resultado: 'pendiente' }));
  });

  it('no marca como pagada una reserva cuando el pago fue rechazado', async () => {
    mpMock.__paymentGetMock.mockResolvedValue({ ...detalleAprobadoValido(), status: 'rejected' });
    pagosRepo.findOne.mockResolvedValue(pagoBase());

    const resultado = await service.procesarNotificacion(request());

    expect(resultado.procesado).toBe(false);
    expect(pagosSplitService.confirmarPagoAprobado).not.toHaveBeenCalled();
    expect(eventosRepo.save).toHaveBeenCalledWith(expect.objectContaining({ resultado: 'rechazado' }));
  });

  it('no marca como pagada una reserva cuando el estado es desconocido/cancelado', async () => {
    mpMock.__paymentGetMock.mockResolvedValue({ ...detalleAprobadoValido(), status: 'cancelled' });
    pagosRepo.findOne.mockResolvedValue(pagoBase());

    const resultado = await service.procesarNotificacion(request());

    expect(resultado.procesado).toBe(false);
    expect(pagosSplitService.confirmarPagoAprobado).not.toHaveBeenCalled();
  });

  it('rechaza si el monto informado por Mercado Pago no coincide con el de la reserva', async () => {
    mpMock.__paymentGetMock.mockResolvedValue({ ...detalleAprobadoValido(), transaction_amount: 1 });
    pagosRepo.findOne.mockResolvedValue(pagoBase());

    const resultado = await service.procesarNotificacion(request());

    expect(resultado.procesado).toBe(false);
    expect(pagosSplitService.confirmarPagoAprobado).not.toHaveBeenCalled();
    expect(eventosRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ resultado: 'rechazado', motivoRechazo: expect.stringContaining('monto') }),
    );
  });

  it('rechaza si la moneda no coincide con la configurada para el local', async () => {
    mpMock.__paymentGetMock.mockResolvedValue({ ...detalleAprobadoValido(), currency_id: 'USD' });
    pagosRepo.findOne.mockResolvedValue(pagoBase());

    const resultado = await service.procesarNotificacion(request());

    expect(resultado.procesado).toBe(false);
    expect(pagosSplitService.confirmarPagoAprobado).not.toHaveBeenCalled();
  });

  it('rechaza si la cuenta receptora del pago no es la cuenta conectada del local (evita robo cruzado entre reservas/locales)', async () => {
    mpMock.__paymentGetMock.mockResolvedValue({
      ...detalleAprobadoValido(),
      collector_id: 'MP-OTRO-LOCAL-999',
    });
    pagosRepo.findOne.mockResolvedValue(pagoBase());

    const resultado = await service.procesarNotificacion(request());

    expect(resultado.procesado).toBe(false);
    expect(pagosSplitService.confirmarPagoAprobado).not.toHaveBeenCalled();
    expect(eventosRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ motivoRechazo: expect.stringContaining('cuenta receptora') }),
    );
  });

  it('rechaza si la comisión informada por Mercado Pago no coincide con la registrada al iniciar el pago', async () => {
    mpMock.__paymentGetMock.mockResolvedValue({ ...detalleAprobadoValido(), marketplace_fee: 0 });
    pagosRepo.findOne.mockResolvedValue(pagoBase());

    const resultado = await service.procesarNotificacion(request());

    expect(resultado.procesado).toBe(false);
    expect(pagosSplitService.confirmarPagoAprobado).not.toHaveBeenCalled();
    expect(eventosRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ motivoRechazo: expect.stringContaining('comisión') }),
    );
  });

  it('un paymentId aprobado no puede usarse para marcar como pagada una reserva distinta a la de su external_reference', async () => {
    // El paymentId pertenece realmente a la reserva 55 (así lo dice Mercado Pago),
    // pero en la BD no existe ningún Pago cuyo externalReference sea justo ese valor
    // (simula que un atacante intenta que se aplique a otra reserva que no lo generó).
    mpMock.__paymentGetMock.mockResolvedValue({
      ...detalleAprobadoValido(),
      external_reference: 'reserva-999-idem-inexistente',
    });
    pagosRepo.findOne.mockResolvedValue(null);

    const resultado = await service.procesarNotificacion(request());

    expect(pagosRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { externalReference: 'reserva-999-idem-inexistente' } }),
    );
    expect(resultado.procesado).toBe(false);
    expect(pagosSplitService.confirmarPagoAprobado).not.toHaveBeenCalled();
  });

  it('ignora cualquier dato del query/body del webhook para decidir el resultado: todo sale de consultar a Mercado Pago', async () => {
    mpMock.__paymentGetMock.mockResolvedValue(detalleAprobadoValido());
    pagosRepo.findOne.mockResolvedValue(pagoBase());

    // El atacante manda un body/query completamente distinto a la realidad.
    const resultado = await service.procesarNotificacion({
      xSignature: 'ts=1,v1=abc',
      xRequestId: 'req-1',
      dataId: 'PAY-1',
      body: { data: { id: 'PAY-1' }, type: 'payment', monto_falso: 1, estado_falso: 'approved' } as any,
    });

    expect(resultado.procesado).toBe(true); // se aprueba solo porque MP lo confirmó de verdad
    expect(mpMock.__paymentGetMock).toHaveBeenCalledWith({ id: 'PAY-1' });
  });

  it('registra el evento sin filtrar tokens ni secretos en el payload de auditoría', async () => {
    mpMock.__paymentGetMock.mockResolvedValue(detalleAprobadoValido());
    pagosRepo.findOne.mockResolvedValue(pagoBase());

    await service.procesarNotificacion(request());

    const eventoGuardado = eventosRepo.save.mock.calls.at(-1)[0];
    const serializado = JSON.stringify(eventoGuardado);
    expect(serializado).not.toContain('token-plataforma');
    expect(serializado).not.toContain('secreto-webhook');
  });
});
