import { Controller, Get, Patch, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface ReqUser extends Request {
  user: { id: number };
}

@ApiTags('Notificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Mis notificaciones' })
  findAll(@Request() req: ReqUser) {
    return this.notificacionesService.findMisNotificaciones(req.user.id);
  }

  @Patch(':id/leer')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  marcarLeida(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: ReqUser,
  ) {
    return this.notificacionesService.marcarLeida(id, req.user.id);
  }
}
