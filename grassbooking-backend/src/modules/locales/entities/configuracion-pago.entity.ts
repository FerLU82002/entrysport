import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Local } from './local.entity';

@Entity('configuraciones_pago')
export class ConfiguracionPago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_local', unique: true })
  idLocal: number;

  @Column({ length: 3, default: 'PEN' })
  moneda: string;

  @Column({ name: 'acepta_efectivo', type: 'boolean', default: true })
  aceptaEfectivo: boolean;

  @Column({ name: 'culqi_activo', type: 'boolean', default: false })
  culqiActivo: boolean;

  @Column({ name: 'culqi_public_key', type: 'text', nullable: true })
  culqiPublicKey: string;

  @Column({ name: 'culqi_secret_key_enc', type: 'text', nullable: true })
  culqiSecretKeyEnc: string;

  // La conexión de Mercado Pago ya no se guarda aquí: es OAuth por local,
  // ver entidad CuentaMercadoPago (modules/pagos/entities).

  // Yape es un pago manual (sin API): el cliente escanea el QR, paga por su
  // cuenta y envía el comprobante por WhatsApp al número configurado aquí.
  // No hay nada sensible en estos tres campos: se muestran tal cual al público.
  @Column({ name: 'yape_activo', type: 'boolean', default: false })
  yapeActivo: boolean;

  @Column({ name: 'yape_qr_url', type: 'text', nullable: true })
  yapeQrUrl: string;

  @Column({ name: 'yape_telefono', length: 20, nullable: true })
  yapeTelefono: string;

  // Descuento automático (%) sobre el precio de la cancha. 0 = sin descuento.
  @Column({ name: 'descuento_pct', type: 'decimal', precision: 5, scale: 2, default: 0 })
  descuentoPct: number;

  // Porcentaje del total que el usuario paga al reservar. 100 = pago completo; 0 = paga al llegar.
  @Column({ name: 'adelanto_pct', type: 'decimal', precision: 5, scale: 2, default: 100 })
  adelantoPct: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Local, (local) => local.configuracionPago)
  @JoinColumn({ name: 'id_local' })
  local: Local;
}
