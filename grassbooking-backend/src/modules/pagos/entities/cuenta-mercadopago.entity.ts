import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Local } from '../../locales/entities/local.entity';

export type EstadoConexionMP = 'pendiente' | 'conectada' | 'desconectada' | 'error';

@Entity('cuentas_mercadopago')
export class CuentaMercadoPago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_local', unique: true })
  idLocal: number;

  @Column({ name: 'mercadopago_user_id', type: 'text', nullable: true })
  mercadoPagoUserId: string | null;

  @Column({ name: 'public_key', type: 'text', nullable: true })
  publicKey: string | null;

  @Column({ name: 'access_token_enc', type: 'text', nullable: true })
  accessTokenEnc: string | null;

  @Column({ name: 'refresh_token_enc', type: 'text', nullable: true })
  refreshTokenEnc: string | null;

  @Column({ name: 'token_type', length: 30, default: 'bearer' })
  tokenType: string;

  @Column({ type: 'text', nullable: true })
  scope: string | null;

  @Column({ name: 'expira_en', type: 'timestamp', nullable: true })
  expiraEn: Date | null;

  @Column({ name: 'live_mode', type: 'boolean', default: false })
  liveMode: boolean;

  @Column({
    type: 'enum',
    enum: ['pendiente', 'conectada', 'desconectada', 'error'],
    default: 'pendiente',
  })
  estado: EstadoConexionMP;

  @Column({ name: 'error_mensaje', type: 'text', nullable: true })
  errorMensaje: string | null;

  @Column({ name: 'conectado_en', type: 'timestamp', nullable: true })
  conectadoEn: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;

  @OneToOne(() => Local)
  @JoinColumn({ name: 'id_local' })
  local: Local;
}
