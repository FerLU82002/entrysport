import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanchasController } from './canchas.controller';
import { CanchasService } from './canchas.service';
import { Cancha } from './entities/cancha.entity';
import { LocalesModule } from '../locales/locales.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cancha]), LocalesModule],
  controllers: [CanchasController],
  providers: [CanchasService],
  exports: [CanchasService, TypeOrmModule],
})
export class CanchasModule {}
