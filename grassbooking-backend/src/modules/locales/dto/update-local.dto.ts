import { PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateLocalDto } from './create-local.dto';

export class UpdateLocalDto extends PartialType(CreateLocalDto) {
  @IsIn(['activo', 'inactivo'])
  @IsOptional()
  estado?: 'activo' | 'inactivo';
}
