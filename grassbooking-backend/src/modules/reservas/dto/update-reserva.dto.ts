import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEstadoReservaDto {
  @ApiProperty({
    enum: ['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'],
  })
  @IsEnum(['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'])
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_asistio';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notas?: string;
}
