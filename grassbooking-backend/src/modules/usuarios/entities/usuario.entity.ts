import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Reserva } from '../../reservas/entities/reserva.entity';
import { Notificacion } from '../../notificaciones/entities/notificacion.entity';

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

  @Column({ type: 'enum', enum: ['usuario', 'admin'], default: 'usuario' })
  rol: 'usuario' | 'admin';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Reserva, (reserva) => reserva.usuario)
  reservas: Reserva[];

  @OneToMany(() => Notificacion, (notificacion) => notificacion.usuario)
  notificaciones: Notificacion[];
}
