import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCanchaDto {
  @ApiProperty({ example: 'Cancha Grass Bambino' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'Césped sintético', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipoSuperficie?: string;

  @ApiProperty({ example: 50.0 })
  @IsNumber()
  @Min(0)
  precioHora: number;

  @ApiProperty({ enum: ['activa', 'inactiva'], default: 'activa' })
  @IsOptional()
  @IsEnum(['activa', 'inactiva'])
  estado?: 'activa' | 'inactiva';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imagenUrl?: string;
}
