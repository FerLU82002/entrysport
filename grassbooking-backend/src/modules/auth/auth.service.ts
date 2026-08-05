import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
    private configService: ConfigService,
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

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      idLocal: usuario.idLocal,
    };
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
          idLocal: usuario.idLocal,
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

  async cognitoExchange(code: string) {
    const domain = this.configService.get<string>('COGNITO_DOMAIN', '');
    const clientId = this.configService.get<string>('COGNITO_CLIENT_ID', '');
    const redirectUri = this.configService.get<string>('COGNITO_REDIRECT_URI', '');

    // Intercambiar código por tokens con Cognito
    const tokenResponse = await fetch(`https://${domain}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      throw new UnauthorizedException(`Cognito token error: ${err}`);
    }

    const tokens = await tokenResponse.json();

    // Decodificar id_token para obtener datos del usuario
    const payloadBase64 = tokens.id_token.split('.')[1];
    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8'),
    );

    const email: string = payload.email;
    const nombre: string =
      payload.name ||
      payload['cognito:username'] ||
      email.split('@')[0];

    // Buscar o crear usuario local
    let usuario = await this.usuariosRepository.findOne({ where: { email } });

    if (!usuario) {
      const passwordHash = await bcrypt.hash(
        Math.random().toString(36) + Date.now(),
        10,
      );
      usuario = this.usuariosRepository.create({
        nombre,
        email,
        passwordHash,
        rol: 'usuario',
      });
      usuario = await this.usuariosRepository.save(usuario);
    }

    // Emitir JWT propio
    const jwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      idLocal: usuario.idLocal,
    };
    const token = this.jwtService.sign(jwtPayload);

    return {
      data: {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          telefono: usuario.telefono,
          rol: usuario.rol,
          idLocal: usuario.idLocal,
        },
      },
      message: 'Inicio de sesión con Cognito exitoso',
    };
  }

  async obtenerPerfil(userId: number) {
    const usuario = await this.usuariosRepository.findOne({
      where: { id: userId },
      select: ['id', 'nombre', 'email', 'telefono', 'rol', 'idLocal', 'createdAt'],
    });

    return { data: usuario, message: 'Perfil obtenido' };
  }
}
