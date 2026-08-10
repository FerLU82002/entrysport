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
import { CreateReservaManualDto } from './dto/create-reserva-manual.dto';
import { UpdateEstadoReservaDto } from './dto/update-reserva.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

interface ReqUser extends Request {
  user: { id: number; rol: string; idLocal: number | null };
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
  @Roles('super_admin', 'admin_local')
  @ApiOperation({ summary: 'Todas las reservas [SUPER_ADMIN, ADMIN_LOCAL]' })
  @ApiQuery({ name: 'fecha', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'id_cancha', required: false, type: Number })
  findTodas(
    @Request() req: ReqUser,
    @Query('fecha') fecha?: string,
    @Query('estado') estado?: string,
    @Query('id_cancha') idCancha?: number,
  ) {
    const isAdminLocal = req.user.rol === 'admin_local';
    if (isAdminLocal && !req.user.idLocal) {
      return { data: [], message: 'Aún no tienes un local asignado' };
    }
    const idLocal = isAdminLocal ? req.user.idLocal ?? undefined : undefined;
    return this.reservasService.findTodas({ fecha, estado, idCancha, idLocal });
  }

  @Get('hoy')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin_local')
  @ApiOperation({ summary: 'Reservas del día [SUPER_ADMIN, ADMIN_LOCAL]' })
  findHoy(@Request() req: ReqUser) {
    const isAdminLocal = req.user.rol === 'admin_local';
    if (isAdminLocal && !req.user.idLocal) {
      return { data: [], message: 'Aún no tienes un local asignado' };
    }
    const idLocal = isAdminLocal ? req.user.idLocal ?? undefined : undefined;
    return this.reservasService.findHoy(idLocal);
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

  @Post('manual')
  @UseGuards(RolesGuard)
  @Roles('admin_local', 'super_admin')
  @ApiOperation({ summary: 'Registrar reserva manual (cliente en local) [ADMIN_LOCAL]' })
  createManual(@Body() dto: CreateReservaManualDto, @Request() req: ReqUser) {
    const idLocal = req.user.idLocal ?? 0;
    return this.reservasService.createManual(dto, req.user.id, idLocal);
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar reserva (≥2h antes) [USUARIO]' })
  cancelar(@Param('id', ParseIntPipe) id: number, @Request() req: ReqUser) {
    return this.reservasService.cancelarPorUsuario(id, req.user.id);
  }

  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin_local')
  @ApiOperation({ summary: 'Cambiar estado de reserva [SUPER_ADMIN, ADMIN_LOCAL]' })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEstadoReservaDto,
    @Request() req: ReqUser,
  ) {
    const idLocal = req.user.rol === 'admin_local' ? req.user.idLocal ?? undefined : undefined;
    return this.reservasService.cambiarEstado(id, updateDto, idLocal);
  }
}
