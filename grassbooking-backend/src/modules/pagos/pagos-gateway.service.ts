import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Notificacion } from '../notificaciones/entities/notificacion.entity';
import { LocalesService } from '../locales/locales.service';
import { CrearCargoCulqiDto } from './dto/crear-cargo-culqi.dto';

/**
 * Cobro directo con Culqi (checkout tokenizado, sin split): cada local usa sus
 * propias credenciales, guardadas manualmente en su configuración de pago.
 * El modelo de Mercado Pago es distinto (marketplace/split vía OAuth) — ver
 * PagosSplitService y MercadoPagoWebhookService.
 */
@Injectable()
export class PagosGatewayService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
    @InjectRepository(Reserva)
    private reservasRepository: Repository<Reserva>,
    @InjectRepository(Notificacion)
    private notificacionesRepository: Repository<Notificacion>,
    private localesService: LocalesService,
  ) {}

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

  async crearCargoCulqi(idReserva: number, userId: number, dto: CrearCargoCulqiDto) {
    const reserva = await this.obtenerReservaConPago(idReserva, userId);
    const creds = await this.localesService.obtenerCredencialesCulqi(reserva.cancha.idLocal);

    if (!creds.culqiActivo || !creds.culqiSecretKey) {
      throw new BadRequestException('Este local no tiene Culqi habilitado');
    }

    const respuesta = await fetch('https://api.culqi.com/v2/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creds.culqiSecretKey}`,
      },
      body: JSON.stringify({
        amount: Math.round(Number(reserva.montoTotal) * 100),
        currency_code: creds.moneda || 'PEN',
        email: dto.email || 'cliente@grassbooking.com',
        source_id: dto.tokenId,
        description: `Reserva #${reserva.id} - ${reserva.fechaReserva}`,
        metadata: { idReserva: reserva.id },
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new BadRequestException(resultado?.user_message || 'El pago fue rechazado por Culqi');
    }

    const pago = reserva.pago;
    pago.estadoPago = 'pagado';
    pago.pasarela = 'culqi';
    pago.metodoPago = 'culqi';
    pago.referenciaExterna = resultado.id;
    pago.fechaPago = new Date();
    const guardado = await this.pagosRepository.save(pago);

    const notificacion = this.notificacionesRepository.create({
      idUsuario: reserva.idUsuario,
      idReserva: reserva.id,
      tipo: 'confirmacion',
      mensaje: `Tu pago de la reserva del ${reserva.fechaReserva} fue confirmado exitosamente`,
    });
    await this.notificacionesRepository.save(notificacion);

    return { data: guardado, message: 'Pago confirmado exitosamente' };
  }
}
