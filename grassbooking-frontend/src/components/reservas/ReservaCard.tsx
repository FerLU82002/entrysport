import { Reserva, ESTADO_COLORES, ESTADO_LABELS } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { format, parseISO, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  reserva: Reserva;
  onCancelar?: (id: number) => void;
  cancelando?: boolean;
  showUsuario?: boolean;
  onCambiarEstado?: (reserva: Reserva) => void;
}

export const ReservaCard = ({
  reserva,
  onCancelar,
  cancelando,
  showUsuario,
  onCambiarEstado,
}: Props) => {
  // PostgreSQL devuelve TIME como "HH:MM:SS" — tomar solo "HH:MM"
  const horaInicioLimpia = reserva.horaInicio.substring(0, 5);
  const horaFinLimpia = reserva.horaFin.substring(0, 5);

  const fechaHoraReserva = new Date(`${reserva.fechaReserva}T${horaInicioLimpia}:00`);
  const puedesCancelar =
    reserva.estado !== 'cancelada' &&
    reserva.estado !== 'completada' &&
    differenceInHours(fechaHoraReserva, new Date()) >= 2;

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
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ESTADO_COLORES[reserva.estado]}`}>
              {ESTADO_LABELS[reserva.estado]}
            </span>
            <span className="text-xs text-gray-400 font-mono">
              #{reserva.codigoReserva?.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <h3 className="font-semibold text-gray-800">
            {reserva.cancha?.nombre || `Cancha #${reserva.idCancha}`}
          </h3>

          {showUsuario && reserva.usuario && (
            <p className="text-sm text-gray-500">
              👤 {reserva.usuario.nombre} • {reserva.usuario.telefono}
            </p>
          )}

          <p className="text-sm text-gray-600 mt-1">
            📅{' '}
            {format(parseISO(reserva.fechaReserva), "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <p className="text-sm text-gray-600">
            🕐 {hora12}:00 {ampm} – {horaFin12}:00 {ampmFin}
          </p>
          {reserva.notas && (
            <p className="text-xs text-gray-400 mt-1 italic">"{reserva.notas}"</p>
          )}
        </div>

        <div className="text-right">
          <p className="text-green-600 font-bold text-lg">
            S/ {Number(reserva.montoTotal).toFixed(2)}
          </p>
          {reserva.pago && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                reserva.pago.estadoPago === 'pagado'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-orange-100 text-orange-600'
              }`}
            >
              {reserva.pago.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente pago'}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        {onCancelar && puedesCancelar && (
          <button
            onClick={() => onCancelar(reserva.id)}
            disabled={cancelando}
            className="btn-danger text-sm py-1.5 px-3"
          >
            {cancelando ? (
              <span className="flex items-center gap-1">
                <LoadingSpinner size="sm" /> Cancelando...
              </span>
            ) : (
              'Cancelar reserva'
            )}
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
      </div>
    </div>
  );
};
