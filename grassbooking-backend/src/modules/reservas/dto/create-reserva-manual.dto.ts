import {
  IsNumber,
  IsString,
  Matches,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservaManualDto {
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

  @ApiProperty({ required: false, example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  nombreCliente?: string;

  @ApiProperty({ required: false, example: '999888777' })
  @IsOptional()
  @IsString()
  telefonoCliente?: string;

  @ApiProperty({ example: 'efectivo', enum: ['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'] })
  @IsString()
  @IsIn(['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'])
  metodoPago: string;

  @ApiProperty({ example: true, description: 'Si el cliente ya pagó en el momento' })
  @IsBoolean()
  pagado: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notas?: string;
}
