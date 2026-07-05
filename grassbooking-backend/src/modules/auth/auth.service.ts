import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    private jwtService: JwtService,
  ) {}

  async registrar(registerDto: RegisterDto) {
    const existente = await this.usuariosRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existente) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const usuario = this.usuariosRepository.create({
      nombre: registerDto.nombre,
      email: registerDto.email,
      telefono: registerDto.telefono,
      passwordHash,
      rol: 'usuario',
    });

    const usuarioGuardado = await this.usuariosRepository.save(usuario);

    const { passwordHash: _, ...usuarioSinPassword } = usuarioGuardado;
    return {
      data: usuarioSinPassword,
      message: 'Usuario registrado exitosamente',
    };
  }

  async login(loginDto: LoginDto) {
    const usuario = await this.usuariosRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValida = await bcrypt.compare(
      loginDto.password,
      usuario.passwordHash,
    );

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    const token = this.jwtService.sign(payload);

    return {
      data: {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          telefono: usuario.telefono,
          rol: usuario.rol,
        },
      },
      message: 'Inicio de sesión exitoso',
    };
  }

  async validarCredenciales(email: string, password: string) {
    const usuario = await this.usuariosRepository.findOne({
      where: { email },
    });

    if (!usuario) return null;

    const valida = await bcrypt.compare(password, usuario.passwordHash);
    if (!valida) return null;

    return usuario;
  }

  async obtenerPerfil(userId: number) {
    const usuario = await this.usuariosRepository.findOne({
      where: { id: userId },
      select: ['id', 'nombre', 'email', 'telefono', 'rol', 'createdAt'],
    });

    return { data: usuario, message: 'Perfil obtenido' };
  }
}
