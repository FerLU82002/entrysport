import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminLocalDto {
  @ApiProperty({ example: 'Carlos Dueño' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'dueno@canchaejemplo.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(150)
  email: string;

  @ApiProperty({ example: '987654321', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  telefono?: string;

  @ApiProperty({ example: 12, description: 'Longitud de la contraseña temporal (8-20)', default: 12 })
  @IsInt()
  @Min(8)
  @Max(20)
  longitud: number;

  @ApiProperty({ example: 7, description: 'Días de validez de la contraseña temporal (1-30)', default: 7 })
  @IsInt()
  @Min(1)
  @Max(30)
  duracionDias: number;
}
