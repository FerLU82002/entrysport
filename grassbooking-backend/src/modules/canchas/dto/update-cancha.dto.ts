import { PartialType } from '@nestjs/swagger';
import { CreateCanchaDto } from './create-cancha.dto';

export class UpdateCanchaDto extends PartialType(CreateCanchaDto) {}
