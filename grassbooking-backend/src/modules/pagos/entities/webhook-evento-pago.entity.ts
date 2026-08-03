import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type ResultadoWebhook =
  | 'aprobado'
  | 'rechazado'
  | 'ignorado_duplicado'
  | 'pendiente'
  | 'error_validacion';

@Entity('webhook_eventos_pago')
export class WebhookEventoPago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'payment_id', type: 'text' })
  paymentId: string;

  @Column({ name: 'tipo_evento', length: 50, default: 'payment' })
  tipoEvento: string;

  @Column({ name: 'id_reserva_detectada', type: 'integer', nullable: true })
  idReservaDetectada: number | null;

  @Column({
    type: 'enum',
    enum: ['aprobado', 'rechazado', 'ignorado_duplicado', 'pendiente', 'error_validacion'],
  })
  resultado: ResultadoWebhook;

  @Column({ name: 'motivo_rechazo', type: 'text', nullable: true })
  motivoRechazo: string | null;

  @Column({ name: 'payload_crudo', type: 'jsonb', nullable: true })
  payloadCrudo: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'procesado_en' })
  procesadoEn: Date;
}
