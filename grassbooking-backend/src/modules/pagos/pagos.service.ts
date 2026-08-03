import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
  ) {}

  async findByReserva(idReserva: number) {
    const pago = await this.pagosRepository.findOne({
      where: { idReserva },
      relations: ['reserva'],
    });

    if (!pago) {
      throw new NotFoundException(`Pago de reserva #${idReserva} no encontrado`);
    }

    return { data: pago, message: 'Pago obtenido' };
  }

  async findPorLocal(idLocal?: number) {
    const query = this.pagosRepository
      .createQueryBuilder('pago')
      .leftJoinAndSelect('pago.reserva', 'reserva')
      .leftJoinAndSelect('reserva.cancha', 'cancha')
      .leftJoinAndSelect('reserva.usuario', 'usuario')
      .orderBy('pago.fechaPago', 'DESC', 'NULLS LAST');

    if (idLocal) {
      query.andWhere('cancha.idLocal = :idLocal', { idLocal });
    }

    const pagos = await query.getMany();
    return { data: pagos, message: 'Pagos obtenidos' };
  }

  async update(id: number, updateDto: UpdatePagoDto, usuario: Usuario) {
    const pago = await this.pagosRepository.findOne({
      where: { id },
      relations: ['reserva', 'reserva.cancha'],
    });

    if (!pago) {
      throw new NotFoundException(`Pago #${id} no encontrado`);
    }

    if (usuario.rol === 'admin_local' && pago.reserva.cancha.idLocal !== usuario.idLocal) {
      throw new ForbiddenException('No tienes permisos sobre este pago');
    }

    pago.estadoPago = updateDto.estadoPago;
    if (updateDto.metodoPago) pago.metodoPago = updateDto.metodoPago;
    if (updateDto.estadoPago === 'pagado') {
      pago.fechaPago = new Date();
      pago.pasarela = 'efectivo';
    }

    const actualizado = await this.pagosRepository.save(pago);
    return { data: actualizado, message: 'Pago actualizado' };
  }
}
