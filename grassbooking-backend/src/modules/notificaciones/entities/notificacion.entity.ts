import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Reserva } from '../../reservas/entities/reserva.entity';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ name: 'id_reserva', nullable: true })
  idReserva: number;

  @Column({
    type: 'enum',
    enum: ['confirmacion', 'cancelacion', 'recordatorio', 'modificacion'],
  })
  tipo: 'confirmacion' | 'cancelacion' | 'recordatorio' | 'modificacion';

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ default: false })
  leida: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.notificaciones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Reserva, (reserva) => reserva.notificaciones)
  @JoinColumn({ name: 'id_reserva' })
  reserva: Reserva;
}
