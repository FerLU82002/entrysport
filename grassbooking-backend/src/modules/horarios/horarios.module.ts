import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorariosController } from './horarios.controller';
import { HorariosService } from './horarios.service';
import { Horario } from './entities/horario.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { ExcepcionesModule } from '../excepciones/excepciones.module';
import { CanchasModule } from '../canchas/canchas.module';
import { LocalesModule } from '../locales/locales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Horario, Reserva]),
    ExcepcionesModule,
    CanchasModule,
    LocalesModule,
  ],
  controllers: [HorariosController],
  providers: [HorariosService],
  exports: [HorariosService],
})
export class HorariosModule {}
