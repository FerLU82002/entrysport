import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  ArrayMaxSize,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCanchaDto {
  @ApiProperty({ required: false, description: 'Solo requerido cuando lo crea un SUPER_ADMIN' })
  @IsOptional()
  @IsInt()
  idLocal?: number;

  @ApiProperty({ example: 'Cancha 1 - Fútbol 7' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'Fútbol', description: 'Fútbol, Pádel, Vóley, Básquet, Tenis, etc.' })
  @IsString()
  @MaxLength(50)
  deporte: string;

  @ApiProperty({ example: 'Césped sintético', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipoSuperficie?: string;

  @ApiProperty({ example: 50.0, description: 'Precio por hora en horario diurno' })
  @IsNumber()
  @Min(0)
  precioHoraDia: number;

  @ApiProperty({ example: 70.0, description: 'Precio por hora en horario nocturno' })
  @IsNumber()
  @Min(0)
  precioHoraNoche: number;

  @ApiProperty({ example: '18:00', required: false, description: 'Hora desde la que aplica la tarifa nocturna' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:mm)' })
  horaInicioNoche?: string;

  @ApiProperty({ enum: ['activa', 'inactiva'], default: 'activa', required: false })
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

  @ApiProperty({ required: false, type: [String], description: 'Fotos adicionales de la cancha' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  fotos?: string[];
}
