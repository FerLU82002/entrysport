import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Reserva } from '../../reservas/entities/reserva.entity';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_reserva', unique: true })
  idReserva: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  monto: number;

  @Column({ name: 'metodo_pago', length: 50, default: 'efectivo' })
  metodoPago: string;

  @Column({
    name: 'estado_pago',
    type: 'enum',
    enum: ['pendiente', 'pagado', 'reembolsado'],
    default: 'pendiente',
  })
  estadoPago: 'pendiente' | 'pagado' | 'reembolsado';

  @Column({ name: 'fecha_pago', type: 'timestamp', nullable: true })
  fechaPago: Date;

  @OneToOne(() => Reserva, (reserva) => reserva.pago)
  @JoinColumn({ name: 'id_reserva' })
  reserva: Reserva;
}
