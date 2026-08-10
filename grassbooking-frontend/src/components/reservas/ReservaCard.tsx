import { User, CalendarDays, Clock, CreditCard, Download } from 'lucide-react';
import { Reserva, ESTADO_COLORES, ESTADO_LABELS } from '../../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { descargarTicketReserva } from '../../utils/ticketDownload';
import { nombreClienteReserva, telefonoClienteReserva } from '../../utils/reserva';

interface Props {
  reserva: Reserva;
  showUsuario?: boolean;
  onCambiarEstado?: (reserva: Reserva) => void;
  onPagar?: (reserva: Reserva) => void;
}

export const ReservaCard = ({
  reserva,
  showUsuario,
  onCambiarEstado,
  onPagar,
}: Props) => {
  // PostgreSQL devuelve TIME como "HH:MM:SS" — tomar solo "HH:MM"
  const horaInicioLimpia = reserva.horaInicio.substring(0, 5);
  const horaFinLimpia = reserva.horaFin.substring(0, 5);

  const horaNum = parseInt(horaInicioLimpia.split(':')[0]);
  const horaFinNum = parseInt(horaFinLimpia.split(':')[0]);
  const ampm = horaNum >= 12 ? 'PM' : 'AM';
  const hora12 = horaNum > 12 ? horaNum - 12 : horaNum;
  const horaFin12 = horaFinNum > 12 ? horaFinNum - 12 : horaFinNum;
  const ampmFin = horaFinNum >= 12 ? 'PM' : 'AM';

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`badge ${ESTADO_COLORES[reserva.estado]}`}>
              {ESTADO_LABELS[reserva.estado]}
            </span>
            <span className="text-xs text-ink-400 font-mono">
              #{reserva.codigoReserva?.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <h3 className="font-medium text-ink-900">
            {reserva.cancha?.nombre || `Cancha #${reserva.idCancha}`}
            {reserva.cancha?.deporte && (
              <span className="text-ink-400 font-normal"> · {reserva.cancha.deporte}</span>
            )}
          </h3>

          {showUsuario && (
            <p className="flex items-center gap-1.5 text-sm text-ink-500">
              <User size={13} strokeWidth={1.75} />
              {nombreClienteReserva(reserva)}
              {telefonoClienteReserva(reserva) && ` · ${telefonoClienteReserva(reserva)}`}
            </p>
          )}

          <p className="flex items-center gap-1.5 text-sm text-ink-600 mt-1">
            <CalendarDays size={13} strokeWidth={1.75} className="text-ink-400" />
            {format(parseISO(reserva.fechaReserva), "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-ink-600">
            <Clock size={13} strokeWidth={1.75} className="text-ink-400" />
            {hora12}:00 {ampm} – {horaFin12}:00 {ampmFin}
          </p>
          {reserva.notas && (
            <p className="text-xs text-ink-400 mt-1 italic">"{reserva.notas}"</p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-ink-900 font-semibold">
            S/ {Number(reserva.montoTotal).toFixed(2)}
          </p>
          {reserva.pago && (() => {
            const montoTotal = Number(reserva.montoTotal);
            const montoPago = Number(reserva.pago.monto);
            const hayAdelanto = montoPago > 0 && montoPago < montoTotal;
            const faltante = Number((montoTotal - montoPago).toFixed(2));
            return (
              <>
                <span
                  className={`badge mt-1 ${
                    reserva.pago.estadoPago === 'pagado'
                      ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200'
                      : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
                  }`}
                >
                  {reserva.pago.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente pago'}
                </span>
                {hayAdelanto && reserva.pago.estadoPago !== 'pagado' && (
                  <div className="mt-1.5 text-right space-y-0.5">
                    <p className="text-xs text-ink-500">
                      Adelanto: <span className="font-medium text-green-700">S/ {montoPago.toFixed(2)}</span>
                    </p>
                    <p className="text-xs text-amber-700 font-medium">
                      Falta cobrar: S/ {faltante.toFixed(2)}
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        {onPagar && reserva.pago?.estadoPago === 'pendiente' && reserva.estado !== 'cancelada' && (
          <button onClick={() => onPagar(reserva)} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5">
            <CreditCard size={14} strokeWidth={1.75} />
            Pagar ahora
          </button>
        )}
        {onCambiarEstado && (
          <button
            onClick={() => onCambiarEstado(reserva)}
            className="btn-secondary text-sm py-1.5 px-3"
          >
            Cambiar estado
          </button>
        )}
        <button
          onClick={() => descargarTicketReserva(reserva)}
          className="btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5 text-ink-500 hover:text-ink-800"
          title="Descargar comprobante"
        >
          <Download size={14} strokeWidth={1.75} />
          Compartir
        </button>
      </div>
    </div>
  );
};
