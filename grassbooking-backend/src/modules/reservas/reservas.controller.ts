import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateEstadoReservaDto } from './dto/update-reserva.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

interface ReqUser extends Request {
  user: { id: number; rol: string };
}

@ApiTags('Reservas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Get()
  @ApiOperation({ summary: 'Mis reservas [USUARIO]' })
  findMisReservas(@Request() req: ReqUser) {
    return this.reservasService.findMisReservas(req.user.id);
  }

  @Get('todas')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Todas las reservas [ADMIN]' })
  @ApiQuery({ name: 'fecha', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'id_cancha', required: false, type: Number })
  findTodas(
    @Query('fecha') fecha?: string,
    @Query('estado') estado?: string,
    @Query('id_cancha') idCancha?: number,
  ) {
    return this.reservasService.findTodas({ fecha, estado, idCancha });
  }

  @Get('hoy')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Reservas del día [ADMIN]' })
  findHoy() {
    return this.reservasService.findHoy();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de reserva' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear reserva [USUARIO]' })
  create(@Body() createDto: CreateReservaDto, @Request() req: ReqUser) {
    return this.reservasService.create(createDto, req.user.id);
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar reserva (≥2h antes) [USUARIO]' })
  cancelar(@Param('id', ParseIntPipe) id: number, @Request() req: ReqUser) {
    return this.reservasService.cancelarPorUsuario(id, req.user.id);
  }

  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Cambiar estado de reserva [ADMIN]' })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEstadoReservaDto,
  ) {
    return this.reservasService.cambiarEstado(id, updateDto);
  }
}
