import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HorarioExcepcion } from './entities/horario-excepcion.entity';
import { CreateExcepcionDto } from './dto/create-excepcion.dto';

@Injectable()
export class ExcepcionesService {
  constructor(
    @InjectRepository(HorarioExcepcion)
    private repo: Repository<HorarioExcepcion>,
  ) {}

  async findByFecha(idCancha: number, fecha: string): Promise<HorarioExcepcion[]> {
    return this.repo.find({
      where: { idCancha, fecha },
      order: { horaInicio: 'ASC' },
    });
  }

  async create(dto: CreateExcepcionDto): Promise<HorarioExcepcion> {
    const excepcion = this.repo.create({
      idCancha: dto.idCancha,
      fecha: dto.fecha,
      horaInicio: dto.horaInicio ?? null,
      horaFin: dto.horaFin ?? null,
      disponible: dto.disponible ?? false,
      motivo: dto.motivo,
    });
    return this.repo.save(excepcion);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
