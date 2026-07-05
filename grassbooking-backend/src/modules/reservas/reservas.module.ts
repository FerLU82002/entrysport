import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';
import { Reserva } from './entities/reserva.entity';
import { Cancha } from '../canchas/entities/cancha.entity';
import { Notificacion } from '../notificaciones/entities/notificacion.entity';
import { Pago } from '../pagos/entities/pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, Cancha, Notificacion, Pago])],
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [ReservasService, TypeOrmModule],
})
export class ReservasModule {}
