import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ExcepcionesService } from './excepciones.service';
import { CreateExcepcionDto } from './dto/create-excepcion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('excepciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ExcepcionesController {
  constructor(private readonly service: ExcepcionesService) {}

  @Get()
  findByFecha(
    @Query('canchaId', ParseIntPipe) canchaId: number,
    @Query('fecha') fecha: string,
  ) {
    return this.service.findByFecha(canchaId, fecha);
  }

  @Post()
  create(@Body() dto: CreateExcepcionDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
