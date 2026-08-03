import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const CARPETA_DESTINO = join(process.cwd(), 'uploads', 'imagenes');
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

const EXTENSION_POR_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

if (!existsSync(CARPETA_DESTINO)) {
  mkdirSync(CARPETA_DESTINO, { recursive: true });
}

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  @Post('imagen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin_local', 'super_admin')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir una foto de cancha o local [ADMIN_LOCAL, SUPER_ADMIN]' })
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: CARPETA_DESTINO,
        filename: (req, file, callback) => {
          const extension = EXTENSION_POR_MIME[file.mimetype];
          if (!extension) {
            return callback(new BadRequestException('Formato de imagen no soportado'), '');
          }
          callback(null, `${randomUUID()}${extension}`);
        },
      }),
      limits: { fileSize: TAMANO_MAXIMO_BYTES },
      fileFilter: (req, file, callback) => {
        if (!EXTENSION_POR_MIME[file.mimetype]) {
          return callback(
            new BadRequestException('Solo se aceptan imágenes JPG, PNG o WEBP'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  subirImagen(@UploadedFile() archivo: Express.Multer.File) {
    if (!archivo) {
      throw new BadRequestException('No se recibió ninguna imagen');
    }

    return {
      data: { url: `/uploads/imagenes/${archivo.filename}` },
      message: 'Imagen subida exitosamente',
    };
  }
}
