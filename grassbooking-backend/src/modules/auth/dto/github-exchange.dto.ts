import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GithubExchangeDto {
  @ApiProperty({ description: 'Código de autorización recibido de GitHub' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
