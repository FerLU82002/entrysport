import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { reservasService } from '../../services/reservas.service';
import { Reserva, ESTADO_COLORES, ESTADO_LABELS } from '../../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { to12h } from '../../utils/reserva';

export const DashboardUsuario = () => {
  const { usuario } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reservasService
      .getMisReservas()
      .then((res) => setReservas(res.data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const proximasReservas = reservas.filter(
    (r) =>
      r.estado !== 'cancelada' &&
      new Date(`${r.fechaReserva}T${r.horaInicio}`) >= new Date(),
  );

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-ink-900">
            Hola, {usuario?.nombre?.split(' ')[0]}
          </h1>
          <p className="text-ink-500 mt-1 text-sm">¿Listo para reservar tu cancha hoy?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-2xl font-semibold text-ink-900">{reservas.length}</p>
            <p className="text-sm text-ink-500 mt-1">Total reservas</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-semibold text-ink-900">{proximasReservas.length}</p>
            <p className="text-sm text-ink-500 mt-1">Próximas</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-semibold text-ink-900">
              {reservas.filter((r) => r.estado === 'pendiente').length}
            </p>
            <p className="text-sm text-ink-500 mt-1">Pendientes</p>
          </div>
        </div>

        <Link
          to="/locales"
          className="flex items-center justify-between w-full mb-6 px-5 py-4 rounded-lg bg-ink-900 text-white hover:bg-ink-800 transition-colors"
        >
          <span className="font-medium text-sm">Reservar una cancha ahora</span>
          <ArrowRight size={18} strokeWidth={1.75} />
        </Link>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-ink-900">Últimas reservas</h2>
            <Link to="/mis-reservas" className="text-ink-500 text-sm hover:text-ink-900 transition-colors">
              Ver todas
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="Cargando reservas..." />
            </div>
          ) : reservas.length === 0 ? (
            <div className="text-center py-10 text-ink-400">
              <CalendarDays className="mx-auto mb-2" size={28} strokeWidth={1.5} />
              <p className="text-sm">Aún no tienes reservas</p>
              <Link to="/canchas" className="text-ink-900 text-sm hover:underline mt-2 inline-block font-medium">
                Reserva tu primera cancha
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {reservas.map((reserva) => (
                <div
                  key={reserva.id}
                  className="flex items-center justify-between p-3 bg-ink-50 rounded-md"
                >
                  <div>
                    <p className="font-medium text-ink-900 text-sm">{reserva.cancha?.nombre}</p>
                    <p className="text-xs text-ink-500">
                      {format(parseISO(reserva.fechaReserva), "d 'de' MMMM", { locale: es })} ·{' '}
                      {to12h(reserva.horaInicio)} – {to12h(reserva.horaFin)}
                    </p>
                  </div>
                  <span className={`badge ${ESTADO_COLORES[reserva.estado]}`}>
                    {ESTADO_LABELS[reserva.estado]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
