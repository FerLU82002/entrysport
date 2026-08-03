import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
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

  @ApiProperty({ example: 'ClaveTemporal123!' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener mayúscula, minúscula y número',
  })
  password: string;
}
