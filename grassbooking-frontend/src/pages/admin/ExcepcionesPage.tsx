import { useState, useEffect } from 'react';
import { Ban, CheckCircle2, Clock, Lock, X } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useCanchas } from '../../hooks/useCanchas';
import { excepcionesService } from '../../services/excepciones.service';
import api from '../../services/api';
import { ApiResponse, Horario, HorarioExcepcion } from '../../types';
import { format } from 'date-fns';

const DIAS_SEMANA: Record<number, string> = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
  4: 'jueves', 5: 'viernes', 6: 'sabado',
};

export const ExcepcionesPage = () => {
  const { canchas } = useCanchas('mi-local');
  const [canchaId, setCanchaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [excepciones, setExcepciones] = useState<HorarioExcepcion[]>([]);
  const [horariosDia, setHorariosDia] = useState<Horario[]>([]);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (canchas.length > 0 && !canchaId) setCanchaId(canchas[0].id);
  }, [canchas]);

  useEffect(() => {
    cargar();
  }, [canchaId, fecha]);

  const cargar = async () => {
    if (!canchaId || !fecha) return;
    setLoading(true);
    setError('');
    try {
      const fechaDate = new Date(fecha + 'T00:00:00');
      const dia = DIAS_SEMANA[fechaDate.getDay()];

      const [horRes, excRes] = await Promise.all([
        api.get<ApiResponse<Horario[]>>(`/horarios/${canchaId}`),
        excepcionesService.getByFecha(canchaId, fecha),
      ]);

      setHorariosDia(
        horRes.data.data
          .filter((h) => h.diaSemana === dia && h.disponible)
          .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
      );
      setExcepciones(excRes.data.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const bloqueoDia = excepciones.find((e) => e.horaInicio === null);
  const excMap = new Map(
    excepciones
      .filter((e) => e.horaInicio !== null)
      .map((e) => [e.horaInicio!.substring(0, 5), e]),
  );

  const bloquearDia = async () => {
    if (!canchaId) return;
    setGuardando('dia');
    try {
      await excepcionesService.create({
        idCancha: canchaId,
        fecha,
        motivo: motivo || undefined,
      });
      setMotivo('');
      await cargar();
    } catch {
      setError('Error al bloquear el día');
    } finally {
      setGuardando(null);
    }
  };

  const bloquearSlot = async (slot: Horario) => {
    if (!canchaId) return;
    const hora = slot.horaInicio.substring(0, 5);
    setGuardando(hora);
    try {
      await excepcionesService.create({
        idCancha: canchaId,
        fecha,
        horaInicio: hora,
        horaFin: slot.horaFin.substring(0, 5),
        motivo: motivo || undefined,
      });
      await cargar();
    } catch {
      setError('Error al bloquear el horario');
    } finally {
      setGuardando(null);
    }
  };

  const eliminar = async (id: number) => {
    try {
      await excepcionesService.remove(id);
      await cargar();
    } catch {
      setError('Error al eliminar la excepción');
    }
  };

  const diaSemanaLabel = () => {
    const d = new Date(fecha + 'T00:00:00');
    return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][d.getDay()];
  };

  return (
    <main className="p-6 max-w-4xl">
            <h1 className="text-xl font-semibold text-ink-900 mb-1">Fechas especiales</h1>
            <p className="text-sm text-ink-500 mb-6">
              Bloquea fechas o franjas horarias específicas sin modificar la configuración semanal.
            </p>

            <div className="card mb-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Cancha</label>
                  <select
                    value={canchaId || ''}
                    onChange={(e) => setCanchaId(Number(e.target.value))}
                    className="input-field w-48"
                  >
                    {canchas.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="input-field w-auto"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">
                    Motivo <span className="text-ink-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Mantenimiento, feriado, evento..."
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner text="Cargando..." />
              </div>
            ) : (
              <>
                <div className="card mb-6">
                  <h2 className="text-sm font-semibold text-ink-900 mb-1">
                    Bloqueo del día — {diaSemanaLabel()} {fecha}
                  </h2>
                  <p className="text-xs text-ink-400 mb-4">
                    Bloquea todos los horarios de esta fecha de un solo golpe.
                  </p>

                  {bloqueoDia ? (
                    <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Ban size={15} strokeWidth={1.75} className="text-red-600 shrink-0" />
                        <span className="text-red-700 font-medium text-sm">Día completo bloqueado</span>
                        {bloqueoDia.motivo && (
                          <span className="text-red-600 text-sm">— {bloqueoDia.motivo}</span>
                        )}
                      </div>
                      <button onClick={() => eliminar(bloqueoDia.id)} className="btn-secondary text-sm shrink-0">
                        Quitar bloqueo
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4 bg-brand-50 border border-brand-200 rounded-md px-4 py-3">
                      <p className="flex items-center gap-2 text-sm text-brand-800">
                        <CheckCircle2 size={15} strokeWidth={1.75} className="shrink-0" />
                        Día disponible según horario semanal habitual.
                      </p>
                      <button
                        onClick={bloquearDia}
                        disabled={guardando === 'dia'}
                        className="btn-danger text-sm shrink-0 flex items-center gap-1.5"
                      >
                        {guardando === 'dia' ? (
                          <><LoadingSpinner size="sm" /> Guardando...</>
                        ) : (
                          <><Lock size={13} strokeWidth={1.75} /> Bloquear día completo</>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {!bloqueoDia && (
                  <div className="card">
                    <h2 className="text-sm font-semibold text-ink-900 mb-1">Horarios del día</h2>
                    <p className="text-xs text-ink-400 mb-4">
                      Haz clic en un horario para bloquearlo o desbloquearlo solo en esta fecha.
                    </p>

                    {horariosDia.length === 0 ? (
                      <div className="text-center py-8 text-ink-400">
                        <Clock className="mx-auto mb-2" size={24} strokeWidth={1.5} />
                        <p className="text-sm">No hay horarios configurados para este día de la semana.</p>
                        <p className="text-xs mt-1">Configúralos en "Horarios".</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {horariosDia.map((slot) => {
                          const hora = slot.horaInicio.substring(0, 5);
                          const horaFin = slot.horaFin.substring(0, 5);
                          const exc = excMap.get(hora);
                          const cargandoSlot = guardando === hora;

                          return (
                            <div
                              key={slot.id}
                              className={`rounded-md border p-3 text-center transition-colors ${
                                exc ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
                              }`}
                            >
                              <p className="font-medium text-sm text-ink-900">{hora}</p>
                              <p className="text-xs text-ink-400">{horaFin}</p>

                              {exc?.motivo && (
                                <p className="text-xs text-red-500 mt-1 truncate" title={exc.motivo}>
                                  {exc.motivo}
                                </p>
                              )}

                              {exc ? (
                                <button
                                  onClick={() => eliminar(exc.id)}
                                  className="mt-2 flex items-center justify-center gap-1 w-full text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  <X size={11} strokeWidth={2} /> Quitar bloqueo
                                </button>
                              ) : (
                                <button
                                  onClick={() => bloquearSlot(slot)}
                                  disabled={cargandoSlot}
                                  className="mt-2 flex items-center justify-center gap-1 w-full text-xs text-ink-400 hover:text-ink-700 font-medium"
                                >
                                  {cargandoSlot ? '...' : <><Lock size={11} strokeWidth={1.75} /> Bloquear</>}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
    </main>
  );
};
