import {
  IsNumber,
  IsString,
  Matches,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservaDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  idCancha: number;

  @ApiProperty({ example: '2024-12-25' })
  @IsDateString()
  fechaReserva: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato HH:MM requerido' })
  horaInicio: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notas?: string;
}
