import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('mercadopago_oauth_states')
export class OauthState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_local' })
  idLocal: number;

  @Column({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ type: 'text', unique: true })
  state: string;

  @Column({ type: 'boolean', default: false })
  usado: boolean;

  @Column({ name: 'expira_en', type: 'timestamp' })
  expiraEn: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
