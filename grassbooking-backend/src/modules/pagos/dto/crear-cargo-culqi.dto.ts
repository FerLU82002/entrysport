import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearCargoCulqiDto {
  @ApiProperty({ description: 'Token generado en el navegador con Culqi.js (tkn_...)' })
  @IsString()
  @IsNotEmpty()
  tokenId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}
