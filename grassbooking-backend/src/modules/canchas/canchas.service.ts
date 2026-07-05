import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cancha } from './entities/cancha.entity';
import { CreateCanchaDto } from './dto/create-cancha.dto';
import { UpdateCanchaDto } from './dto/update-cancha.dto';

@Injectable()
export class CanchasService {
  constructor(
    @InjectRepository(Cancha)
    private canchasRepository: Repository<Cancha>,
  ) {}

  async findAll(soloActivas = false) {
    const where = soloActivas ? { estado: 'activa' as const } : {};
    const canchas = await this.canchasRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });
    return { data: canchas, message: 'Canchas obtenidas' };
  }

  async findOne(id: number) {
    const cancha = await this.canchasRepository.findOne({ where: { id } });

    if (!cancha) {
      throw new NotFoundException(`Cancha #${id} no encontrada`);
    }

    return { data: cancha, message: 'Cancha obtenida' };
  }

  async create(createDto: CreateCanchaDto) {
    const cancha = this.canchasRepository.create(createDto);
    const guardada = await this.canchasRepository.save(cancha);
    return { data: guardada, message: 'Cancha creada exitosamente' };
  }

  async update(id: number, updateDto: UpdateCanchaDto) {
    const cancha = await this.canchasRepository.findOne({ where: { id } });

    if (!cancha) {
      throw new NotFoundException(`Cancha #${id} no encontrada`);
    }

    Object.assign(cancha, updateDto);
    const actualizada = await this.canchasRepository.save(cancha);
    return { data: actualizada, message: 'Cancha actualizada' };
  }

  async remove(id: number) {
    const cancha = await this.canchasRepository.findOne({ where: { id } });

    if (!cancha) {
      throw new NotFoundException(`Cancha #${id} no encontrada`);
    }

    cancha.estado = 'inactiva';
    await this.canchasRepository.save(cancha);
    return { data: null, message: 'Cancha desactivada' };
  }
}
