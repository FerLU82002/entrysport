import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorarioExcepcion } from './entities/horario-excepcion.entity';
import { ExcepcionesService } from './excepciones.service';
import { ExcepcionesController } from './excepciones.controller';
import { CanchasModule } from '../canchas/canchas.module';
import { LocalesModule } from '../locales/locales.module';

@Module({
  imports: [TypeOrmModule.forFeature([HorarioExcepcion]), CanchasModule, LocalesModule],
  controllers: [ExcepcionesController],
  providers: [ExcepcionesService],
  exports: [ExcepcionesService],
})
export class ExcepcionesModule {}
