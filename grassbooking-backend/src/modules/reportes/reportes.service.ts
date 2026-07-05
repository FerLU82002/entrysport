import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Pago } from '../pagos/entities/pago.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Reserva)
    private reservasRepository: Repository<Reserva>,
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
  ) {}

  async getOcupacion(desde: string, hasta: string) {
    const reservas = await this.reservasRepository
      .createQueryBuilder('r')
      .select('r.fechaReserva', 'fecha')
      .addSelect('COUNT(*)', 'totalReservas')
      .addSelect(
        `SUM(CASE WHEN r.estado != 'cancelada' THEN 1 ELSE 0 END)`,
        'reservasActivas',
      )
      .where('r.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta })
      .groupBy('r.fechaReserva')
      .orderBy('r.fechaReserva', 'ASC')
      .getRawMany();

    const totalSlots = 15;
    const data = reservas.map((r) => ({
      fecha: r.fecha,
      totalReservas: Number(r.totalReservas),
      reservasActivas: Number(r.reservasActivas),
      porcentajeOcupacion: Math.round((Number(r.reservasActivas) / totalSlots) * 100),
    }));

    return { data, message: 'Reporte de ocupación generado' };
  }

  async getIngresos(desde: string, hasta: string) {
    // Usar el nombre real de columna (fecha_reserva) dentro de funciones SQL raw
    // porque TypeORM no traduce camelCase dentro de expresiones arbitrarias
    const expr = `DATE_TRUNC('week', r.fecha_reserva::timestamp)`;

    const ingresos = await this.pagosRepository
      .createQueryBuilder('p')
      .leftJoin('p.reserva', 'r')
      .select(expr, 'semana')
      .addSelect('SUM(p.monto)', 'totalIngresos')
      .addSelect('COUNT(p.id)', 'totalPagos')
      .where('r.fecha_reserva BETWEEN :desde AND :hasta', { desde, hasta })
      .andWhere('p.estado_pago = :estado', { estado: 'pagado' })
      .groupBy(expr)
      .orderBy(expr, 'ASC')
      .getRawMany();

    const data = ingresos.map((i) => ({
      semana: i.semana,
      totalIngresos: Number(i.totalIngresos) || 0,
      totalPagos: Number(i.totalPagos),
    }));

    return { data, message: 'Reporte de ingresos generado' };
  }

  async getResumenReservas(desde: string, hasta: string) {
    const resumen = await this.reservasRepository
      .createQueryBuilder('r')
      .select('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN r.estado = 'confirmada' THEN 1 ELSE 0 END)`, 'confirmadas')
      .addSelect(`SUM(CASE WHEN r.estado = 'cancelada' THEN 1 ELSE 0 END)`, 'canceladas')
      .addSelect(`SUM(CASE WHEN r.estado = 'completada' THEN 1 ELSE 0 END)`, 'completadas')
      .addSelect(`SUM(CASE WHEN r.estado = 'pendiente' THEN 1 ELSE 0 END)`, 'pendientes')
      .addSelect(`SUM(CASE WHEN r.estado = 'no_asistio' THEN 1 ELSE 0 END)`, 'noAsistio')
      .addSelect('SUM(r.montoTotal)', 'montoTotalGenerado')
      .where('r.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta })
      .getRawOne();

    const ingresosPagados = await this.pagosRepository
      .createQueryBuilder('p')
      .leftJoin('p.reserva', 'r')
      .select('SUM(p.monto)', 'ingresosCobrados')
      .where('r.fechaReserva BETWEEN :desde AND :hasta', { desde, hasta })
      .andWhere('p.estadoPago = :estado', { estado: 'pagado' })
      .getRawOne();

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
