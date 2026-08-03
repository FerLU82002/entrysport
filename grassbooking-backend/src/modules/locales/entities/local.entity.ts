import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Cancha } from '../../canchas/entities/cancha.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { ConfiguracionPago } from './configuracion-pago.entity';

@Entity('locales')
export class Local {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ length: 200, nullable: true })
  direccion: string;

  @Column({ length: 20 })
  telefono: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ name: 'imagen_url', type: 'text', nullable: true })
  imagenUrl: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  fotos: string[];

  @Column({ type: 'enum', enum: ['activo', 'inactivo'], default: 'activo' })
  estado: 'activo' | 'inactivo';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Cancha, (cancha) => cancha.local)
  canchas: Cancha[];

  @OneToMany(() => Usuario, (usuario) => usuario.local)
  administradores: Usuario[];

  @OneToOne(() => ConfiguracionPago, (config) => config.local)
  configuracionPago: ConfiguracionPago;
}
