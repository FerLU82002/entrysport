import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Reserva } from '../../reservas/entities/reserva.entity';
import { Notificacion } from '../../notificaciones/entities/notificacion.entity';
import { Local } from '../../locales/entities/local.entity';

export type RolUsuario = 'usuario' | 'admin_local' | 'super_admin';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ length: 15, nullable: true })
  telefono: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: ['usuario', 'admin_local', 'super_admin'],
    default: 'usuario',
  })
  rol: RolUsuario;

  @Column({ name: 'id_local', type: 'integer', nullable: true })
  idLocal: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Reserva, (reserva) => reserva.usuario)
  reservas: Reserva[];

  @OneToMany(() => Notificacion, (notificacion) => notificacion.usuario)
  notificaciones: Notificacion[];

  @ManyToOne(() => Local, (local) => local.administradores, { nullable: true })
  @JoinColumn({ name: 'id_local' })
  local: Local;
}
