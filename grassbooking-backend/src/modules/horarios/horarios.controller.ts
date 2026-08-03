import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HorariosService } from './horarios.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

interface ReqUser extends Request {
  user: Usuario;
}

@ApiTags('Horarios')
@Controller('horarios')
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Get('disponibilidad')
  @ApiOperation({ summary: 'Obtener disponibilidad de slots para una fecha' })
  @ApiQuery({ name: 'id_cancha', type: Number })
  @ApiQuery({ name: 'fecha', type: String, example: '2024-12-25' })
  getDisponibilidad(
    @Query('id_cancha', ParseIntPipe) idCancha: number,
    @Query('fecha') fecha: string,
  ) {
    return this.horariosService.getDisponibilidad(idCancha, fecha);
  }

  @Get(':id_cancha')
  @ApiOperation({ summary: 'Obtener horarios de una cancha' })
  findByCancha(@Param('id_cancha', ParseIntPipe) idCancha: number) {
    return this.horariosService.findByCancha(idCancha);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear horario [SUPER_ADMIN, ADMIN_LOCAL dueño]' })
  create(@Body() createDto: CreateHorarioDto, @Request() req: ReqUser) {
    return this.horariosService.create(createDto, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar horario [SUPER_ADMIN, ADMIN_LOCAL dueño]' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateHorarioDto,
    @Request() req: ReqUser,
  ) {
    return this.horariosService.update(id, updateDto, req.user);
  }
}
