import { useState } from 'react';
import { Cancha, ConfiguracionPagoPublica, SlotDisponibilidad } from '../../types';
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
  configPublica?: ConfiguracionPagoPublica | null;
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
  configPublica,
  onConfirmar,
  onCancelar,
  onRequiereLogin,
  onRequiereRegistro,
}: Props) => {
  const [notas, setNotas] = useState('');

  const fechaFormateada = format(parseISO(fecha), "EEEE d 'de' MMMM yyyy", { locale: es });
  const horaNum = parseInt(slot.horaInicio.split(':')[0]);
  const ampm = horaNum >= 12 ? 'PM' : 'AM';
  const hora12 = horaNum > 12 ? horaNum - 12 : horaNum;

  const precioBase = precioParaHora(cancha, slot.horaInicio);
  const descuentoPct = configPublica?.descuentoPct ?? 0;
  const adelantoPct = configPublica?.adelantoPct ?? 100;

  const montoTotal = Number((precioBase * (1 - descuentoPct / 100)).toFixed(2));
  const montoAhorita = Number((montoTotal * adelantoPct / 100).toFixed(2));
  const montoAlLlegar = Number((montoTotal - montoAhorita).toFixed(2));

  const hayDescuento = descuentoPct > 0;
  const pagoPartial = adelantoPct > 0 && adelantoPct < 100;
  const pagaAlLlegar = adelantoPct === 0;

  return (
    <div className="card border-ink-900/10 ring-1 ring-ink-900/5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900 mb-4">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-ink-900 text-white text-xs">3</span>
        Confirmar reserva
      </h3>

      {/* Detalles de la reserva */}
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

        {/* Precio con o sin descuento */}
        <div className="border-t border-ink-200 pt-2 mt-2 space-y-1.5">
          {hayDescuento && (
            <div className="flex justify-between text-sm">
              <span className="text-ink-400">Precio normal</span>
              <span className="text-ink-400 line-through">S/ {precioBase.toFixed(2)}</span>
            </div>
          )}
          {hayDescuento && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-green-700 font-medium">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">
                  -{descuentoPct}%
                </span>
                Descuento
              </span>
              <span className="text-green-700 font-medium">-S/ {(precioBase - montoTotal).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Precio reserva</span>
            <span className="text-ink-700 font-medium">S/ {montoTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Monto que paga ahora — bloque prominente */}
        <div className="border-t border-ink-200 pt-3 mt-1">
          {pagaAlLlegar ? (
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-ink-700">Pagas al llegar</span>
              <span className="text-xl font-bold text-ink-900">S/ {montoTotal.toFixed(2)}</span>
            </div>
          ) : pagoPartial ? (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-semibold text-ink-900">Para reservar ahora</span>
                  <p className="text-xs text-ink-400">({adelantoPct}% del total)</p>
                </div>
                <span className="text-2xl font-bold text-ink-900">S/ {montoAhorita.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-ink-500">Al llegar al local</span>
                <span className="text-sm font-medium text-ink-600">S/ {montoAlLlegar.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-ink-700">Total a pagar</span>
              <span className="text-xl font-bold text-ink-900">S/ {montoTotal.toFixed(2)}</span>
            </div>
          )}
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
        {pagaAlLlegar
          ? 'Tu reserva queda confirmada. Paga directamente en el local.'
          : pagoPartial
          ? `Paga S/ ${montoAhorita.toFixed(2)} para confirmar tu reserva. El resto lo pagas al llegar. Puedes cancelar con 2 o más horas de anticipación.`
          : 'Después de confirmar podrás pagar en línea o en efectivo al llegar. Puedes cancelar con 2 o más horas de anticipación.'
        }
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
            ) : pagaAlLlegar ? (
              'Confirmar reserva (sin pago previo)'
            ) : pagoPartial ? (
              `Confirmar y pagar S/ ${montoAhorita.toFixed(2)}`
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
