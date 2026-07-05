import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('ocupacion')
  @ApiOperation({ summary: 'Reporte de ocupación por fecha [ADMIN]' })
  @ApiQuery({ name: 'desde', example: '2024-01-01' })
  @ApiQuery({ name: 'hasta', example: '2024-12-31' })
  getOcupacion(@Query('desde') desde: string, @Query('hasta') hasta: string) {
    return this.reportesService.getOcupacion(desde, hasta);
  }

  @Get('ingresos')
  @ApiOperation({ summary: 'Reporte de ingresos por semana [ADMIN]' })
  @ApiQuery({ name: 'desde', example: '2024-01-01' })
  @ApiQuery({ name: 'hasta', example: '2024-12-31' })
  getIngresos(@Query('desde') desde: string, @Query('hasta') hasta: string) {
    return this.reportesService.getIngresos(desde, hasta);
  }

  @Get('reservas')
  @ApiOperation({ summary: 'Resumen estadístico de reservas [ADMIN]' })
  @ApiQuery({ name: 'desde', example: '2024-01-01' })
  @ApiQuery({ name: 'hasta', example: '2024-12-31' })
  getResumenReservas(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.getResumenReservas(desde, hasta);
  }
}
