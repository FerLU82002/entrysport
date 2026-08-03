import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  MercadoPagoConfig,
  Payment,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from 'mercadopago';
import { Pago } from './entities/pago.entity';
import { WebhookEventoPago, ResultadoWebhook } from './entities/webhook-evento-pago.entity';
import { LocalesService } from '../locales/locales.service';
import { PagosSplitService } from './pagos-split.service';

const TOLERANCIA_CENTAVOS = 0.01;

export interface WebhookRequest {
  xSignature?: string;
  xRequestId?: string;
  dataId?: string;
  body?: { data?: { id?: string }; type?: string };
}

@Injectable()
export class MercadoPagoWebhookService {
  private readonly logger = new Logger(MercadoPagoWebhookService.name);

  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
    @InjectRepository(WebhookEventoPago)
    private eventosRepository: Repository<WebhookEventoPago>,
    private localesService: LocalesService,
    private pagosSplitService: PagosSplitService,
    private configService: ConfigService,
  ) {}

  private async registrarEvento(
    paymentId: string,
    resultado: ResultadoWebhook,
    motivoRechazo: string | null,
    idReservaDetectada: number | null,
    payloadCrudo: Record<string, unknown> | null = null,
  ) {
    await this.eventosRepository.save(
      this.eventosRepository.create({
        paymentId,
        tipoEvento: 'payment',
        idReservaDetectada,
        resultado,
        motivoRechazo,
        payloadCrudo,
      }),
    );
  }

  /**
   * Punto de entrada del webhook. Trata la notificación ÚNICAMENTE como un
   * disparador para verificar — nunca confía en su contenido por sí solo.
   */
  async procesarNotificacion(request: WebhookRequest): Promise<{ procesado: boolean; motivo?: string }> {
    const paymentId = request.dataId || request.body?.data?.id;

    if (!paymentId) {
      return { procesado: false, motivo: 'Notificación sin payment id' };
    }

    // 1) Autenticidad de la notificación (firma HMAC de Mercado Pago).
    try {
      WebhookSignatureValidator.validate({
        xSignature: request.xSignature,
        xRequestId: request.xRequestId,
        dataId: request.dataId,
        secret: this.configService.getOrThrow<string>('MP_WEBHOOK_SECRET'),
        toleranceSeconds: 300,
      });
    } catch (error) {
      const motivo =
        error instanceof InvalidWebhookSignatureError ? error.reason : 'firma inválida';
      this.logger.warn(`Webhook MP con firma inválida (${motivo}) para payment ${paymentId}`);
      await this.registrarEvento(paymentId, 'error_validacion', `Firma inválida: ${motivo}`, null);
      return { procesado: false, motivo: 'Firma inválida' };
    }

    // 2) Idempotencia: si este payment ya fue aprobado antes, no se reprocesa.
    const yaAprobado = await this.eventosRepository.findOne({
      where: { paymentId, resultado: 'aprobado' },
    });
    if (yaAprobado) {
      await this.registrarEvento(paymentId, 'ignorado_duplicado', null, yaAprobado.idReservaDetectada);
      return { procesado: false, motivo: 'Evento ya procesado' };
    }

    // 3) Consultar el pago REAL en Mercado Pago con el token de la plataforma
    //    (nunca con datos que vengan del propio webhook).
    let detalle;
    try {
      const client = new MercadoPagoConfig({
        accessToken: this.configService.getOrThrow<string>('MP_PLATFORM_ACCESS_TOKEN'),
      });
      detalle = await new Payment(client).get({ id: paymentId });
    } catch (error) {
      await this.registrarEvento(paymentId, 'error_validacion', 'No se pudo consultar el pago en Mercado Pago', null);
      return { procesado: false, motivo: 'Error consultando Mercado Pago' };
    }

    const externalReference = detalle.external_reference;
    if (!externalReference) {
      await this.registrarEvento(paymentId, 'rechazado', 'El pago no trae external_reference', null);
      return { procesado: false, motivo: 'Sin external_reference' };
    }

    // 4) El external_reference es NUESTRO identificador — así encontramos el Pago,
    //    nunca confiando en un idReserva sin verificar.
    const pago = await this.pagosRepository.findOne({
      where: { externalReference },
      relations: ['reserva', 'reserva.cancha'],
    });

    if (!pago) {
      await this.registrarEvento(paymentId, 'rechazado', 'external_reference no corresponde a ningún pago', null);
      return { procesado: false, motivo: 'Pago no encontrado' };
    }

    const idReserva = pago.reserva.id;

    if (pago.estadoPago === 'pagado') {
      await this.registrarEvento(paymentId, 'ignorado_duplicado', 'La reserva ya estaba pagada', idReserva);
      return { procesado: false, motivo: 'Ya estaba pagada' };
    }

    // 5) Estado real del pago.
    if (detalle.status !== 'approved') {
      await this.registrarEvento(
        paymentId,
        detalle.status === 'pending' || detalle.status === 'in_process' ? 'pendiente' : 'rechazado',
        `Estado de Mercado Pago: ${detalle.status ?? 'desconocido'}`,
        idReserva,
      );
      return { procesado: false, motivo: `Pago no aprobado (${detalle.status})` };
    }

    // 6) Verificación cruzada completa contra lo registrado al iniciar el pago.
    const errores: string[] = [];

    if (externalReference !== pago.externalReference) {
      errores.push('external_reference no coincide');
    }

    const montoEsperado = Number(pago.monto);
    const montoRecibido = Number(detalle.transaction_amount ?? NaN);
    if (Number.isNaN(montoRecibido) || Math.abs(montoRecibido - montoEsperado) > TOLERANCIA_CENTAVOS) {
      errores.push(`monto no coincide (esperado ${montoEsperado}, recibido ${montoRecibido})`);
    }

    const monedaEsperada = pago.idLocal ? await this.localesService.obtenerMoneda(pago.idLocal) : null;
    if (monedaEsperada && detalle.currency_id && detalle.currency_id !== monedaEsperada) {
      errores.push(`moneda no coincide (esperada ${monedaEsperada}, recibida ${detalle.currency_id})`);
    }

    const cuentaReceptora = detalle.collector_id ? String(detalle.collector_id) : null;
    if (!cuentaReceptora || cuentaReceptora !== pago.mercadoPagoAccountId) {
      errores.push('la cuenta receptora no corresponde a la cuenta conectada del local');
    }

    const comisionRecibida = this.extraerComisionAplicada(detalle);
    const comisionEsperada = pago.montoComisionPlataforma !== null ? Number(pago.montoComisionPlataforma) : null;
    if (
      comisionEsperada !== null &&
      (comisionRecibida === null || Math.abs(comisionRecibida - comisionEsperada) > TOLERANCIA_CENTAVOS)
    ) {
      errores.push(`comisión no coincide (esperada ${comisionEsperada}, recibida ${comisionRecibida})`);
    }

    if (errores.length > 0) {
      const motivo = errores.join('; ');
      this.logger.warn(`Webhook MP rechazado para reserva #${idReserva}: ${motivo}`);
      await this.registrarEvento(paymentId, 'rechazado', motivo, idReserva);
      return { procesado: false, motivo: 'Validación cruzada falló' };
    }

    // 7) Todo válido: recién aquí se marca la reserva como pagada.
    await this.pagosSplitService.confirmarPagoAprobado({ reserva: pago.reserva, paymentId: String(paymentId) });
    await this.registrarEvento(paymentId, 'aprobado', null, idReserva);

    return { procesado: true };
  }

  private extraerComisionAplicada(detalle: {
    marketplace_fee?: number;
    fee_details?: Array<{ type?: string; amount?: number }>;
  }): number | null {
    if (typeof detalle.marketplace_fee === 'number') {
      return detalle.marketplace_fee;
    }
    const feeDetail = detalle.fee_details?.find(
      (f) => f.type === 'marketplace_fee' || f.type === 'application_fee',
    );
    return typeof feeDetail?.amount === 'number' ? feeDetail.amount : null;
  }
}
