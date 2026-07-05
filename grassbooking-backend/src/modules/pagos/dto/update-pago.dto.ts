import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePagoDto {
  @ApiProperty({ enum: ['pendiente', 'pagado', 'reembolsado'] })
  @IsEnum(['pendiente', 'pagado', 'reembolsado'])
  estadoPago: 'pendiente' | 'pagado' | 'reembolsado';

  @ApiProperty({ example: 'efectivo', required: false })
  @IsOptional()
  @IsString()
  metodoPago?: string;
}
