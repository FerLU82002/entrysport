import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Pago } from '../pagos/entities/pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, Pago])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
