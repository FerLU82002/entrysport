import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ReservaCard } from '../../components/reservas/ReservaCard';
import { PagoModal } from '../../components/reservas/PagoModal';
import { useReservas } from '../../hooks/useReservas';
import { EstadoReserva, Reserva } from '../../types';
import { reservasService } from '../../services/reservas.service';
import axios from 'axios';

const ESTADOS: { value: EstadoReserva | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'cancelada', label: 'Canceladas' },
  { value: 'completada', label: 'Completadas' },
];

export const MisReservasPage = () => {
  const location = useLocation();
  const { reservas, isLoading, recargar } = useReservas();
  const [filtroEstado, setFiltroEstado] = useState<EstadoReserva | 'todas'>('todas');
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [reservaAPagar, setReservaAPagar] = useState<Reserva | null>(null);

  const reservaCreada = location.state?.reservaCreada;

  const reservasFiltradas =
    filtroEstado === 'todas'
      ? reservas
      : reservas.filter((r) => r.estado === filtroEstado);

  const handleCancelar = async (id: number) => {
    if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return;

    setCancelando(id);
    setError('');

    try {
      await reservasService.cancelar(id);
      recargar();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al cancelar');
      } else {
        setError('Error inesperado');
      }
    } finally {
      setCancelando(null);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-ink-900 mb-6">Mis reservas</h1>

        {reservaCreada && (
          <div className="bg-brand-50 border border-brand-200 text-brand-800 text-sm px-4 py-3 rounded-md mb-4">
            Reserva creada exitosamente. Recibirás confirmación pronto.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap mb-6">
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              onClick={() => setFiltroEstado(e.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filtroEstado === e.value
                  ? 'bg-ink-900 text-white'
                  : 'bg-white text-ink-600 border border-ink-200 hover:border-ink-300'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Cargando reservas..." />
          </div>
        ) : reservasFiltradas.length === 0 ? (
          <div className="card text-center py-12 text-ink-400">
            <CalendarDays className="mx-auto mb-3" size={28} strokeWidth={1.5} />
            <p className="text-sm">No hay reservas con este filtro</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservasFiltradas.map((reserva) => (
              <ReservaCard
                key={reserva.id}
                reserva={reserva}
                onCancelar={handleCancelar}
                cancelando={cancelando === reserva.id}
                onPagar={setReservaAPagar}
              />
            ))}
          </div>
        )}
      </main>

      {reservaAPagar && (
        <PagoModal
          reserva={reservaAPagar}
          onClose={() => setReservaAPagar(null)}
          onPagado={() => {
            setReservaAPagar(null);
            recargar();
          }}
        />
      )}
    </div>
  );
};
