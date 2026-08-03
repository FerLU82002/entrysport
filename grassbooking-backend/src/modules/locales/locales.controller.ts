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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LocalesService } from './locales.service';
import { CreateLocalDto } from './dto/create-local.dto';
import { UpdateLocalDto } from './dto/update-local.dto';
import { UpdateConfiguracionPagoDto } from './dto/update-configuracion-pago.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

interface ReqUser extends Request {
  user: Usuario;
}

@ApiTags('Locales')
@Controller('locales')
export class LocalesController {
  constructor(private readonly localesService: LocalesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar locales activos con sus canchas (público - marketplace)' })
  findAllPublic() {
    return this.localesService.findAllPublic();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los locales [SUPER_ADMIN]' })
  findAllAdmin() {
    return this.localesService.findAllAdmin();
  }

  @Get('mi-local')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mi local [ADMIN_LOCAL]' })
  obtenerMiLocal(@Request() req: ReqUser) {
    return this.localesService.obtenerMiLocal(req.user);
  }

  @Post('mi-local')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar mi local (primera vez) [ADMIN_LOCAL]' })
  crearMiLocal(@Request() req: ReqUser, @Body() createDto: CreateLocalDto) {
    return this.localesService.crearMiLocal(req.user, createDto);
  }

  @Patch('mi-local')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar mi local [ADMIN_LOCAL]' })
  actualizarMiLocal(@Request() req: ReqUser, @Body() updateDto: UpdateLocalDto) {
    if (!req.user.idLocal) {
      return this.localesService.crearMiLocal(req.user, updateDto as CreateLocalDto);
    }
    return this.localesService.actualizar(req.user, req.user.idLocal, updateDto);
  }

  @Get('mi-local/config-pago')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener configuración de pasarelas de pago de mi local [ADMIN_LOCAL]' })
  obtenerMiConfigPago(@Request() req: ReqUser) {
    return this.localesService.obtenerConfigPago(req.user, req.user.idLocal);
  }

  @Patch('mi-local/config-pago')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configurar Culqi / Mercado Pago de mi local [ADMIN_LOCAL]' })
  actualizarMiConfigPago(@Request() req: ReqUser, @Body() dto: UpdateConfiguracionPagoDto) {
    return this.localesService.actualizarConfigPago(req.user, req.user.idLocal, dto);
  }

  @Get(':id/config-pago/publica')
  @ApiOperation({ summary: 'Métodos de pago disponibles de un local (público, sin datos sensibles)' })
  obtenerConfigPagoPublica(@Param('id', ParseIntPipe) id: number) {
    return this.localesService.obtenerConfigPagoPublica(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un local con sus canchas (público)' })
  findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.localesService.findOnePublic(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear local sin dueño asignado [SUPER_ADMIN]' })
  crear(@Body() createDto: CreateLocalDto) {
    return this.localesService.crear(createDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar local [SUPER_ADMIN, ADMIN_LOCAL dueño]' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: ReqUser,
    @Body() updateDto: UpdateLocalDto,
  ) {
    return this.localesService.actualizar(req.user, id, updateDto);
  }
}
