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
  Request,
} from '@nestjs/common';
import { ExcepcionesService } from './excepciones.service';
import { CreateExcepcionDto } from './dto/create-excepcion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

interface ReqUser extends Request {
  user: Usuario;
}

@Controller('excepciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin_local')
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
  create(@Body() dto: CreateExcepcionDto, @Request() req: ReqUser) {
    return this.service.create(dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: ReqUser) {
    return this.service.remove(id, req.user);
  }
}
