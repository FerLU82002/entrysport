import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Local } from './entities/local.entity';
import { ConfiguracionPago } from './entities/configuracion-pago.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreateLocalDto } from './dto/create-local.dto';
import { UpdateLocalDto } from './dto/update-local.dto';
import { UpdateConfiguracionPagoDto } from './dto/update-configuracion-pago.dto';
import { encriptar, desencriptar } from '../../common/utils/crypto.util';

@Injectable()
export class LocalesService {
  constructor(
    @InjectRepository(Local)
    private localesRepository: Repository<Local>,
    @InjectRepository(ConfiguracionPago)
    private configPagoRepository: Repository<ConfiguracionPago>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  /** Lanza ForbiddenException si el usuario admin_local no es dueño de este local */
  verificarPropietario(usuario: Usuario, idLocal: number) {
    if (usuario.rol === 'super_admin') return;
    if (usuario.rol !== 'admin_local' || usuario.idLocal !== idLocal) {
      throw new ForbiddenException('No tienes permisos sobre este local');
    }
  }

  async findAllPublic() {
    const locales = await this.localesRepository.find({
      where: { estado: 'activo' },
      relations: ['canchas'],
      order: { nombre: 'ASC' },
    });

    const data = locales.map((local) => ({
      ...local,
      canchas: local.canchas.filter((c) => c.estado === 'activa'),
    }));

    return { data, message: 'Locales obtenidos' };
  }

  async findOnePublic(id: number) {
    const local = await this.localesRepository.findOne({
      where: { id, estado: 'activo' },
      relations: ['canchas'],
    });

    if (!local) {
      throw new NotFoundException(`Local #${id} no encontrado`);
    }

    local.canchas = local.canchas.filter((c) => c.estado === 'activa');
    return { data: local, message: 'Local obtenido' };
  }

  async findAllAdmin() {
    const locales = await this.localesRepository.find({
      relations: ['canchas', 'administradores'],
      order: { createdAt: 'DESC' },
    });

    const data = locales.map((local) => ({
      ...local,
      administradores: local.administradores?.map(({ passwordHash: _, ...resto }) => resto),
    }));

    return { data, message: 'Locales obtenidos' };
  }

  async crear(createDto: CreateLocalDto) {
    const local = this.localesRepository.create({ ...createDto, estado: 'activo' });
    const guardado = await this.localesRepository.save(local);
    await this.configPagoRepository.save(
      this.configPagoRepository.create({ idLocal: guardado.id }),
    );
    return { data: guardado, message: 'Local creado exitosamente' };
  }

  async crearMiLocal(usuario: Usuario, createDto: CreateLocalDto) {
    if (usuario.idLocal) {
      throw new ConflictException('Ya tienes un local registrado');
    }

    const local = this.localesRepository.create({ ...createDto, estado: 'activo' });
    const guardado = await this.localesRepository.save(local);
    await this.configPagoRepository.save(
      this.configPagoRepository.create({ idLocal: guardado.id }),
    );

    await this.usuariosRepository.update(usuario.id, { idLocal: guardado.id });

    return { data: guardado, message: 'Local creado exitosamente' };
  }

  async obtenerMiLocal(usuario: Usuario) {
    if (!usuario.idLocal) {
      throw new NotFoundException('Aún no has registrado tu local');
    }
    return this.obtenerPorId(usuario.idLocal);
  }

  async obtenerPorId(id: number) {
    const local = await this.localesRepository.findOne({
      where: { id },
      relations: ['canchas'],
    });

    if (!local) {
      throw new NotFoundException(`Local #${id} no encontrado`);
    }

    return { data: local, message: 'Local obtenido' };
  }

  async actualizar(usuario: Usuario, id: number, updateDto: UpdateLocalDto) {
    this.verificarPropietario(usuario, id);

    const local = await this.localesRepository.findOne({ where: { id } });
    if (!local) {
      throw new NotFoundException(`Local #${id} no encontrado`);
    }

    if (updateDto.estado && usuario.rol !== 'super_admin') {
      delete updateDto.estado;
    }

    Object.assign(local, updateDto);
    const actualizado = await this.localesRepository.save(local);
    return { data: actualizado, message: 'Local actualizado' };
  }

  private async obtenerOCrearConfig(idLocal: number): Promise<ConfiguracionPago> {
    let config = await this.configPagoRepository.findOne({ where: { idLocal } });
    if (!config) {
      config = await this.configPagoRepository.save(
        this.configPagoRepository.create({ idLocal }),
      );
    }
    return config;
  }

  async obtenerConfigPago(usuario: Usuario, idLocal: number | null) {
    if (!idLocal) {
      throw new NotFoundException('Aún no has registrado tu local');
    }
    this.verificarPropietario(usuario, idLocal);
    const config = await this.obtenerOCrearConfig(idLocal);
    const { culqiSecretKeyEnc: _c, ...publico } = config;
    return {
      data: {
        ...publico,
        culqiSecretConfigurada: !!config.culqiSecretKeyEnc,
      },
      message: 'Configuración de pago obtenida',
    };
  }

  async actualizarConfigPago(
    usuario: Usuario,
    idLocal: number | null,
    dto: UpdateConfiguracionPagoDto,
  ) {
    if (!idLocal) {
      throw new NotFoundException('Aún no has registrado tu local');
    }
    this.verificarPropietario(usuario, idLocal);
    const config = await this.obtenerOCrearConfig(idLocal);

    if (dto.moneda !== undefined) config.moneda = dto.moneda;
    if (dto.aceptaEfectivo !== undefined) config.aceptaEfectivo = dto.aceptaEfectivo;
    if (dto.culqiActivo !== undefined) config.culqiActivo = dto.culqiActivo;
    if (dto.culqiPublicKey !== undefined) config.culqiPublicKey = dto.culqiPublicKey;
    if (dto.culqiSecretKey) config.culqiSecretKeyEnc = encriptar(dto.culqiSecretKey);
    if (dto.yapeActivo !== undefined) config.yapeActivo = dto.yapeActivo;
    if (dto.yapeQrUrl !== undefined) config.yapeQrUrl = dto.yapeQrUrl;
    if (dto.yapeTelefono !== undefined) config.yapeTelefono = dto.yapeTelefono;
    if (dto.descuentoPct !== undefined) config.descuentoPct = dto.descuentoPct;
    if (dto.adelantoPct !== undefined) config.adelantoPct = dto.adelantoPct;

    const guardado = await this.configPagoRepository.save(config);
    const { culqiSecretKeyEnc: _c, ...publico } = guardado;
    return { data: publico, message: 'Configuración de pago actualizada' };
  }

  /** Uso interno del servidor (Culqi). Nunca exponer por un controller. */
  async obtenerCredencialesCulqi(idLocal: number) {
    const config = await this.obtenerOCrearConfig(idLocal);
    return {
      moneda: config.moneda,
      aceptaEfectivo: config.aceptaEfectivo,
      culqiActivo: config.culqiActivo,
      culqiPublicKey: config.culqiPublicKey,
      culqiSecretKey: config.culqiSecretKeyEnc ? desencriptar(config.culqiSecretKeyEnc) : null,
    };
  }

  /** Moneda configurada del negocio para este local (usada también por el split de Mercado Pago). */
  async obtenerMoneda(idLocal: number): Promise<string> {
    const config = await this.obtenerOCrearConfig(idLocal);
    return config.moneda;
  }

  async obtenerConfigPagoPublica(idLocal: number) {
    const config = await this.obtenerOCrearConfig(idLocal);
    const yapeListo = config.yapeActivo && !!config.yapeQrUrl && !!config.yapeTelefono;
    return {
      data: {
        moneda: config.moneda,
        aceptaEfectivo: config.aceptaEfectivo,
        culqiActivo: config.culqiActivo && !!config.culqiPublicKey,
        culqiPublicKey: config.culqiActivo ? config.culqiPublicKey : null,
        yapeActivo: yapeListo,
        yapeQrUrl: yapeListo ? config.yapeQrUrl : null,
        yapeTelefono: yapeListo ? config.yapeTelefono : null,
        descuentoPct: Number(config.descuentoPct ?? 0),
        adelantoPct: Number(config.adelantoPct ?? 100),
      },
      message: 'Métodos de pago disponibles',
    };
  }
}
