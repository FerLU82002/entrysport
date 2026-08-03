import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cancha } from './entities/cancha.entity';
import { CreateCanchaDto } from './dto/create-cancha.dto';
import { UpdateCanchaDto } from './dto/update-cancha.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { LocalesService } from '../locales/locales.service';

@Injectable()
export class CanchasService {
  constructor(
    @InjectRepository(Cancha)
    private canchasRepository: Repository<Cancha>,
    private localesService: LocalesService,
  ) {}

  async findAll(soloActivas = false, idLocal?: number) {
    const where: Record<string, unknown> = {};
    if (soloActivas) where.estado = 'activa';
    if (idLocal) where.idLocal = idLocal;

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

  async create(createDto: CreateCanchaDto, usuario: Usuario) {
    let idLocal: number;

    if (usuario.rol === 'admin_local') {
      if (!usuario.idLocal) {
        throw new BadRequestException('Primero debes registrar tu local');
      }
      idLocal = usuario.idLocal;
    } else {
      if (!createDto.idLocal) {
        throw new BadRequestException('idLocal es requerido');
      }
      idLocal = createDto.idLocal;
    }

    const { idLocal: _omitido, ...resto } = createDto;
    const cancha = this.canchasRepository.create({ ...resto, idLocal });
    const guardada = await this.canchasRepository.save(cancha);
    return { data: guardada, message: 'Cancha creada exitosamente' };
  }

  async update(id: number, updateDto: UpdateCanchaDto, usuario: Usuario) {
    const cancha = await this.canchasRepository.findOne({ where: { id } });

    if (!cancha) {
      throw new NotFoundException(`Cancha #${id} no encontrada`);
    }

    this.localesService.verificarPropietario(usuario, cancha.idLocal);

    const { idLocal: _omitido, ...resto } = updateDto;
    Object.assign(cancha, resto);
    const actualizada = await this.canchasRepository.save(cancha);
    return { data: actualizada, message: 'Cancha actualizada' };
  }

  async remove(id: number, usuario: Usuario) {
    const cancha = await this.canchasRepository.findOne({ where: { id } });

    if (!cancha) {
      throw new NotFoundException(`Cancha #${id} no encontrada`);
    }

    this.localesService.verificarPropietario(usuario, cancha.idLocal);

    cancha.estado = 'inactiva';
    await this.canchasRepository.save(cancha);
    return { data: null, message: 'Cancha desactivada' };
  }
}
