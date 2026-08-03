import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Local } from './entities/local.entity';
import { ConfiguracionPago } from './entities/configuracion-pago.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { LocalesService } from './locales.service';
import { LocalesController } from './locales.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Local, ConfiguracionPago, Usuario])],
  controllers: [LocalesController],
  providers: [LocalesService],
  exports: [LocalesService],
})
export class LocalesModule {}
