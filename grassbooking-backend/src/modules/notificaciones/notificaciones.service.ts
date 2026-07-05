import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private notificacionesRepository: Repository<Notificacion>,
  ) {}

  async findMisNotificaciones(userId: number) {
    const notificaciones = await this.notificacionesRepository.find({
      where: { idUsuario: userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return { data: notificaciones, message: 'Notificaciones obtenidas' };
  }

  async marcarLeida(id: number, userId: number) {
    const notificacion = await this.notificacionesRepository.findOne({
      where: { id, idUsuario: userId },
    });

    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    notificacion.leida = true;
    await this.notificacionesRepository.save(notificacion);
    return { data: notificacion, message: 'Notificación marcada como leída' };
  }

  async contarNoLeidas(userId: number): Promise<number> {
    return this.notificacionesRepository.count({
      where: { idUsuario: userId, leida: false },
    });
  }
}
