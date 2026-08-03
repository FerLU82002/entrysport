import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CanchasService } from './canchas.service';
import { CreateCanchaDto } from './dto/create-cancha.dto';
import { UpdateCanchaDto } from './dto/update-cancha.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

interface ReqUser extends Request {
  user: Usuario;
}

@ApiTags('Canchas')
@Controller('canchas')
export class CanchasController {
  constructor(private readonly canchasService: CanchasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar canchas activas (público)' })
  @ApiQuery({ name: 'idLocal', required: false, type: Number })
  findAll(@Query('idLocal') idLocal?: number) {
    return this.canchasService.findAll(true, idLocal ? Number(idLocal) : undefined);
  }

  @Get('mi-local')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar mis espacios deportivos (activos e inactivos) [ADMIN_LOCAL]' })
  findMisCanchas(@Request() req: ReqUser) {
    return this.canchasService.findAll(false, req.user.idLocal ?? undefined);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las canchas [SUPER_ADMIN]' })
  findAllAdmin(@Query('idLocal') idLocal?: number) {
    return this.canchasService.findAll(false, idLocal ? Number(idLocal) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de cancha (público)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.canchasService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear espacio deportivo [SUPER_ADMIN, ADMIN_LOCAL]' })
  create(@Body() createDto: CreateCanchaDto, @Request() req: ReqUser) {
    return this.canchasService.create(createDto, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar espacio deportivo [SUPER_ADMIN, ADMIN_LOCAL dueño]' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCanchaDto,
    @Request() req: ReqUser,
  ) {
    return this.canchasService.update(id, updateDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin_local')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar espacio deportivo [SUPER_ADMIN, ADMIN_LOCAL dueño]' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: ReqUser) {
    return this.canchasService.remove(id, req.user);
  }
}
