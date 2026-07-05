import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { GraficoOcupacion } from '../../components/reportes/GraficoOcupacion';
import { GraficoIngresos } from '../../components/reportes/GraficoIngresos';
import { reportesService } from '../../services/reportes.service';
import { DatoOcupacion, DatoIngreso, ResumenReportes } from '../../types';
import { format, startOfMonth, subDays, subMonths } from 'date-fns';

const RANGOS = [
  { label: 'Últimos 7 días', desde: () => format(subDays(new Date(), 7), 'yyyy-MM-dd') },
  { label: 'Este mes', desde: () => format(startOfMonth(new Date()), 'yyyy-MM-dd') },
  { label: 'Últimos 3 meses', desde: () => format(subMonths(new Date(), 3), 'yyyy-MM-dd') },
  { label: 'Este año', desde: () => format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd') },
];

export const ReportesPage = () => {
  const [desde, setDesde] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [hasta, setHasta] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [ocupacion, setOcupacion] = useState<DatoOcupacion[]>([]);
  const [ingresos, setIngresos] = useState<DatoIngreso[]>([]);
  const [resumen, setResumen] = useState<ResumenReportes | null>(null);

  const [loadingOcupacion, setLoadingOcupacion] = useState(false);
  const [loadingIngresos, setLoadingIngresos] = useState(false);
  const [loadingResumen, setLoadingResumen] = useState(false);

  const [errorOcupacion, setErrorOcupacion] = useState('');
  const [errorIngresos, setErrorIngresos] = useState('');
  const [errorResumen, setErrorResumen] = useState('');

  const cargar = (d = desde, h = hasta) => {
    // Cada sección carga de forma independiente — un error no bloquea a las demás
    setLoadingOcupacion(true);
    setErrorOcupacion('');
    reportesService.getOcupacion(d, h)
      .then((res) => setOcupacion(res.data))
      .catch(() => setErrorOcupacion('Error al cargar ocupación'))
      .finally(() => setLoadingOcupacion(false));

    setLoadingIngresos(true);
    setErrorIngresos('');
    reportesService.getIngresos(d, h)
      .then((res) => setIngresos(res.data))
      .catch(() => setErrorIngresos('Error al cargar ingresos'))
      .finally(() => setLoadingIngresos(false));

    setLoadingResumen(true);
    setErrorResumen('');
    reportesService.getResumen(d, h)
      .then((res) => setResumen(res.data))
      .catch(() => setErrorResumen('Error al cargar resumen'))
      .finally(() => setLoadingResumen(false));
  };

  useEffect(() => { cargar(); }, []);

  const aplicarRango = (desdeFn: () => string) => {
    const d = desdeFn();
    const h = format(new Date(), 'yyyy-MM-dd');
    setDesde(d);
    setHasta(h);
    cargar(d, h);
  };

  const exportarExcel = () => {
    const hoy = format(new Date(), 'yyyy-MM-dd');
    const filas: (string | number)[][] = [];

    // BOM para que Excel abra UTF-8 correctamente
    const BOM = '﻿';

    filas.push(['REPORTE GRASSBOOKING', '', '']);
    filas.push([`Período: ${desde} al ${hasta}`, '', '']);
    filas.push([`Generado: ${hoy}`, '', '']);
    filas.push(['', '', '']);

    filas.push(['=== RESUMEN ===', '', '']);
    filas.push(['Métrica', 'Valor', '']);
    if (resumen) {
      filas.push(['Total reservas', resumen.total, '']);
      filas.push(['Confirmadas', resumen.confirmadas, '']);
      filas.push(['Completadas', resumen.completadas, '']);
      filas.push(['Canceladas', resumen.canceladas, '']);
      filas.push(['Pendientes', resumen.pendientes, '']);
      filas.push(['No asistió', resumen.noAsistio, '']);
      filas.push(['Monto generado (S/)', resumen.montoTotalGenerado.toFixed(2), '']);
      filas.push(['Ingresos cobrados (S/)', resumen.ingresosCobrados.toFixed(2), '']);
    }

    filas.push(['', '', '']);
    filas.push(['=== OCUPACIÓN POR DÍA ===', '', '']);
    filas.push(['Fecha', 'Reservas activas', '% Ocupación']);
    ocupacion.forEach((o) => filas.push([o.fecha, o.reservasActivas, o.porcentajeOcupacion]));

    filas.push(['', '', '']);
    filas.push(['=== INGRESOS POR SEMANA ===', '', '']);
    filas.push(['Semana', 'Total pagos', 'Ingresos (S/)']);
    ingresos.forEach((i) => {
      const semana = i.semana ? String(i.semana).split('T')[0] : '';
      filas.push([semana, i.totalPagos, i.totalIngresos.toFixed(2)]);
    });

    const csv = BOM + filas.map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_grassbooking_${desde}_${hasta}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hayAlgunDato = resumen || ocupacion.length > 0 || ingresos.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
        <main className="p-6 max-w-6xl">

          {/* Cabecera y filtros */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
            <button
              onClick={exportarExcel}
              disabled={!hayAlgunDato}
              className="btn-primary disabled:opacity-50 flex items-center gap-2"
            >
              📥 Exportar a Excel
            </button>
          </div>

          {/* Rangos rápidos */}
          <div className="flex flex-wrap gap-2 mb-4">
            {RANGOS.map((r) => (
              <button
                key={r.label}
                onClick={() => aplicarRango(r.desde)}
                className="px-3 py-1.5 rounded-full text-sm border border-gray-200 bg-white text-gray-600 hover:border-green-500 hover:text-green-700 transition-colors"
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Rango personalizado */}
          <div className="flex flex-wrap gap-2 items-center mb-8">
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="input-field w-auto"
            />
            <span className="text-gray-400">→</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="input-field w-auto"
            />
            <button onClick={() => cargar()} className="btn-primary px-5">
              Filtrar
            </button>
          </div>

          {/* KPIs de resumen */}
          <div className="mb-8">
            {loadingResumen ? (
              <div className="flex justify-center py-6"><LoadingSpinner text="Cargando resumen..." /></div>
            ) : errorResumen ? (
              <p className="text-red-500 text-sm">{errorResumen}</p>
            ) : resumen ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: 'Total reservas', valor: resumen.total, color: 'text-gray-800' },
                    { label: 'Confirmadas', valor: resumen.confirmadas, color: 'text-green-600' },
                    { label: 'Canceladas', valor: resumen.canceladas, color: 'text-red-500' },
                    { label: 'Completadas', valor: resumen.completadas, color: 'text-blue-600' },
                  ].map((item) => (
                    <div key={item.label} className="card text-center">
                      <p className={`text-3xl font-bold ${item.color}`}>{item.valor}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <p className="text-sm text-gray-500 mb-1">Pendientes</p>
                    <p className="text-2xl font-bold text-orange-500">{resumen.pendientes}</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-sm text-gray-500 mb-1">Monto total generado</p>
                    <p className="text-2xl font-bold text-gray-800">S/ {resumen.montoTotalGenerado.toFixed(2)}</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-sm text-gray-500 mb-1">Ingresos cobrados</p>
                    <p className="text-2xl font-bold text-green-600">S/ {resumen.ingresosCobrados.toFixed(2)}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">Sin datos en este período</p>
            )}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ocupación */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ocupación por día</h2>
              {loadingOcupacion ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : errorOcupacion ? (
                <p className="text-red-500 text-sm text-center py-8">{errorOcupacion}</p>
              ) : ocupacion.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">📊</p>
                  <p className="text-sm">Sin reservas en este período</p>
                </div>
              ) : (
                <GraficoOcupacion datos={ocupacion} />
              )}
            </div>

            {/* Ingresos */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ingresos por semana</h2>
              {loadingIngresos ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : errorIngresos ? (
                <p className="text-red-500 text-sm text-center py-8">{errorIngresos}</p>
              ) : ingresos.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">💰</p>
                  <p className="text-sm">Sin pagos registrados en este período</p>
                  <p className="text-xs mt-1">Registra pagos en "Gestión de reservas"</p>
                </div>
              ) : (
                <GraficoIngresos datos={ingresos} />
              )}
            </div>
          </div>

        </main>
        </div>
      </div>
    </div>
  );
};
