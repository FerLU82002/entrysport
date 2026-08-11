import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Reserva, EstadoReserva } from '../../types';
import { reservasService } from '../../services/reservas.service';
import { nombreClienteReserva, canchaLabel, to12h } from '../../utils/reserva';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { format, addWeeks, addDays, isToday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

// ── constants ────────────────────────────────────────────────────────────

const HORAS = Array.from({ length: 16 }, (_, i) => i + 8); // 08:00 – 23:00
const DIAS  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const PILL: Record<EstadoReserva, string> = {
  pendiente:  'bg-amber-50  text-amber-800  ring-1 ring-amber-300  font-semibold',
  confirmada: 'bg-green-50  text-green-800  ring-1 ring-green-200',
  completada: 'bg-sky-50    text-sky-700    ring-1 ring-sky-200',
  cancelada:  'bg-ink-100   text-ink-400    ring-1 ring-ink-200    line-through opacity-60',
  no_asistio: 'bg-red-50    text-red-600    ring-1 ring-red-200',
};

const ESTADO_LABELS: Record<EstadoReserva, string> = {
  pendiente:  'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada:  'Cancelada',
  no_asistio: 'No asistió',
};

// Adaptive grid: hour column fixed (40px) + 7 day columns that share remaining space.
// minmax(0, 1fr) lets columns shrink to 0 — all 7 days always fit on any screen width.
const COL = '40px repeat(7, minmax(0, 1fr))';

// ── helpers ──────────────────────────────────────────────────────────────

function semanaDesde(offset: number): Date[] {
  const base = startOfWeek(addWeeks(new Date(), offset), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(base, i));
}

function toDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

// ── component ────────────────────────────────────────────────────────────

interface Props {
  onGestionar: (reserva: Reserva) => void;
  refreshKey?: number;
}

export const CalendarioReservas = ({ onGestionar, refreshKey = 0 }: Props) => {
  const [offset, setOffset]     = useState(0);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);

  const dias        = semanaDesde(offset);
  const semanaLabel = `${format(dias[0], "d MMM", { locale: es })} – ${format(dias[6], "d MMM yyyy", { locale: es })}`;

  useEffect(() => {
    setCargando(true);
    reservasService.getTodas()
      .then(res => setReservas(res.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [refreshKey]);

  const celdaReservas = (dia: Date, hora: number): Reserva[] =>
    reservas.filter(r =>
      r.fechaReserva === toDateStr(dia) &&
      parseInt(r.horaInicio.split(':')[0], 10) === hora,
    );

  const pendientesEnSemana = reservas.filter(
    r => r.estado === 'pendiente' && dias.some(d => toDateStr(d) === r.fechaReserva),
  ).length;

  return (
    <div>
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset(p => p - 1)}
            className="p-1.5 rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50 active:bg-ink-100 transition-colors"
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
          <span className="text-xs sm:text-sm font-medium text-ink-700 capitalize px-1">
            {semanaLabel}
          </span>
          <button
            onClick={() => setOffset(p => p + 1)}
            className="p-1.5 rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50 active:bg-ink-100 transition-colors"
          >
            <ChevronRight size={15} strokeWidth={2} />
          </button>
          {offset !== 0 && (
            <button
              onClick={() => setOffset(0)}
              className="text-xs border border-ink-200 rounded-md px-2 py-1 text-ink-500 hover:text-ink-800 ml-0.5"
            >
              Hoy
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-500">
          {pendientesEnSemana > 0 && (
            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md px-2 py-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              {pendientesEnSemana} pend.
            </span>
          )}
          <span className="hidden lg:flex items-center gap-3">
            {([
              ['bg-amber-400', 'Pendiente'],
              ['bg-green-500', 'Confirmada'],
              ['bg-sky-400',   'Completada'],
              ['bg-ink-300',   'Cancelada'],
            ] as [string, string][]).map(([bg, lbl]) => (
              <span key={lbl} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${bg} inline-block`} />
                {lbl}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────── */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner text="Cargando reservas..." />
        </div>
      ) : (
        <div className="rounded-lg border border-ink-100 bg-white overflow-hidden">

          {/*
           * Day header row — sits OUTSIDE the hour rows so it can be sticky
           * at the page scroll level. Uses the same COL grid as hour rows.
           */}
          <div
            className="grid border-b border-ink-200 bg-white"
            style={{ gridTemplateColumns: COL }}
          >
            {/* Corner cell */}
            <div className="border-r border-ink-100 h-11" />

            {dias.map((dia, i) => {
              const esHoy   = isToday(dia);
              const hasPend = reservas.some(
                r => r.fechaReserva === toDateStr(dia) && r.estado === 'pendiente',
              );
              return (
                <div
                  key={i}
                  className={`py-1.5 text-center border-r border-ink-100 last:border-r-0 relative ${
                    esHoy ? 'bg-ink-900' : ''
                  }`}
                >
                  <p className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide ${
                    esHoy ? 'text-ink-400' : 'text-ink-400'
                  }`}>
                    {DIAS[i]}
                  </p>
                  <p className={`text-xs sm:text-sm font-bold leading-none mt-0.5 ${
                    esHoy ? 'text-white' : 'text-ink-800'
                  }`}>
                    {format(dia, 'd')}
                  </p>
                  {hasPend && !esHoy && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Hour rows */}
          {HORAS.map(hora => (
            <div
              key={hora}
              className="grid border-b border-ink-50 last:border-b-0"
              style={{ gridTemplateColumns: COL, minHeight: 58 }}
            >
              {/* Hour label */}
              <div className="flex items-start justify-end pr-1.5 pt-1.5 border-r border-ink-100 shrink-0">
                <span className="text-[10px] text-ink-400 tabular-nums leading-none">
                  {hora}:00
                </span>
              </div>

              {/* Day cells */}
              {dias.map((dia, di) => {
                const items   = celdaReservas(dia, hora);
                const esHoy   = isToday(dia);
                const visible = items.slice(0, 2);
                const extras  = items.length - visible.length;

                return (
                  <div
                    key={di}
                    className={`p-0.5 border-r border-ink-50 last:border-r-0 space-y-0.5 min-w-0 ${
                      esHoy ? 'bg-ink-50/40' : ''
                    }`}
                  >
                    {visible.map(r => (
                      <button
                        key={r.id}
                        onClick={() => onGestionar(r)}
                        title={`${nombreClienteReserva(r)} · ${canchaLabel(r)} · ${ESTADO_LABELS[r.estado]}`}
                        className={`w-full text-left rounded text-[10px] px-1 py-0.5 leading-tight min-w-0 ${PILL[r.estado]}`}
                      >
                        <span className="block truncate font-medium">
                          {nombreClienteReserva(r)}
                        </span>
                        <span className="block truncate text-[9px] opacity-60">
                          {canchaLabel(r)}
                        </span>
                        <span className="block text-[9px] opacity-60 tabular-nums">
                          {to12h(r.horaInicio)}
                        </span>
                      </button>
                    ))}
                    {extras > 0 && (
                      <button
                        onClick={() => onGestionar(items[2])}
                        className="text-[9px] text-ink-400 hover:text-ink-700 block w-full text-left px-0.5"
                      >
                        +{extras}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
