import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CreateAdminLocalDto } from './dto/create-admin-local.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Listar todos los usuarios [SUPER_ADMIN]' })
  findAll() {
    return this.usuariosService.findAll();
  }

  @Post('admin-local')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Crear cuenta de administrador de local [SUPER_ADMIN]' })
  crearAdminLocal(@Body() dto: CreateAdminLocalDto) {
    return this.usuariosService.crearAdminLocal(dto);
  }

  @Get(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Obtener usuario por ID [SUPER_ADMIN]' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Patch(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Actualizar usuario [SUPER_ADMIN]' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Eliminar usuario [SUPER_ADMIN]' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
