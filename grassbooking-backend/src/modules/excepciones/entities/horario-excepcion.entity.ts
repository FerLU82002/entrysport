import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Cancha } from '../../canchas/entities/cancha.entity';

@Entity('horario_excepciones')
export class HorarioExcepcion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_cancha' })
  idCancha: number;

  @Column({ type: 'date' })
  fecha: string;

  // null = bloqueo de todo el día
  @Column({ name: 'hora_inicio', type: 'time', nullable: true })
  horaInicio: string | null;

  @Column({ name: 'hora_fin', type: 'time', nullable: true })
  horaFin: string | null;

  // false = bloqueado, true = habilitado extra (abre un día normalmente cerrado)
  @Column({ default: false })
  disponible: boolean;

  @Column({ nullable: true, length: 200 })
  motivo: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Cancha, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_cancha' })
  cancha: Cancha;
}
