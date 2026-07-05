import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Horario } from '../../horarios/entities/horario.entity';
import { Reserva } from '../../reservas/entities/reserva.entity';

@Entity('canchas')
export class Cancha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ name: 'tipo_superficie', length: 50, default: 'Césped sintético' })
  tipoSuperficie: string;

  @Column({ name: 'precio_hora', type: 'decimal', precision: 8, scale: 2 })
  precioHora: number;

  @Column({ type: 'enum', enum: ['activa', 'inactiva'], default: 'activa' })
  estado: 'activa' | 'inactiva';

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'imagen_url', type: 'text', nullable: true })
  imagenUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Horario, (horario) => horario.cancha)
  horarios: Horario[];

  @OneToMany(() => Reserva, (reserva) => reserva.cancha)
  reservas: Reserva[];
}
