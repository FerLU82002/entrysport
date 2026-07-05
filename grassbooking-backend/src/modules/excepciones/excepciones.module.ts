import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorarioExcepcion } from './entities/horario-excepcion.entity';
import { ExcepcionesService } from './excepciones.service';
import { ExcepcionesController } from './excepciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HorarioExcepcion])],
  controllers: [ExcepcionesController],
  providers: [ExcepcionesService],
  exports: [ExcepcionesService],
})
export class ExcepcionesModule {}
