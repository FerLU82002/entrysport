import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CreateAdminLocalDto } from './dto/create-admin-local.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  async findAll() {
    const usuarios = await this.usuariosRepository.find({
      select: ['id', 'nombre', 'email', 'telefono', 'rol', 'idLocal', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
    return { data: usuarios, message: 'Usuarios obtenidos' };
  }

  async crearAdminLocal(dto: CreateAdminLocalDto) {
    const existente = await this.usuariosRepository.findOne({ where: { email: dto.email } });
    if (existente) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const usuario = this.usuariosRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono,
      passwordHash,
      rol: 'admin_local',
    });

    const guardado = await this.usuariosRepository.save(usuario);
    const { passwordHash: _, ...sinPassword } = guardado;
    return { data: sinPassword, message: 'Cuenta de administrador de local creada' };
  }

  async findOne(id: number) {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      select: ['id', 'nombre', 'email', 'telefono', 'rol', 'idLocal', 'createdAt'],
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
