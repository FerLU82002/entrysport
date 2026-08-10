import { IsBoolean, IsOptional, IsString, MaxLength, Matches, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConfiguracionPagoDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  moneda?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  aceptaEfectivo?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  culqiActivo?: boolean;

  @ApiProperty({ required: false, description: 'Llave pública de Culqi (pk_...)' })
  @IsOptional()
  @IsString()
  culqiPublicKey?: string;

  @ApiProperty({ required: false, description: 'Llave secreta de Culqi (sk_...), se almacena cifrada' })
  @IsOptional()
  @IsString()
  culqiSecretKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  yapeActivo?: boolean;

  @ApiProperty({ required: false, description: 'URL de la foto del QR de Yape (subida vía /uploads/imagen)' })
  @IsOptional()
  @IsString()
  yapeQrUrl?: string;

  @ApiProperty({ required: false, description: 'Número de celular vinculado al QR y usado para WhatsApp' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\s-]{6,20}$/, { message: 'Número de celular inválido' })
  yapeTelefono?: string;

  @ApiProperty({ required: false, description: 'Descuento automático (0-100%) sobre el precio de la cancha' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  descuentoPct?: number;

  @ApiProperty({ required: false, description: 'Porcentaje del total que el usuario paga al reservar (0-100%). 100 = pago completo; 0 = paga todo al llegar.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  adelantoPct?: number;
}
