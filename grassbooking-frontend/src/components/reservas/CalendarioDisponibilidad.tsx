import { useState, useEffect } from 'react';
import { reservasService } from '../../services/reservas.service';
import { SlotDisponibilidad } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

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
    return (
      <div className="text-center py-6 text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <p>No hay horarios configurados para esta fecha</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-4 mb-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          Ocupado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          Seleccionado
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {slots.map((slot) => {
          const isSelected = slotSeleccionado?.horaInicio === slot.horaInicio;
          const hora = slot.horaInicio;
          const horaNum = parseInt(hora.split(':')[0]);
          const ampm = horaNum >= 12 ? 'PM' : 'AM';
          const hora12 = horaNum > 12 ? horaNum - 12 : horaNum === 0 ? 12 : horaNum;

          return (
            <button
              key={slot.id}
              disabled={!slot.disponible}
              onClick={() => slot.disponible && onSeleccionar(slot)}
              className={`
                py-3 px-2 rounded-lg text-sm font-medium transition-all
                ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : slot.disponible
                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-400 cursor-pointer'
                    : 'bg-red-50 text-red-400 border border-red-100 cursor-not-allowed opacity-60'
                }
              `}
            >
              <span className="block text-center">
                {hora12}:00 {ampm}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
