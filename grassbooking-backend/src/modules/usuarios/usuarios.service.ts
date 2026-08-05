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

  private generarPasswordTemporal(longitud: number): string {
    const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const todos = mayusculas + minusculas + numeros;

    let password = '';
    password += mayusculas[Math.floor(Math.random() * mayusculas.length)];
    password += minusculas[Math.floor(Math.random() * minusculas.length)];
    password += numeros[Math.floor(Math.random() * numeros.length)];

    for (let i = 3; i < longitud; i++) {
      password += todos[Math.floor(Math.random() * todos.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  async crearAdminLocal(dto: CreateAdminLocalDto) {
    const existente = await this.usuariosRepository.findOne({ where: { email: dto.email } });
    if (existente) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordTemporal = this.generarPasswordTemporal(dto.longitud);
    const passwordHash = await bcrypt.hash(passwordTemporal, 12);

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + dto.duracionDias);

    const usuario = this.usuariosRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono,
      passwordHash,
      rol: 'admin_local',
      mustChangePassword: true,
      tempPasswordExpiry: expiry,
    });

    const guardado = await this.usuariosRepository.save(usuario);
    const { passwordHash: _, ...sinPassword } = guardado;

    return {
      data: {
        ...sinPassword,
        passwordTemporal,
      },
      message: 'Cuenta de administrador de local creada',
    };
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
