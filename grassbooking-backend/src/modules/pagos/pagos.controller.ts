import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PagosService } from './pagos.service';
import { PagosGatewayService } from './pagos-gateway.service';
import { PagosSplitService } from './pagos-split.service';
import { MercadoPagoWebhookService } from './mercadopago-webhook.service';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { CrearCargoCulqiDto } from './dto/crear-cargo-culqi.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

interface ReqUser extends Request {
  user: Usuario;
}

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
  constructor(
    private readonly pagosService: PagosService,
    private readonly pagosGatewayService: PagosGatewayService,
    private readonly pagosSplitService: PagosSplitService,
    private readonly webhookService: MercadoPagoWebhookService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar pagos [SUPER_ADMIN, ADMIN_LOCAL]' })
  findPorLocal(@Request() req: ReqUser) {
    const idLocal = req.user.rol === 'admin_local' ? req.user.idLocal ?? undefined : undefined;
    return this.pagosService.findPorLocal(idLocal);
  }

  @Get('reserva/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener pago de una reserva [SUPER_ADMIN, ADMIN_LOCAL]' })
  findByReserva(@Param('id', ParseIntPipe) id: number) {
    return this.pagosService.findByReserva(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar/actualizar pago manual (ej. efectivo) [SUPER_ADMIN, ADMIN_LOCAL]' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePagoDto,
    @Request() req: ReqUser,
  ) {
    return this.pagosService.update(id, updateDto, req.user);
  }

  @Post('reserva/:id/culqi')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pagar una reserva con Culqi [USUARIO dueño de la reserva]' })
  pagarConCulqi(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearCargoCulqiDto,
    @Request() req: ReqUser,
  ) {
    return this.pagosGatewayService.crearCargoCulqi(id, req.user.id, dto);
  }

  @Post('reserva/:id/mercadopago')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Inicia el pago Split de una reserva con Mercado Pago, usando la cuenta OAuth del local [USUARIO dueño de la reserva]',
  })
  pagarConMercadoPago(@Param('id', ParseIntPipe) id: number, @Request() req: ReqUser) {
    return this.pagosSplitService.iniciarPago(id, req.user.id);
  }

  @Post('webhook/mercadopago')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook de notificaciones de Mercado Pago (público, verificado por firma)' })
  async webhookMercadoPago(
    @Query('data.id') dataId: string,
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
    @Body() body: { data?: { id?: string }; type?: string },
  ) {
    await this.webhookService.procesarNotificacion({ xSignature, xRequestId, dataId, body });
    // Siempre 200: así Mercado Pago no reintenta indefinidamente notificaciones
    // que ya identificamos como duplicadas o inválidas (quedan igual auditadas).
    return { data: null, message: 'ok' };
  }
}
