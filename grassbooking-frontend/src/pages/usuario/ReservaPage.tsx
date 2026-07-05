import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CalendarioDisponibilidad } from '../../components/reservas/CalendarioDisponibilidad';
import { ConfirmacionReserva } from '../../components/reservas/ConfirmacionReserva';
import { canchasService } from '../../services/canchas.service';
import { reservasService } from '../../services/reservas.service';
import { Cancha, SlotDisponibilidad } from '../../types';
import { format, addDays } from 'date-fns';
import axios from 'axios';

export const ReservaPage = () => {
  const { idCancha } = useParams<{ idCancha: string }>();
  const navigate = useNavigate();

  const [cancha, setCancha] = useState<Cancha | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    format(new Date(), 'yyyy-MM-dd'),
  );
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponibilidad | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReservando, setIsReservando] = useState(false);
  const [error, setError] = useState('');

  const fechaMin = format(new Date(), 'yyyy-MM-dd');
  const fechaMax = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  useEffect(() => {
    if (!idCancha) return;
    canchasService
      .getById(Number(idCancha))
      .then((res) => setCancha(res.data))
      .catch(() => navigate('/canchas'))
      .finally(() => setIsLoading(false));
  }, [idCancha, navigate]);

  const handleConfirmar = async (notas?: string) => {
    if (!cancha || !slotSeleccionado) return;

    setIsReservando(true);
    setError('');

    try {
      await reservasService.create({
        idCancha: cancha.id,
        fechaReserva: fechaSeleccionada,
        horaInicio: slotSeleccionado.horaInicio,
        notas,
      });
      navigate('/mis-reservas', { state: { reservaCreada: true } });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al crear la reserva');
      } else {
        setError('Error inesperado');
      }
    } finally {
      setIsReservando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" text="Cargando cancha..." />
        </div>
      </div>
    );
  }

  if (!cancha) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/canchas')}
          className="text-green-600 hover:text-green-700 text-sm mb-4 flex items-center gap-1"
        >
          ← Volver a canchas
        </button>

        <div className="card mb-6">
          <div className="flex items-start gap-4">
            {cancha.imagenUrl ? (
              <img
                src={cancha.imagenUrl}
                alt={cancha.nombre}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center text-3xl">
                ⚽
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-800">{cancha.nombre}</h1>
              <p className="text-gray-500 text-sm">{cancha.tipoSuperficie}</p>
              <p className="text-green-600 font-bold text-lg mt-1">
                S/ {Number(cancha.precioHora).toFixed(2)} / hora
              </p>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            1. Selecciona la fecha
          </h2>
          <input
            type="date"
            value={fechaSeleccionada}
            min={fechaMin}
            max={fechaMax}
            onChange={(e) => {
              setFechaSeleccionada(e.target.value);
              setSlotSeleccionado(null);
            }}
            className="input-field max-w-xs"
          />
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            2. Selecciona el horario
          </h2>
          <CalendarioDisponibilidad
            idCancha={cancha.id}
            fecha={fechaSeleccionada}
            slotSeleccionado={slotSeleccionado}
            onSeleccionar={(slot) => {
              setSlotSeleccionado(slot);
              setMostrarConfirmacion(true);
            }}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {mostrarConfirmacion && slotSeleccionado && (
          <ConfirmacionReserva
            cancha={cancha}
            fecha={fechaSeleccionada}
            slot={slotSeleccionado}
            isLoading={isReservando}
            onConfirmar={handleConfirmar}
            onCancelar={() => {
              setMostrarConfirmacion(false);
              setSlotSeleccionado(null);
            }}
          />
        )}
      </main>
    </div>
  );
};
