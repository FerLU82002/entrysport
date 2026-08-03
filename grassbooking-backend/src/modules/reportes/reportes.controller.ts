import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

interface ReqUser extends Request {
  user: Usuario;
}

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin_local')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  private idLocalDe(req: ReqUser): number | undefined {
    return req.user.rol === 'admin_local' ? req.user.idLocal ?? undefined : undefined;
  }

  @Get('ocupacion')
  @ApiOperation({ summary: 'Reporte de ocupación por fecha [SUPER_ADMIN, ADMIN_LOCAL]' })
  @ApiQuery({ name: 'desde', example: '2024-01-01' })
  @ApiQuery({ name: 'hasta', example: '2024-12-31' })
  getOcupacion(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Request() req: ReqUser,
  ) {
    return this.reportesService.getOcupacion(desde, hasta, this.idLocalDe(req));
  }

  @Get('ingresos')
  @ApiOperation({ summary: 'Reporte de ingresos por semana [SUPER_ADMIN, ADMIN_LOCAL]' })
  @ApiQuery({ name: 'desde', example: '2024-01-01' })
  @ApiQuery({ name: 'hasta', example: '2024-12-31' })
  getIngresos(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Request() req: ReqUser,
  ) {
    return this.reportesService.getIngresos(desde, hasta, this.idLocalDe(req));
  }

  @Get('reservas')
  @ApiOperation({ summary: 'Resumen estadístico de reservas [SUPER_ADMIN, ADMIN_LOCAL]' })
  @ApiQuery({ name: 'desde', example: '2024-01-01' })
  @ApiQuery({ name: 'hasta', example: '2024-12-31' })
  getResumenReservas(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Request() req: ReqUser,
  ) {
    return this.reportesService.getResumenReservas(desde, hasta, this.idLocalDe(req));
  }
}
