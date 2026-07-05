import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { Cancha } from '../canchas/entities/cancha.entity';
import { Notificacion } from '../notificaciones/entities/notificacion.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateEstadoReservaDto } from './dto/update-reserva.dto';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private reservasRepository: Repository<Reserva>,
    @InjectRepository(Cancha)
    private canchasRepository: Repository<Cancha>,
    @InjectRepository(Notificacion)
    private notificacionesRepository: Repository<Notificacion>,
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
  ) {}

  async findMisReservas(userId: number) {
    const reservas = await this.reservasRepository.find({
      where: { idUsuario: userId },
      relations: ['cancha'],
      order: { fechaReserva: 'DESC', horaInicio: 'DESC' },
    });
    return { data: reservas, message: 'Reservas obtenidas' };
  }

  async findTodas(filtros?: { fecha?: string; estado?: string; idCancha?: number }) {
    const query = this.reservasRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.usuario', 'usuario')
      .leftJoinAndSelect('reserva.cancha', 'cancha')
      .leftJoinAndSelect('reserva.pago', 'pago')
      .orderBy('reserva.fechaReserva', 'DESC')
      .addOrderBy('reserva.horaInicio', 'ASC');

    if (filtros?.fecha) {
      query.andWhere('reserva.fechaReserva = :fecha', { fecha: filtros.fecha });
    }
    if (filtros?.estado) {
      query.andWhere('reserva.estado = :estado', { estado: filtros.estado });
    }
    if (filtros?.idCancha) {
      query.andWhere('reserva.idCancha = :idCancha', { idCancha: filtros.idCancha });
    }

    const reservas = await query.getMany();
    return { data: reservas, message: 'Reservas obtenidas' };
  }

  async findHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const reservas = await this.reservasRepository.find({
      where: { fechaReserva: hoy },
      relations: ['usuario', 'cancha'],
      order: { horaInicio: 'ASC' },
    });
    return { data: reservas, message: 'Reservas del día obtenidas' };
  }

  async findOne(id: number) {
    const reserva = await this.reservasRepository.findOne({
      where: { id },
      relations: ['usuario', 'cancha', 'pago'],
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva #${id} no encontrada`);
    }

    return { data: reserva, message: 'Reserva obtenida' };
  }

  async create(createDto: CreateReservaDto, userId: number) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaReserva = new Date(createDto.fechaReserva + 'T00:00:00');

    if (fechaReserva < hoy) {
      throw new BadRequestException('No se pueden crear reservas en fechas pasadas');
    }

    const [horaH, horaM] = createDto.horaInicio.split(':').map(Number);
    if (horaH < 8 || horaH >= 23) {
      throw new BadRequestException('El horario debe ser entre 08:00 y 23:00');
    }

    const cancha = await this.canchasRepository.findOne({
      where: { id: createDto.idCancha, estado: 'activa' },
    });

    if (!cancha) {
      throw new NotFoundException('Cancha no encontrada o inactiva');
    }

    const horaFin = `${String(horaH + 1).padStart(2, '0')}:${String(horaM).padStart(2, '0')}`;

    const conflicto = await this.reservasRepository.findOne({
      where: {
        idCancha: createDto.idCancha,
        fechaReserva: createDto.fechaReserva,
        horaInicio: createDto.horaInicio,
      },
    });

    if (conflicto && conflicto.estado !== 'cancelada') {
      throw new BadRequestException('Este horario ya está reservado');
    }

    const mismaFechaHora = await this.reservasRepository.findOne({
      where: {
        idUsuario: userId,
        fechaReserva: createDto.fechaReserva,
        horaInicio: createDto.horaInicio,
      },
    });

    if (mismaFechaHora && mismaFechaHora.estado !== 'cancelada') {
      throw new BadRequestException(
        'Ya tienes una reserva en ese mismo horario y fecha',
      );
    }

    const montoTotal = Number(cancha.precioHora);

    const reserva = this.reservasRepository.create({
      idUsuario: userId,
      idCancha: createDto.idCancha,
      fechaReserva: createDto.fechaReserva,
      horaInicio: createDto.horaInicio,
      horaFin,
      montoTotal,
      notas: createDto.notas,
      estado: 'pendiente',
    });

    const reservaGuardada = await this.reservasRepository.save(reserva);

    const pago = this.pagosRepository.create({
      idReserva: reservaGuardada.id,
      monto: montoTotal,
      estadoPago: 'pendiente',
    });
    await this.pagosRepository.save(pago);

    const notificacion = this.notificacionesRepository.create({
      idUsuario: userId,
      idReserva: reservaGuardada.id,
      tipo: 'confirmacion',
      mensaje: `Tu reserva para el ${createDto.fechaReserva} a las ${createDto.horaInicio} ha sido recibida. Código: ${reservaGuardada.codigoReserva}`,
    });
    await this.notificacionesRepository.save(notificacion);

    return { data: reservaGuardada, message: 'Reserva creada exitosamente' };
  }

  async cancelarPorUsuario(id: number, userId: number) {
    const reserva = await this.reservasRepository.findOne({
      where: { id, idUsuario: userId },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reserva.estado === 'cancelada') {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    const ahora = new Date();
    const fechaHoraReserva = new Date(
      `${reserva.fechaReserva}T${reserva.horaInicio}:00`,
    );
    const diferenciaHoras =
      (fechaHoraReserva.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (diferenciaHoras < 2) {
      throw new ForbiddenException(
        'Solo puedes cancelar con al menos 2 horas de anticipación',
      );
    }

    reserva.estado = 'cancelada';
    await this.reservasRepository.save(reserva);

    const notificacion = this.notificacionesRepository.create({
      idUsuario: userId,
      idReserva: id,
      tipo: 'cancelacion',
      mensaje: `Tu reserva del ${reserva.fechaReserva} a las ${reserva.horaInicio} ha sido cancelada`,
    });
    await this.notificacionesRepository.save(notificacion);

    return { data: reserva, message: 'Reserva cancelada exitosamente' };
  }

  async cambiarEstado(id: number, updateDto: UpdateEstadoReservaDto) {
    const reserva = await this.reservasRepository.findOne({ where: { id } });

    if (!reserva) {
      throw new NotFoundException(`Reserva #${id} no encontrada`);
    }

    reserva.estado = updateDto.estado;
    if (updateDto.notas) reserva.notas = updateDto.notas;

    const actualizada = await this.reservasRepository.save(reserva);

    if (['cancelada', 'confirmada', 'completada'].includes(updateDto.estado)) {
      const notificacion = this.notificacionesRepository.create({
        idUsuario: reserva.idUsuario,
        idReserva: id,
        tipo: updateDto.estado === 'cancelada' ? 'cancelacion' : 'modificacion',
        mensaje: `El estado de tu reserva del ${reserva.fechaReserva} fue actualizado a: ${updateDto.estado}`,
      });
      await this.notificacionesRepository.save(notificacion);
    }

    return { data: actualizada, message: 'Estado actualizado' };
  }
}
