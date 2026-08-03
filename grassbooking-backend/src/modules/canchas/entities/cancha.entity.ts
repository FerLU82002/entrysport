import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Horario } from '../../horarios/entities/horario.entity';
import { Reserva } from '../../reservas/entities/reserva.entity';
import { Local } from '../../locales/entities/local.entity';

@Entity('canchas')
export class Cancha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_local' })
  idLocal: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 50, default: 'Fútbol' })
  deporte: string;

  @Column({ name: 'tipo_superficie', length: 50, default: 'Césped sintético' })
  tipoSuperficie: string;

  @Column({ name: 'precio_hora_dia', type: 'decimal', precision: 8, scale: 2 })
  precioHoraDia: number;

  @Column({ name: 'precio_hora_noche', type: 'decimal', precision: 8, scale: 2 })
  precioHoraNoche: number;

  @Column({ name: 'hora_inicio_noche', type: 'time', default: '18:00:00' })
  horaInicioNoche: string;

  @Column({ type: 'enum', enum: ['activa', 'inactiva'], default: 'activa' })
  estado: 'activa' | 'inactiva';

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'imagen_url', type: 'text', nullable: true })
  imagenUrl: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  fotos: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Local, (local) => local.canchas)
  @JoinColumn({ name: 'id_local' })
  local: Local;

  @OneToMany(() => Horario, (horario) => horario.cancha)
  horarios: Horario[];

  @OneToMany(() => Reserva, (reserva) => reserva.cancha)
  reservas: Reserva[];
}
