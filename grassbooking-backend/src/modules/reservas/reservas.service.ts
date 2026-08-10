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
import { ConfiguracionPago } from '../locales/entities/configuracion-pago.entity';
import { Notificacion } from '../notificaciones/entities/notificacion.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { CreateReservaManualDto } from './dto/create-reserva-manual.dto';
import { UpdateEstadoReservaDto } from './dto/update-reserva.dto';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private reservasRepository: Repository<Reserva>,
    @InjectRepository(Cancha)
    private canchasRepository: Repository<Cancha>,
    @InjectRepository(ConfiguracionPago)
    private configPagoRepository: Repository<ConfiguracionPago>,
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

  async findTodas(filtros?: {
    fecha?: string;
    estado?: string;
    idCancha?: number;
    idLocal?: number;
  }) {
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
    if (filtros?.idLocal) {
      query.andWhere('cancha.idLocal = :idLocal', { idLocal: filtros.idLocal });
    }

    const reservas = await query.getMany();
    return { data: reservas, message: 'Reservas obtenidas' };
  }

  async findHoy(idLocal?: number) {
    const hoy = new Date().toISOString().split('T')[0];
    const query = this.reservasRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.usuario', 'usuario')
      .leftJoinAndSelect('reserva.cancha', 'cancha')
      .where('reserva.fechaReserva = :hoy', { hoy })
      .orderBy('reserva.horaInicio', 'ASC');

    if (idLocal) {
      query.andWhere('cancha.idLocal = :idLocal', { idLocal });
    }

    const reservas = await query.getMany();
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
    if (horaH < 8 || horaH > 23) {
      throw new BadRequestException('El horario debe ser entre 08:00 y 23:00');
    }

    const cancha = await this.canchasRepository.findOne({
      where: { id: createDto.idCancha, estado: 'activa' },
    });

    if (!cancha) {
      throw new NotFoundException('Cancha no encontrada o inactiva');
    }

    // El slot de las 23:00 termina a las 00:00 (medianoche)
    const nextH = horaH + 1;
    const horaFin =
      nextH >= 24
        ? `00:${String(horaM).padStart(2, '0')}`
        : `${String(nextH).padStart(2, '0')}:${String(horaM).padStart(2, '0')}`;

    // Verificar conflicto con CAST explícito para evitar desajustes de formato HH:MM vs HH:MM:SS
    const horaInicioNorm = createDto.horaInicio.substring(0, 5);
    const conflicto = await this.reservasRepository
      .createQueryBuilder('r')
      .where('r.idCancha = :idCancha', { idCancha: createDto.idCancha })
      .andWhere('r.fechaReserva = :fecha', { fecha: createDto.fechaReserva })
      .andWhere('CAST(r.horaInicio AS text) LIKE :hora', { hora: `${horaInicioNorm}%` })
      .andWhere("r.estado != 'cancelada'")
      .getOne();

    if (conflicto) {
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

    const esNocturno = createDto.horaInicio >= cancha.horaInicioNoche.substring(0, 5);
    const precioBase = esNocturno
      ? Number(cancha.precioHoraNoche)
      : Number(cancha.precioHoraDia);

    const configPago = await this.configPagoRepository.findOne({ where: { idLocal: cancha.idLocal } });
    const descuentoPct = Number(configPago?.descuentoPct ?? 0);
    const adelantoPct = Number(configPago?.adelantoPct ?? 100);
    // Descuento aplica al total; adelanto se calcula sobre el precio original
    const montoTotal = Number((precioBase * (1 - descuentoPct / 100)).toFixed(2));
    const montoAdelanto = Math.min(
      Number((precioBase * adelantoPct / 100).toFixed(2)),
      montoTotal,
    );

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
      idLocal: cancha.idLocal,
      monto: montoAdelanto,
      estadoPago: 'pendiente',
    });
    const pagoGuardado = await this.pagosRepository.save(pago);

    const notificacion = this.notificacionesRepository.create({
      idUsuario: userId,
      idReserva: reservaGuardada.id,
      tipo: 'confirmacion',
      mensaje: `Tu reserva para el ${createDto.fechaReserva} a las ${createDto.horaInicio} ha sido recibida. Código: ${reservaGuardada.codigoReserva}`,
    });
    await this.notificacionesRepository.save(notificacion);

    reservaGuardada.cancha = cancha;
    reservaGuardada.pago = pagoGuardado;

    return { data: reservaGuardada, message: 'Reserva creada exitosamente' };
  }

  async cambiarEstado(id: number, updateDto: UpdateEstadoReservaDto, idLocal?: number) {
    const reserva = await this.reservasRepository.findOne({
      where: { id },
      relations: ['cancha'],
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva #${id} no encontrada`);
    }

    if (idLocal && reserva.cancha.idLocal !== idLocal) {
      throw new ForbiddenException('No tienes permisos sobre esta reserva');
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

  async createManual(dto: CreateReservaManualDto, adminUserId: number, idLocal: number) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaReserva = new Date(dto.fechaReserva + 'T00:00:00');

    if (fechaReserva < hoy) {
      throw new BadRequestException('No se pueden crear reservas en fechas pasadas');
    }

    const [horaH, horaM] = dto.horaInicio.split(':').map(Number);
    if (horaH < 8 || horaH > 23) {
      throw new BadRequestException('El horario debe ser entre 08:00 y 23:00');
    }

    // Verificar que la cancha pertenece al local del admin
    const cancha = await this.canchasRepository.findOne({
      where: { id: dto.idCancha, estado: 'activa', idLocal },
    });

    if (!cancha) {
      throw new NotFoundException('Cancha no encontrada, inactiva o no pertenece a tu local');
    }

    const nextH = horaH + 1;
    const horaFin =
      nextH >= 24
        ? `00:${String(horaM).padStart(2, '0')}`
        : `${String(nextH).padStart(2, '0')}:${String(horaM).padStart(2, '0')}`;

    // Verificar conflicto de horario
    const horaInicioNorm = dto.horaInicio.substring(0, 5);
    const conflicto = await this.reservasRepository
      .createQueryBuilder('r')
      .where('r.idCancha = :idCancha', { idCancha: dto.idCancha })
      .andWhere('r.fechaReserva = :fecha', { fecha: dto.fechaReserva })
      .andWhere('CAST(r.horaInicio AS text) LIKE :hora', { hora: `${horaInicioNorm}%` })
      .andWhere("r.estado != 'cancelada'")
      .getOne();

    if (conflicto) {
      throw new BadRequestException('Este horario ya está reservado');
    }

    const esNocturno = dto.horaInicio >= cancha.horaInicioNoche.substring(0, 5);
    const montoTotal = esNocturno
      ? Number(cancha.precioHoraNoche)
      : Number(cancha.precioHoraDia);

    // Armar notas: info del cliente + notas extra
    const partesNotas: string[] = [];
    if (dto.nombreCliente) partesNotas.push(`Cliente: ${dto.nombreCliente}`);
    if (dto.telefonoCliente) partesNotas.push(`Tel: ${dto.telefonoCliente}`);
    if (dto.notas) partesNotas.push(dto.notas);
    const notasFinal = partesNotas.length > 0 ? partesNotas.join(' | ') : undefined;

    const reserva = this.reservasRepository.create({
      idUsuario: adminUserId,
      idCancha: dto.idCancha,
      fechaReserva: dto.fechaReserva,
      horaInicio: dto.horaInicio,
      horaFin,
      montoTotal,
      notas: notasFinal,
      estado: 'confirmada', // reserva manual ya está confirmada
    });

    const reservaGuardada = await this.reservasRepository.save(reserva);

    const pago = this.pagosRepository.create({
      idReserva: reservaGuardada.id,
      idLocal: cancha.idLocal,
      monto: montoTotal,
      estadoPago: dto.pagado ? 'pagado' : 'pendiente',
      metodoPago: dto.metodoPago,
    });
    await this.pagosRepository.save(pago);

    reservaGuardada.cancha = cancha;

    return { data: reservaGuardada, message: 'Reserva manual registrada exitosamente' };
  }
}
