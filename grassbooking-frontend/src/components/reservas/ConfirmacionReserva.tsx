import { useState } from 'react';
import { Cancha, SlotDisponibilidad } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  cancha: Cancha;
  fecha: string;
  slot: SlotDisponibilidad;
  isLoading: boolean;
  onConfirmar: (notas?: string) => void;
  onCancelar: () => void;
}

export const ConfirmacionReserva = ({
  cancha,
  fecha,
  slot,
  isLoading,
  onConfirmar,
  onCancelar,
}: Props) => {
  const [notas, setNotas] = useState('');

  const fechaFormateada = format(parseISO(fecha), "EEEE d 'de' MMMM yyyy", {
    locale: es,
  });

  const horaNum = parseInt(slot.horaInicio.split(':')[0]);
  const ampm = horaNum >= 12 ? 'PM' : 'AM';
  const hora12 = horaNum > 12 ? horaNum - 12 : horaNum;

  return (
    <div className="card border-2 border-green-300">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        3. Confirmar reserva
      </h3>

      <div className="bg-green-50 rounded-lg p-4 mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Cancha:</span>
          <span className="font-medium text-gray-800">{cancha.nombre}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Fecha:</span>
          <span className="font-medium text-gray-800 capitalize">{fechaFormateada}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Horario:</span>
          <span className="font-medium text-gray-800">
            {hora12}:00 {ampm} – {hora12 + 1}:00 {ampm}
          </span>
        </div>
        <div className="flex justify-between text-sm border-t border-green-200 pt-2 mt-2">
          <span className="text-gray-700 font-medium">Total a pagar:</span>
          <span className="text-green-600 font-bold text-lg">
            S/ {Number(cancha.precioHora).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas adicionales (opcional)
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className="input-field resize-none"
          placeholder="Ej: Vengo con 10 personas, torneo amical..."
        />
      </div>

      <p className="text-xs text-gray-400 mb-4">
        El pago se realiza en efectivo al llegar a la cancha.
        La reserva se puede cancelar con ≥ 2 horas de anticipación.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => onConfirmar(notas)}
          disabled={isLoading}
          className="flex-1 btn-primary py-3"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" /> Confirmando...
            </span>
          ) : (
            'Confirmar reserva'
          )}
        </button>
        <button onClick={onCancelar} className="flex-1 btn-secondary py-3">
          Cambiar
        </button>
      </div>
    </div>
  );
};
