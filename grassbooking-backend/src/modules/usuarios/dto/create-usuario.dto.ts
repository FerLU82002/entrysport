import { IsEmail, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  telefono?: string;
}
