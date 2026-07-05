import { Controller, Get, Patch, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PagosService } from './pagos.service';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Pagos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Get('reserva/:id')
  @ApiOperation({ summary: 'Obtener pago de una reserva [ADMIN]' })
  findByReserva(@Param('id', ParseIntPipe) id: number) {
    return this.pagosService.findByReserva(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Registrar/actualizar pago [ADMIN]' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePagoDto,
  ) {
    return this.pagosService.update(id, updateDto);
  }
}
