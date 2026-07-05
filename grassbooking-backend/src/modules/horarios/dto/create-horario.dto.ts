import { IsNumber, IsEnum, IsString, Matches, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DiaSemana } from '../entities/horario.entity';

export class CreateHorarioDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  idCancha: number;

  @ApiProperty({ enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] })
  @IsEnum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'])
  diaSemana: DiaSemana;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM)' })
  horaInicio: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM)' })
  horaFin: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  disponible?: boolean;
}
