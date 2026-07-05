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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CanchasService } from './canchas.service';
import { CreateCanchaDto } from './dto/create-cancha.dto';
import { UpdateCanchaDto } from './dto/update-cancha.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Canchas')
@Controller('canchas')
export class CanchasController {
  constructor(private readonly canchasService: CanchasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar canchas activas (público)' })
  findAll(@Query('todas') todas?: string) {
    return this.canchasService.findAll(todas !== 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de cancha (público)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.canchasService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear cancha [ADMIN]' })
  create(@Body() createDto: CreateCanchaDto) {
    return this.canchasService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar cancha [ADMIN]' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCanchaDto,
  ) {
    return this.canchasService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar cancha [ADMIN]' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.canchasService.remove(id);
  }
}
