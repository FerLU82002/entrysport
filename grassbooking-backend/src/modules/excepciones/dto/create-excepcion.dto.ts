import {
  IsNumber,
  IsDateString,
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class CreateExcepcionDto {
  @IsNumber()
  idCancha: number;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  horaInicio?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  horaFin?: string;

  @IsOptional()
  @IsBoolean()
  disponible?: boolean;

  @IsOptional()
  @IsString()
  motivo?: string;
}
