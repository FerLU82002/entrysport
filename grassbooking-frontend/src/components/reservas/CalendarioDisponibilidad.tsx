import { useState, useEffect } from 'react';
import { reservasService } from '../../services/reservas.service';
import { SlotDisponibilidad } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { to12h } from '../../utils/reserva';

interface Props {
  idCancha: number;
  fecha: string;
  slotSeleccionado: SlotDisponibilidad | null;
  onSeleccionar: (slot: SlotDisponibilidad) => void;
}

export const CalendarioDisponibilidad = ({
  idCancha,
  fecha,
  slotSeleccionado,
  onSeleccionar,
}: Props) => {
  const [slots, setSlots] = useState<SlotDisponibilidad[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fecha) return;

    setIsLoading(true);
    setError('');

    reservasService
      .getDisponibilidad(idCancha, fecha)
      .then((res) => setSlots(res.data.slots))
      .catch(() => setError('Error al cargar disponibilidad'))
      .finally(() => setIsLoading(false));
  }, [idCancha, fecha]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner text="Cargando horarios disponibles..." />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-6 text-red-600 text-sm">{error}</div>;
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-6 text-ink-400 text-sm">
        No hay horarios configurados para esta fecha
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-4 mb-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-red-400 inline-block" />
          Ocupado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-ink-900 inline-block" />
          Seleccionado
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {slots.map((slot) => {
          const isSelected = slotSeleccionado?.horaInicio === slot.horaInicio;

          return (
            <button
              key={slot.id}
              disabled={!slot.disponible}
              onClick={() => slot.disponible && onSeleccionar(slot)}
              className={`py-2.5 px-2 rounded-md text-sm font-medium border transition-colors ${
                isSelected
                  ? 'bg-ink-900 text-white border-ink-900'
                  : slot.disponible
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100 cursor-pointer'
                  : 'bg-red-50 text-red-400 border-red-100 cursor-not-allowed'
              }`}
            >
              {to12h(slot.horaInicio)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
