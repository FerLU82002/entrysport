import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ReservaCard } from '../../components/reservas/ReservaCard';
import { useReservas } from '../../hooks/useReservas';
import { EstadoReserva } from '../../types';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis reservas</h1>

        {reservaCreada && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            ¡Reserva creada exitosamente! Recibirás confirmación pronto.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-2 flex-wrap mb-6">
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              onClick={() => setFiltroEstado(e.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtroEstado === e.value
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400'
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
          <div className="card text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📅</p>
            <p>No hay reservas con este filtro</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservasFiltradas.map((reserva) => (
              <ReservaCard
                key={reserva.id}
                reserva={reserva}
                onCancelar={handleCancelar}
                cancelando={cancelando === reserva.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
