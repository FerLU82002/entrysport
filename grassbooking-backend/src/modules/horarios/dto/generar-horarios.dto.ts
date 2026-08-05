import { IsNumber, IsEnum, IsString, Matches, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DiaSemana } from '../entities/horario.entity';

const DIAS: DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

export class GenerarHorariosDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  idCancha: number;

  @ApiProperty({ example: '08:00', description: 'Hora de inicio del primer turno' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato HH:MM requerido' })
  horaApertura: string;

  @ApiProperty({ example: '23:00', description: 'Hora de inicio del último turno' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato HH:MM requerido' })
  horaCierre: string;

  @ApiProperty({ example: DIAS, isArray: true, enum: DIAS })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(DIAS, { each: true })
  dias: DiaSemana[];
}
