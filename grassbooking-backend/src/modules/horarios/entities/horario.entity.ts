import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cancha } from '../../canchas/entities/cancha.entity';

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

@Entity('horarios')
export class Horario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_cancha' })
  idCancha: number;

  @Column({
    name: 'dia_semana',
    type: 'enum',
    enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
  })
  diaSemana: DiaSemana;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin: string;

  @Column({ default: true })
  disponible: boolean;

  @ManyToOne(() => Cancha, (cancha) => cancha.horarios)
  @JoinColumn({ name: 'id_cancha' })
  cancha: Cancha;
}
