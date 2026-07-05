import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { reservasService } from '../../services/reservas.service';
import { Reserva, ESTADO_COLORES, ESTADO_LABELS } from '../../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Bienvenido, {usuario?.nombre?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 mt-1">
            ¿Listo para reservar tu cancha hoy?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">{reservas.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total reservas</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-blue-600">{proximasReservas.length}</p>
            <p className="text-sm text-gray-500 mt-1">Próximas</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-orange-500">
              {reservas.filter((r) => r.estado === 'pendiente').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Pendientes</p>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Acción rápida</h2>
          </div>
          <Link
            to="/canchas"
            className="block w-full btn-primary text-center py-4 text-base rounded-xl"
          >
            ⚽ Reservar una cancha ahora
          </Link>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Últimas reservas</h2>
            <Link to="/mis-reservas" className="text-green-600 text-sm hover:underline">
              Ver todas →
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="Cargando reservas..." />
            </div>
          ) : reservas.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">📅</p>
              <p>Aún no tienes reservas</p>
              <Link to="/canchas" className="text-green-600 text-sm hover:underline mt-2 inline-block">
                Reserva tu primera cancha
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reservas.map((reserva) => (
                <div
                  key={reserva.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {reserva.cancha?.nombre}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(reserva.fechaReserva), "d 'de' MMMM", { locale: es })} •{' '}
                      {reserva.horaInicio} – {reserva.horaFin}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_COLORES[reserva.estado]}`}>
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
