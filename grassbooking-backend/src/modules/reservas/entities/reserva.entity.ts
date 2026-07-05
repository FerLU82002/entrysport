import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  Generated,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Cancha } from '../../canchas/entities/cancha.entity';
import { Pago } from '../../pagos/entities/pago.entity';
import { Notificacion } from '../../notificaciones/entities/notificacion.entity';

export type EstadoReserva =
  | 'pendiente'
  | 'confirmada'
  | 'cancelada'
  | 'completada'
  | 'no_asistio';

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ name: 'id_cancha' })
  idCancha: number;

  @Column({ name: 'fecha_reserva', type: 'date' })
  fechaReserva: string;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin: string;

  @Column({
    type: 'enum',
    enum: ['pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'],
    default: 'pendiente',
  })
  estado: EstadoReserva;

  @Column({ name: 'monto_total', type: 'decimal', precision: 8, scale: 2 })
  montoTotal: number;

  @Column({ name: 'codigo_reserva', type: 'uuid' })
  @Generated('uuid')
  codigoReserva: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.reservas)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Cancha, (cancha) => cancha.reservas)
  @JoinColumn({ name: 'id_cancha' })
  cancha: Cancha;

  @OneToOne(() => Pago, (pago) => pago.reserva)
  pago: Pago;

  @OneToMany(() => Notificacion, (notificacion) => notificacion.reserva)
  notificaciones: Notificacion[];
}
