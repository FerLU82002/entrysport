import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
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
  const { canchas } = useCanchas(false);
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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <main className="p-6 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Fechas especiales</h1>
            <p className="text-sm text-gray-500 mb-6">
              Bloquea fechas o franjas horarias específicas sin modificar la configuración semanal.
            </p>

            {/* Filtros */}
            <div className="card mb-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cancha</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="input-field w-auto"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Mantenimiento, Feriado, Evento..."
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner text="Cargando..." />
              </div>
            ) : (
              <>
                {/* Bloqueo del día completo */}
                <div className="card mb-6">
                  <h2 className="text-base font-semibold text-gray-800 mb-1">
                    Bloqueo del día — {diaSemanaLabel()} {fecha}
                  </h2>
                  <p className="text-xs text-gray-400 mb-4">
                    Bloquea todos los horarios de esta fecha de un solo golpe.
                  </p>

                  {bloqueoDia ? (
                    <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      <div>
                        <span className="text-red-700 font-medium text-sm">🔴 Día completo bloqueado</span>
                        {bloqueoDia.motivo && (
                          <span className="text-red-600 text-sm ml-2">— {bloqueoDia.motivo}</span>
                        )}
                      </div>
                      <button
                        onClick={() => eliminar(bloqueoDia.id)}
                        className="btn-secondary text-sm shrink-0"
                      >
                        Quitar bloqueo
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                      <p className="text-sm text-green-700">
                        ✅ Día disponible según horario semanal habitual.
                      </p>
                      <button
                        onClick={bloquearDia}
                        disabled={guardando === 'dia'}
                        className="btn-danger text-sm shrink-0 flex items-center gap-2"
                      >
                        {guardando === 'dia'
                          ? <><LoadingSpinner size="sm" /> Guardando...</>
                          : '🔒 Bloquear día completo'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bloqueos por hora */}
                {!bloqueoDia && (
                  <div className="card">
                    <h2 className="text-base font-semibold text-gray-800 mb-1">Horarios del día</h2>
                    <p className="text-xs text-gray-400 mb-4">
                      Verde = disponible · Rojo = bloqueado solo en esta fecha. Haz clic para cambiar.
                    </p>

                    {horariosDia.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-3xl mb-2">🕐</p>
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
                              className={`rounded-xl border-2 p-3 text-center transition-all ${
                                exc
                                  ? 'bg-red-50 border-red-300'
                                  : 'bg-green-50 border-green-200'
                              }`}
                            >
                              <p className="font-semibold text-sm text-gray-800">
                                {hora}
                              </p>
                              <p className="text-xs text-gray-500">{horaFin}</p>

                              {exc?.motivo && (
                                <p className="text-xs text-red-500 mt-1 truncate" title={exc.motivo}>
                                  {exc.motivo}
                                </p>
                              )}

                              {exc ? (
                                <button
                                  onClick={() => eliminar(exc.id)}
                                  className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  ✕ Quitar bloqueo
                                </button>
                              ) : (
                                <button
                                  onClick={() => bloquearSlot(slot)}
                                  disabled={cargandoSlot}
                                  className="mt-2 text-xs text-gray-500 hover:text-gray-800 font-medium"
                                >
                                  {cargandoSlot ? '...' : '🔒 Bloquear'}
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
        </div>
      </div>
    </div>
  );
};
