import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  Generated,
} from 'typeorm';
import { Reserva } from '../../reservas/entities/reserva.entity';

export type EstadoDistribucion = 'no_aplica' | 'pendiente' | 'distribuido' | 'fallido';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_reserva', unique: true })
  idReserva: number;

  @Column({ name: 'id_local', type: 'integer', nullable: true })
  idLocal: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  monto: number;

  @Column({ name: 'metodo_pago', length: 50, default: 'efectivo' })
  metodoPago: string;

  @Column({
    type: 'enum',
    enum: ['efectivo', 'culqi', 'mercadopago'],
    default: 'efectivo',
  })
  pasarela: 'efectivo' | 'culqi' | 'mercadopago';

  @Column({ name: 'referencia_externa', type: 'text', nullable: true })
  referenciaExterna: string;

  // --- Split de Mercado Pago (marketplace) ---
  @Column({ name: 'mercadopago_account_id', type: 'text', nullable: true })
  mercadoPagoAccountId: string | null;

  @Column({ name: 'preference_id', type: 'text', nullable: true })
  preferenceId: string | null;

  @Column({ name: 'external_reference', type: 'text', nullable: true, unique: true })
  externalReference: string | null;

  @Column({
    name: 'monto_comision_plataforma',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  montoComisionPlataforma: number | null;

  @Column({
    name: 'monto_neto_local',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  montoNetoLocal: number | null;

  @Column({
    name: 'estado_distribucion',
    type: 'enum',
    enum: ['no_aplica', 'pendiente', 'distribuido', 'fallido'],
    default: 'no_aplica',
  })
  estadoDistribucion: EstadoDistribucion;

  @Column({ name: 'idempotency_key', type: 'uuid', unique: true })
  @Generated('uuid')
  idempotencyKey: string;

  @Column({
    name: 'estado_pago',
    type: 'enum',
    enum: ['pendiente', 'pagado', 'reembolsado'],
    default: 'pendiente',
  })
  estadoPago: 'pendiente' | 'pagado' | 'reembolsado';

  @Column({ name: 'fecha_pago', type: 'timestamp', nullable: true })
  fechaPago: Date;

  @UpdateDateColumn({ name: 'fecha_ultima_actualizacion' })
  fechaUltimaActualizacion: Date;

  @OneToOne(() => Reserva, (reserva) => reserva.pago)
  @JoinColumn({ name: 'id_reserva' })
  reserva: Reserva;
}
