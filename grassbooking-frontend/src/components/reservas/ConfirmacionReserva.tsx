import { useState } from 'react';
import { Cancha, SlotDisponibilidad } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { precioParaHora } from '../../utils/precio';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  cancha: Cancha;
  fecha: string;
  slot: SlotDisponibilidad;
  isLoading: boolean;
  estaAutenticado: boolean;
  onConfirmar: (notas?: string) => void;
  onCancelar: () => void;
  onRequiereLogin: () => void;
  onRequiereRegistro: () => void;
}

export const ConfirmacionReserva = ({
  cancha,
  fecha,
  slot,
  isLoading,
  estaAutenticado,
  onConfirmar,
  onCancelar,
  onRequiereLogin,
  onRequiereRegistro,
}: Props) => {
  const [notas, setNotas] = useState('');

  const fechaFormateada = format(parseISO(fecha), "EEEE d 'de' MMMM yyyy", {
    locale: es,
  });

  const horaNum = parseInt(slot.horaInicio.split(':')[0]);
  const ampm = horaNum >= 12 ? 'PM' : 'AM';
  const hora12 = horaNum > 12 ? horaNum - 12 : horaNum;

  return (
    <div className="card border-ink-900/10 ring-1 ring-ink-900/5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900 mb-4">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-ink-900 text-white text-xs">3</span>
        Confirmar reserva
      </h3>

      <div className="bg-ink-50 rounded-md p-4 mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Cancha</span>
          <span className="font-medium text-ink-900">{cancha.nombre}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Fecha</span>
          <span className="font-medium text-ink-900 capitalize">{fechaFormateada}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Horario</span>
          <span className="font-medium text-ink-900">
            {hora12}:00 {ampm} – {hora12 + 1}:00 {ampm}
          </span>
        </div>
        <div className="flex justify-between text-sm border-t border-ink-200 pt-2 mt-2">
          <span className="text-ink-700 font-medium">Total a pagar</span>
          <span className="text-ink-900 font-semibold">
            S/ {precioParaHora(cancha, slot.horaInicio).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-ink-700 mb-1.5">
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

      <p className="text-xs text-ink-400 mb-4">
        Después de confirmar podrás pagar en línea (si el local lo tiene habilitado) o en efectivo al llegar.
        La reserva se puede cancelar con 2 o más horas de anticipación.
      </p>

      {estaAutenticado ? (
        <div className="flex gap-3">
          <button
            onClick={() => onConfirmar(notas)}
            disabled={isLoading}
            className="flex-1 btn-primary py-2.5"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" /> Confirmando...
              </span>
            ) : (
              'Confirmar reserva'
            )}
          </button>
          <button onClick={onCancelar} className="flex-1 btn-secondary py-2.5">
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-600 mb-3 text-center">
            Necesitas una cuenta para completar la reserva. Este horario se guarda mientras inicias sesión.
          </p>
          <div className="flex gap-3">
            <button onClick={onRequiereLogin} className="flex-1 btn-primary py-2.5">
              Iniciar sesión
            </button>
            <button onClick={onRequiereRegistro} className="flex-1 btn-secondary py-2.5">
              Crear cuenta
            </button>
          </div>
          <button onClick={onCancelar} className="w-full text-center text-xs text-ink-400 mt-3 hover:text-ink-700">
            Elegir otro horario
          </button>
        </>
      )}
    </div>
  );
};
