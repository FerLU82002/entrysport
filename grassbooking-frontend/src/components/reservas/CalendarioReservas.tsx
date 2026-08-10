import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Reserva, EstadoReserva } from '../../types';
import { reservasService } from '../../services/reservas.service';
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

// ── helpers ──────────────────────────────────────────────────────────────

function semanaDesde(offset: number): Date[] {
  const base = startOfWeek(addWeeks(new Date(), offset), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(base, i));
}

function toDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

function nombreCliente(r: Reserva): string {
  if (r.usuario?.nombre) return r.usuario.nombre;
  const m = r.notas?.match(/Cliente:\s*([^|]+)/);
  return m ? m[1].trim() : 'Cliente';
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

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset(p => p - 1)}
            className="p-1.5 rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50 active:bg-ink-100 transition-colors"
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
          <span className="text-xs sm:text-sm font-medium text-ink-700 text-center capitalize px-1">
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
              className="text-xs border border-ink-200 rounded-md px-2 py-1 text-ink-500 hover:text-ink-800 transition-colors ml-0.5"
            >
              Hoy
            </button>
          )}
        </div>

        {/* Pending badge + legend */}
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
        /*
         * KEY FIX FOR MOBILE:
         * overflow: auto (both axes) + max-height creates a proper scroll container.
         * This makes `sticky top-0` and `sticky left-0` both work correctly,
         * because sticky elements anchor to the nearest overflow ancestor.
         * Using only overflow-x: auto breaks sticky top-0 (CSS spec side-effect).
         */
        <div
          className="rounded-lg border border-ink-100 bg-white overflow-auto"
          style={{
            maxHeight: 'calc(100dvh - 230px)',
            WebkitOverflowScrolling: 'touch', // smooth momentum scroll on iOS
          }}
        >
          <div style={{ minWidth: 600 }}>

            {/* ── Day headers — sticky top inside scroll container ── */}
            <div
              className="grid sticky top-0 bg-white z-20 border-b border-ink-200 shadow-sm"
              style={{ gridTemplateColumns: '48px repeat(7, minmax(72px, 1fr))' }}
            >
              {/* Corner */}
              <div className="border-r border-ink-100" />

              {dias.map((dia, i) => {
                const esHoy   = isToday(dia);
                const hasPend = reservas.some(
                  r => r.fechaReserva === toDateStr(dia) && r.estado === 'pendiente',
                );
                return (
                  <div
                    key={i}
                    className={`py-2 text-center border-r border-ink-100 last:border-r-0 relative ${
                      esHoy ? 'bg-ink-900' : ''
                    }`}
                  >
                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${
                      esHoy ? 'text-ink-400' : 'text-ink-400'
                    }`}>
                      {DIAS[i]}
                    </p>
                    <p className={`text-sm font-bold leading-none mt-0.5 ${
                      esHoy ? 'text-white' : 'text-ink-800'
                    }`}>
                      {format(dia, 'd')}
                    </p>
                    {hasPend && !esHoy && (
                      <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Time rows ── */}
            {HORAS.map(hora => (
              <div
                key={hora}
                className="grid border-b border-ink-50 last:border-b-0"
                style={{
                  gridTemplateColumns: '48px repeat(7, minmax(72px, 1fr))',
                  minHeight: 64, // taller rows = easier to tap on mobile
                }}
              >
                {/* Hour label — sticky left inside scroll container */}
                <div className="sticky left-0 bg-white z-10 flex items-start justify-end pr-2 pt-2 border-r border-ink-100 shrink-0">
                  <span className="text-[11px] text-ink-400 tabular-nums leading-none">
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
                      className={`p-1 border-r border-ink-50 last:border-r-0 space-y-0.5 ${
                        esHoy ? 'bg-ink-50/40' : ''
                      }`}
                    >
                      {visible.map(r => (
                        <button
                          key={r.id}
                          onClick={() => onGestionar(r)}
                          title={`${nombreCliente(r)} · ${ESTADO_LABELS[r.estado]}`}
                          className={`w-full text-left rounded text-[11px] px-1.5 py-1 leading-tight ${PILL[r.estado]}`}
                        >
                          <span className="block truncate font-medium">
                            {nombreCliente(r)}
                          </span>
                          <span className="block text-[10px] opacity-60 tabular-nums">
                            {r.horaInicio.substring(0, 5)}–{r.horaFin.substring(0, 5)}
                          </span>
                        </button>
                      ))}
                      {extras > 0 && (
                        <button
                          onClick={() => onGestionar(items[2])}
                          className="text-[10px] text-ink-400 hover:text-ink-700 active:text-ink-900 block w-full text-left px-1 py-0.5"
                        >
                          +{extras} más
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
