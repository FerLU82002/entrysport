import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ReservaCard } from '../../components/reservas/ReservaCard';
import { reservasService } from '../../services/reservas.service';
import { reportesService } from '../../services/reportes.service';
import { Reserva, ResumenReportes } from '../../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface KpiCardProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  color: string;
  icon: string;
}

const KpiCard = ({ titulo, valor, subtitulo, color, icon }: KpiCardProps) => (
  <div className={`card border-l-4 ${color}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{titulo}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{valor}</p>
        {subtitulo && <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>}
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
  </div>
);

export const DashboardAdmin = () => {
  const [reservasHoy, setReservasHoy] = useState<Reserva[]>([]);
  const [resumen, setResumen] = useState<ResumenReportes | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const finMes = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    Promise.all([
      reservasService.getHoy(),
      reportesService.getResumen(inicioMes, finMes),
    ])
      .then(([hoyRes, resumenRes]) => {
        setReservasHoy(hoyRes.data);
        setResumen(resumenRes.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const reservasActivas = reservasHoy.filter((r) => r.estado !== 'cancelada');
  const porcentajeOcupacion = Math.round((reservasActivas.length / 15) * 100);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
        <main className="p-6 max-w-6xl">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" text="Cargando datos..." />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KpiCard
                  titulo="Reservas hoy"
                  valor={reservasActivas.length}
                  subtitulo={`de 15 slots disponibles`}
                  color="border-green-500"
                  icon="📅"
                />
                <KpiCard
                  titulo="Ocupación hoy"
                  valor={`${porcentajeOcupacion}%`}
                  subtitulo="del horario diario"
                  color="border-blue-500"
                  icon="📊"
                />
                <KpiCard
                  titulo="Ingresos del mes"
                  valor={`S/ ${resumen?.montoTotalGenerado?.toFixed(0) || 0}`}
                  subtitulo="reservas generadas"
                  color="border-orange-500"
                  icon="💰"
                />
                <KpiCard
                  titulo="Total este mes"
                  valor={resumen?.total || 0}
                  subtitulo={`${resumen?.canceladas || 0} canceladas`}
                  color="border-purple-500"
                  icon="🏟️"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                <Link to="/admin/reservas" className="card text-center hover:shadow-md transition-shadow cursor-pointer group">
                  <span className="text-3xl group-hover:scale-110 transition-transform inline-block">📋</span>
                  <p className="font-medium text-gray-700 mt-2">Gestionar Reservas</p>
                  <p className="text-xs text-gray-400 mt-1">Ver y aprobar reservas</p>
                </Link>
                <Link to="/admin/canchas" className="card text-center hover:shadow-md transition-shadow cursor-pointer group">
                  <span className="text-3xl group-hover:scale-110 transition-transform inline-block">⚽</span>
                  <p className="font-medium text-gray-700 mt-2">Gestionar Canchas</p>
                  <p className="text-xs text-gray-400 mt-1">CRUD de canchas</p>
                </Link>
                <Link to="/admin/reportes" className="card text-center hover:shadow-md transition-shadow cursor-pointer group">
                  <span className="text-3xl group-hover:scale-110 transition-transform inline-block">📈</span>
                  <p className="font-medium text-gray-700 mt-2">Ver Reportes</p>
                  <p className="text-xs text-gray-400 mt-1">Ingresos y ocupación</p>
                </Link>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Agenda del día — {format(new Date(), 'dd/MM/yyyy')}
                </h2>
                {reservasHoy.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">No hay reservas para hoy</p>
                ) : (
                  <div className="space-y-3">
                    {reservasHoy.map((r) => (
                      <ReservaCard key={r.id} reserva={r} showUsuario />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
        </div>
      </div>
    </div>
  );
};
