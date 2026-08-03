import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HorarioExcepcion } from './entities/horario-excepcion.entity';
import { CreateExcepcionDto } from './dto/create-excepcion.dto';
import { CanchasService } from '../canchas/canchas.service';
import { LocalesService } from '../locales/locales.service';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class ExcepcionesService {
  constructor(
    @InjectRepository(HorarioExcepcion)
    private repo: Repository<HorarioExcepcion>,
    private canchasService: CanchasService,
    private localesService: LocalesService,
  ) {}

  private async verificarPropietarioDeCancha(usuario: Usuario, idCancha: number) {
    const { data: cancha } = await this.canchasService.findOne(idCancha);
    this.localesService.verificarPropietario(usuario, cancha.idLocal);
  }

  async findByFecha(idCancha: number, fecha: string): Promise<HorarioExcepcion[]> {
    return this.repo.find({
      where: { idCancha, fecha },
      order: { horaInicio: 'ASC' },
    });
  }

  async create(dto: CreateExcepcionDto, usuario: Usuario): Promise<HorarioExcepcion> {
    await this.verificarPropietarioDeCancha(usuario, dto.idCancha);

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

  async remove(id: number, usuario: Usuario): Promise<void> {
    const excepcion = await this.repo.findOne({ where: { id } });
    if (!excepcion) {
      throw new NotFoundException(`Excepción #${id} no encontrada`);
    }

    await this.verificarPropietarioDeCancha(usuario, excepcion.idCancha);
    await this.repo.delete(id);
  }
}
