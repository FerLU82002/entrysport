import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { CalendarDays, BarChart3, Wallet, LandPlot, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ReservaCard } from '../../components/reservas/ReservaCard';
import { reservasService } from '../../services/reservas.service';
import { reportesService } from '../../services/reportes.service';
import { canchasService } from '../../services/canchas.service';
import { Reserva, ResumenReportes } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface KpiCardProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icon: LucideIcon;
}

const KpiCard = ({ titulo, valor, subtitulo, icon: Icon }: KpiCardProps) => (
  <div className="card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-ink-500 font-medium">{titulo}</p>
        <p className="text-2xl font-semibold text-ink-900 mt-1">{valor}</p>
        {subtitulo && <p className="text-xs text-ink-400 mt-1">{subtitulo}</p>}
      </div>
      <span className="flex items-center justify-center w-9 h-9 rounded-md bg-ink-100 text-ink-500 shrink-0">
        <Icon size={17} strokeWidth={1.75} />
      </span>
    </div>
  </div>
);

export const DashboardAdmin = () => {
  const { usuario } = useAuth();
  const [reservasHoy, setReservasHoy] = useState<Reserva[]>([]);
  const [resumen, setResumen] = useState<ResumenReportes | null>(null);
  const [totalSlots, setTotalSlots] = useState(15);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!usuario?.idLocal) {
      setIsLoading(false);
      return;
    }

    const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const finMes = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    Promise.all([
      reservasService.getHoy(),
      reportesService.getResumen(inicioMes, finMes),
      canchasService.getMisCanchas(),
    ])
      .then(([hoyRes, resumenRes, canchasRes]) => {
        setReservasHoy(hoyRes.data);
        setResumen(resumenRes.data);
        const activas = canchasRes.data.filter((c) => c.estado === 'activa').length;
        setTotalSlots(Math.max(activas, 1) * 15);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const reservasActivas = reservasHoy.filter((r) => r.estado !== 'cancelada');
  const porcentajeOcupacion = Math.round((reservasActivas.length / totalSlots) * 100);

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
        <main className="p-6 max-w-6xl">
          <h1 className="text-xl font-semibold text-ink-900 mb-6">Dashboard</h1>

          {!usuario?.idLocal && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-4 mb-6">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <p className="font-medium text-sm">Tu cuenta aún no tiene un local asignado</p>
                <p className="text-xs mt-1 text-amber-700">
                  Contacta al super administrador para que te asigne el complejo deportivo que vas a administrar.
                  Mientras tanto no podrás ver ni gestionar reservas o canchas.
                </p>
              </div>
            </div>
          )}

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
                  subtitulo={`de ${totalSlots} slots disponibles`}
                  icon={CalendarDays}
                />
                <KpiCard
                  titulo="Ocupación hoy"
                  valor={`${porcentajeOcupacion}%`}
                  subtitulo="del horario diario"
                  icon={BarChart3}
                />
                <KpiCard
                  titulo="Ingresos del mes"
                  valor={`S/ ${resumen?.montoTotalGenerado?.toFixed(0) || 0}`}
                  subtitulo="reservas generadas"
                  icon={Wallet}
                />
                <KpiCard
                  titulo="Total este mes"
                  valor={resumen?.total || 0}
                  subtitulo={`${resumen?.canceladas || 0} canceladas`}
                  icon={LandPlot}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                <Link to="/admin/reservas" className="card hover:border-ink-300 transition-colors group flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-md bg-ink-100 text-ink-500 shrink-0">
                    <ClipboardList size={18} strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-medium text-ink-800 text-sm">Gestionar reservas</p>
                    <p className="text-xs text-ink-400">Ver y aprobar reservas</p>
                  </div>
                </Link>
                <Link to="/admin/canchas" className="card hover:border-ink-300 transition-colors group flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-md bg-ink-100 text-ink-500 shrink-0">
                    <LandPlot size={18} strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-medium text-ink-800 text-sm">Espacios deportivos</p>
                    <p className="text-xs text-ink-400">Gestiona tus canchas</p>
                  </div>
                </Link>
                <Link to="/admin/reportes" className="card hover:border-ink-300 transition-colors group flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-md bg-ink-100 text-ink-500 shrink-0">
                    <TrendingUp size={18} strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-medium text-ink-800 text-sm">Ver reportes</p>
                    <p className="text-xs text-ink-400">Ingresos y ocupación</p>
                  </div>
                </Link>
              </div>

              <div className="card">
                <h2 className="text-sm font-semibold text-ink-900 mb-4">
                  Agenda del día — {format(new Date(), 'dd/MM/yyyy')}
                </h2>
                {reservasHoy.length === 0 ? (
                  <p className="text-ink-400 text-center py-6 text-sm">No hay reservas para hoy</p>
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
