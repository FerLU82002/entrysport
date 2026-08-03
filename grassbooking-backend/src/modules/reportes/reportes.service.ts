import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Cancha } from '../canchas/entities/cancha.entity';

const SLOTS_POR_CANCHA = 15;

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Reserva)
    private reservasRepository: Repository<Reserva>,
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
    @InjectRepository(Cancha)
    private canchasRepository: Repository<Cancha>,
  ) {}

  private async contarCanchasActivas(idLocal?: number): Promise<number> {
    const where: Record<string, unknown> = { estado: 'activa' };
    if (idLocal) where.idLocal = idLocal;
    const total = await this.canchasRepository.count({ where });
    return Math.max(total, 1);
  }

  async getOcupacion(desde: string, hasta: string, idLocal?: number) {
    const query = this.reservasRepository
      .createQueryBuilder('r')
      .leftJoin('r.cancha', 'cancha')
      .select('r.fechaReserva', 'fecha')
      .addSelect('COUNT(*)', 'totalReservas')
      .addSelect(
        `SUM(CASE WHEN r.estado != 'cancelada' THEN 1 ELSE 0 END)`,
        'reservasActivas',
      )
      .where('r.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta })
      .groupBy('r.fechaReserva')
      .orderBy('r.fechaReserva', 'ASC');

    if (idLocal) {
      query.andWhere('cancha.idLocal = :idLocal', { idLocal });
    }

    const reservas = await query.getRawMany();
    const totalSlots = (await this.contarCanchasActivas(idLocal)) * SLOTS_POR_CANCHA;

    const data = reservas.map((r) => ({
      fecha: r.fecha,
      totalReservas: Number(r.totalReservas),
      reservasActivas: Number(r.reservasActivas),
      porcentajeOcupacion: Math.round((Number(r.reservasActivas) / totalSlots) * 100),
    }));

    return { data, message: 'Reporte de ocupación generado' };
  }

  async getIngresos(desde: string, hasta: string, idLocal?: number) {
    // Usar el nombre real de columna (fecha_reserva) dentro de funciones SQL raw
    // porque TypeORM no traduce camelCase dentro de expresiones arbitrarias
    const expr = `DATE_TRUNC('week', r.fecha_reserva::timestamp)`;

    const query = this.pagosRepository
      .createQueryBuilder('p')
      .leftJoin('p.reserva', 'r')
      .leftJoin('r.cancha', 'cancha')
      .select(expr, 'semana')
      .addSelect('SUM(p.monto)', 'totalIngresos')
      .addSelect('COUNT(p.id)', 'totalPagos')
      .where('r.fecha_reserva BETWEEN :desde AND :hasta', { desde, hasta })
      .andWhere('p.estado_pago = :estado', { estado: 'pagado' })
      .groupBy(expr)
      .orderBy(expr, 'ASC');

    if (idLocal) {
      query.andWhere('cancha.id_local = :idLocal', { idLocal });
    }

    const ingresos = await query.getRawMany();

    const data = ingresos.map((i) => ({
      semana: i.semana,
      totalIngresos: Number(i.totalIngresos) || 0,
      totalPagos: Number(i.totalPagos),
    }));

    return { data, message: 'Reporte de ingresos generado' };
  }

  async getResumenReservas(desde: string, hasta: string, idLocal?: number) {
    const resumenQuery = this.reservasRepository
      .createQueryBuilder('r')
      .leftJoin('r.cancha', 'cancha')
      .select('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN r.estado = 'confirmada' THEN 1 ELSE 0 END)`, 'confirmadas')
      .addSelect(`SUM(CASE WHEN r.estado = 'cancelada' THEN 1 ELSE 0 END)`, 'canceladas')
      .addSelect(`SUM(CASE WHEN r.estado = 'completada' THEN 1 ELSE 0 END)`, 'completadas')
      .addSelect(`SUM(CASE WHEN r.estado = 'pendiente' THEN 1 ELSE 0 END)`, 'pendientes')
      .addSelect(`SUM(CASE WHEN r.estado = 'no_asistio' THEN 1 ELSE 0 END)`, 'noAsistio')
      .addSelect('SUM(r.montoTotal)', 'montoTotalGenerado')
      .where('r.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta });

    const ingresosQuery = this.pagosRepository
      .createQueryBuilder('p')
      .leftJoin('p.reserva', 'r')
      .leftJoin('r.cancha', 'cancha')
      .select('SUM(p.monto)', 'ingresosCobrados')
      .where('r.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta })
      .andWhere('p.estadoPago = :estado', { estado: 'pagado' });

    if (idLocal) {
      resumenQuery.andWhere('cancha.idLocal = :idLocal', { idLocal });
      ingresosQuery.andWhere('cancha.idLocal = :idLocal', { idLocal });
    }

    const [resumen, ingresosPagados] = await Promise.all([
      resumenQuery.getRawOne(),
      ingresosQuery.getRawOne(),
    ]);

    const data = {
      total: Number(resumen.total),
      confirmadas: Number(resumen.confirmadas),
      canceladas: Number(resumen.canceladas),
      completadas: Number(resumen.completadas),
      pendientes: Number(resumen.pendientes),
      noAsistio: Number(resumen.noAsistio),
      montoTotalGenerado: Number(resumen.montoTotalGenerado) || 0,
      ingresosCobrados: Number(ingresosPagados.ingresosCobrados) || 0,
    };

    return { data, message: 'Resumen de reservas generado' };
  }
}
