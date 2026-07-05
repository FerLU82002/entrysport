import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario, DiaSemana } from './entities/horario.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { ExcepcionesService } from '../excepciones/excepciones.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';

const DIAS_SEMANA: Record<number, DiaSemana> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
};

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(Horario)
    private horariosRepository: Repository<Horario>,
    @InjectRepository(Reserva)
    private reservasRepository: Repository<Reserva>,
    private excepcionesService: ExcepcionesService,
  ) {}

  async findByCancha(idCancha: number) {
    const horarios = await this.horariosRepository.find({
      where: { idCancha },
      order: { diaSemana: 'ASC', horaInicio: 'ASC' },
    });
    return { data: horarios, message: 'Horarios obtenidos' };
  }

  async getDisponibilidad(idCancha: number, fecha: string) {
    const fechaDate = new Date(fecha + 'T00:00:00');
    const diaSemana = DIAS_SEMANA[fechaDate.getDay()];

    const [horarios, reservasDelDia, excepciones] = await Promise.all([
      this.horariosRepository.find({
        where: { idCancha, diaSemana, disponible: true },
        order: { horaInicio: 'ASC' },
      }),
      this.reservasRepository.find({ where: { idCancha, fechaReserva: fecha } }),
      this.excepcionesService.findByFecha(idCancha, fecha),
    ]);

    const normalizar = (t: string) => t.substring(0, 5);

    const reservadasHoras = new Set(
      reservasDelDia
        .filter((r) => r.estado !== 'cancelada')
        .map((r) => normalizar(r.horaInicio)),
    );

    // ¿Hay un bloqueo de día completo? (horaInicio = null y disponible = false)
    const bloqueoDia = excepciones.find(
      (e) => e.horaInicio === null && !e.disponible,
    );

    // Mapa de excepciones por hora de inicio
    const excMap = new Map(
      excepciones
        .filter((e) => e.horaInicio !== null)
        .map((e) => [normalizar(e.horaInicio!), e]),
    );

    const slots = horarios.map((horario) => {
      const hora = normalizar(horario.horaInicio);
      const horaFin = normalizar(horario.horaFin);
      const yaReservado = reservadasHoras.has(hora);

      if (bloqueoDia) {
        return {
          id: horario.id,
          horaInicio: hora,
          horaFin,
          disponible: false,
          motivo: bloqueoDia.motivo || 'Día bloqueado',
        };
      }

      const exc = excMap.get(hora);
      if (exc) {
        // disponible=false → bloqueado; disponible=true → abierto pero respeta reservas
        return {
          id: horario.id,
          horaInicio: hora,
          horaFin,
          disponible: exc.disponible ? !yaReservado : false,
          motivo: exc.motivo,
        };
      }

      return {
        id: horario.id,
        horaInicio: hora,
        horaFin,
        disponible: !yaReservado,
      };
    });

    return {
      data: { fecha, diaSemana, slots, bloqueadoDia: !!bloqueoDia },
      message: 'Disponibilidad obtenida',
    };
  }

  async create(createDto: CreateHorarioDto) {
    const horario = this.horariosRepository.create(createDto);
    const guardado = await this.horariosRepository.save(horario);
    return { data: guardado, message: 'Horario creado' };
  }

  async update(id: number, updateDto: UpdateHorarioDto) {
    const horario = await this.horariosRepository.findOne({ where: { id } });

    if (!horario) {
      throw new NotFoundException(`Horario #${id} no encontrado`);
    }

    Object.assign(horario, updateDto);
    const actualizado = await this.horariosRepository.save(horario);
    return { data: actualizado, message: 'Horario actualizado' };
  }
}
