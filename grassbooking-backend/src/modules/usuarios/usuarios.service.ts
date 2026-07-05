import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  async findAll() {
    const usuarios = await this.usuariosRepository.find({
      select: ['id', 'nombre', 'email', 'telefono', 'rol', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
    return { data: usuarios, message: 'Usuarios obtenidos' };
  }

  async findOne(id: number) {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      select: ['id', 'nombre', 'email', 'telefono', 'rol', 'createdAt'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario #${id} no encontrado`);
    }

    return { data: usuario, message: 'Usuario obtenido' };
  }

  async update(id: number, updateDto: UpdateUsuarioDto) {
    const usuario = await this.usuariosRepository.findOne({ where: { id } });

    if (!usuario) {
      throw new NotFoundException(`Usuario #${id} no encontrado`);
    }

    Object.assign(usuario, updateDto);
    const actualizado = await this.usuariosRepository.save(usuario);

    const { passwordHash: _, ...sinPassword } = actualizado;
    return { data: sinPassword, message: 'Usuario actualizado' };
  }

  async remove(id: number) {
    const usuario = await this.usuariosRepository.findOne({ where: { id } });

    if (!usuario) {
      throw new NotFoundException(`Usuario #${id} no encontrado`);
    }

    await this.usuariosRepository.remove(usuario);
    return { data: null, message: 'Usuario eliminado' };
  }
}
