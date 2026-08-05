import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CognitoExchangeDto {
  @ApiProperty({ description: 'Código de autorización recibido de Cognito' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
