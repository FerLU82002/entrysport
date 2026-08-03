import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MercadoPagoOAuthService } from './mercadopago-oauth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

interface ReqUser extends Request {
  user: Usuario;
}

@ApiTags('Mercado Pago OAuth')
@Controller('pagos/mercadopago/oauth')
export class MercadoPagoOAuthController {
  constructor(
    private readonly oauthService: MercadoPagoOAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('connect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Genera la URL para conectar la cuenta de Mercado Pago de mi local [ADMIN_LOCAL]' })
  iniciarConexion(@Request() req: ReqUser) {
    return this.oauthService.iniciarConexion(req.user);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Callback público de Mercado Pago tras la autorización OAuth' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

    try {
      await this.oauthService.manejarCallback(code, state);
      return res.redirect(`${frontendUrl}/admin/mi-local?mercadopago=conectado`);
    } catch (error) {
      return res.redirect(`${frontendUrl}/admin/mi-local?mercadopago=error`);
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_local', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estado de conexión de Mercado Pago [ADMIN_LOCAL, SUPER_ADMIN]' })
  estado(@Request() req: ReqUser, @Query('idLocal') idLocal?: string) {
    return this.oauthService.obtenerEstado(req.user, idLocal ? Number(idLocal) : undefined);
  }

  @Get('publico/:idLocal')
  @ApiOperation({ summary: 'Si el local tiene Mercado Pago conectado (público, sin datos sensibles)' })
  estadoPublico(@Param('idLocal', ParseIntPipe) idLocal: number) {
    return this.oauthService.obtenerEstadoPublico(idLocal);
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desconecta mi cuenta de Mercado Pago [ADMIN_LOCAL]' })
  desconectar(@Request() req: ReqUser) {
    return this.oauthService.desconectar(req.user);
  }
}
