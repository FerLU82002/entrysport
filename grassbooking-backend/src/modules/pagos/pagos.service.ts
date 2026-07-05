import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { UpdatePagoDto } from './dto/update-pago.dto';

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

  async update(id: number, updateDto: UpdatePagoDto) {
    const pago = await this.pagosRepository.findOne({ where: { id } });

    if (!pago) {
      throw new NotFoundException(`Pago #${id} no encontrado`);
    }

    pago.estadoPago = updateDto.estadoPago;
    if (updateDto.metodoPago) pago.metodoPago = updateDto.metodoPago;
    if (updateDto.estadoPago === 'pagado') pago.fechaPago = new Date();

    const actualizado = await this.pagosRepository.save(pago);
    return { data: actualizado, message: 'Pago actualizado' };
  }
}
