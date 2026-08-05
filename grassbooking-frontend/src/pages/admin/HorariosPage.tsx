import { useState, useEffect } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useCanchas } from '../../hooks/useCanchas';
import api from '../../services/api';
import { ApiResponse, Horario, DiaSemana } from '../../types';
import axios from 'axios';

const DIAS: DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIA_LABELS: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
};
const DIA_LABELS_FULL: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
};

// Opciones de hora de 6:00 a 23:00
const HORAS = Array.from({ length: 18 }, (_, i) => {
  const h = i + 6;
  return `${String(h).padStart(2, '0')}:00`;
});

export const HorariosPage = () => {
  const { canchas } = useCanchas('mi-local');
  const [canchaId, setCanchaId] = useState<number | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  // Generador
  const [horaApertura, setHoraApertura] = useState('08:00');
  const [horaCierre, setHoraCierre] = useState('22:00');
  const [diasSeleccionados, setDiasSeleccionados] = useState<DiaSemana[]>([...DIAS]);
  const [generando, setGenerando] = useState(false);
  const [msgGenerar, setMsgGenerar] = useState('');
  const [errorGenerar, setErrorGenerar] = useState('');

  useEffect(() => {
    if (canchas.length > 0 && !canchaId) {
      setCanchaId(canchas[0].id);
    }
  }, [canchas, canchaId]);

  const cargarHorarios = (id: number) => {
    setIsLoading(true);
    api
      .get<ApiResponse<Horario[]>>(`/horarios/${id}`)
      .then((res) => setHorarios(res.data.data))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!canchaId) return;
    cargarHorarios(canchaId);
  }, [canchaId]);

  const toggleDisponible = async (horario: Horario) => {
    setToggling(horario.id);
    try {
      await api.patch(`/horarios/${horario.id}`, { disponible: !horario.disponible });
      setHorarios((prev) =>
        prev.map((h) => h.id === horario.id ? { ...h, disponible: !h.disponible } : h),
      );
    } finally {
      setToggling(null);
    }
  };

  const toggleDia = (dia: DiaSemana) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
  };

  const handleGenerar = async () => {
    if (!canchaId) return;
    if (diasSeleccionados.length === 0) {
      setErrorGenerar('Selecciona al menos un día.');
      return;
    }
    const [aH] = horaApertura.split(':').map(Number);
    const [cH] = horaCierre.split(':').map(Number);
    if (aH >= cH) {
      setErrorGenerar('La hora de apertura debe ser menor que la del último turno.');
      return;
    }

    setGenerando(true);
    setMsgGenerar('');
    setErrorGenerar('');
    try {
      const res = await api.post<ApiResponse<Horario[]>>('/horarios/generar', {
        idCancha: canchaId,
        horaApertura,
        horaCierre,
        dias: diasSeleccionados,
      });
      setMsgGenerar(res.data.message);
      cargarHorarios(canchaId);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorGenerar(err.response?.data?.message || 'Error al generar horarios');
      } else {
        setErrorGenerar('Error inesperado.');
      }
    } finally {
      setGenerando(false);
    }
  };

  const horariosPorDia = DIAS.reduce<Record<string, Horario[]>>((acc, dia) => {
    acc[dia] = horarios.filter((h) => h.diaSemana === dia).sort((a, b) =>
      a.horaInicio.localeCompare(b.horaInicio),
    );
    return acc;
  }, {});

  const [aH] = horaApertura.split(':').map(Number);
  const [cH] = horaCierre.split(':').map(Number);
  const slotCount = Math.max(0, cH - aH + 1);

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <main className="p-6 max-w-5xl">
            <h1 className="text-xl font-semibold text-ink-900 mb-6">Configuración de horarios</h1>

            {/* Selector de cancha */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Cancha</label>
              <select
                value={canchaId || ''}
                onChange={(e) => setCanchaId(Number(e.target.value))}
                className="input-field max-w-xs"
              >
                {canchas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* ── Generador automático ── */}
            <div className="bg-white border border-ink-100 rounded-lg p-5 mb-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-ink-500" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-ink-900">Generar horarios automáticamente</h2>
              </div>

              <p className="text-xs text-ink-400 mb-4">
                Define el rango de atención y los días. Esto <span className="font-medium text-ink-600">reemplazará</span> los turnos actuales de los días seleccionados.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Primer turno</label>
                  <select
                    value={horaApertura}
                    onChange={(e) => { setHoraApertura(e.target.value); setMsgGenerar(''); setErrorGenerar(''); }}
                    className="input-field text-sm"
                  >
                    {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-700 mb-1">Último turno</label>
                  <select
                    value={horaCierre}
                    onChange={(e) => { setHoraCierre(e.target.value); setMsgGenerar(''); setErrorGenerar(''); }}
                    className="input-field text-sm"
                  >
                    {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {aH < cH && (
                <p className="text-xs text-ink-400 mb-3">
                  Se crearán <span className="font-medium text-ink-700">{slotCount} turnos</span> por día ({horaApertura} → {String((cH + 1) % 24).padStart(2, '0')}:00)
                </p>
              )}

              {/* Días */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-ink-700">Días</label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDiasSeleccionados([...DIAS])}
                      className="text-ink-500 hover:text-ink-800 underline"
                    >
                      Todos
                    </button>
                    <span className="text-ink-300">|</span>
                    <button
                      type="button"
                      onClick={() => setDiasSeleccionados([])}
                      className="text-ink-500 hover:text-ink-800 underline"
                    >
                      Ninguno
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DIAS.map((dia) => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => { toggleDia(dia); setMsgGenerar(''); setErrorGenerar(''); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        diasSeleccionados.includes(dia)
                          ? 'bg-ink-900 text-white border-ink-900'
                          : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'
                      }`}
                    >
                      {DIA_LABELS_FULL[dia]}
                    </button>
                  ))}
                </div>
              </div>

              {msgGenerar && (
                <p className="text-emerald-700 text-xs mb-3 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                  {msgGenerar}
                </p>
              )}
              {errorGenerar && (
                <p className="text-red-600 text-xs mb-3 bg-red-50 border border-red-100 rounded px-3 py-2">
                  {errorGenerar}
                </p>
              )}

              <button
                onClick={handleGenerar}
                disabled={generando || !canchaId}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
              >
                {generando ? (
                  <><LoadingSpinner size="sm" /> Generando...</>
                ) : (
                  <><RefreshCw size={14} strokeWidth={2} /> Generar horarios</>
                )}
              </button>
            </div>

            {/* ── Vista de horarios actuales ── */}
            <div>
              <p className="text-sm text-ink-500 mb-4">
                Haz clic en un turno para activar o desactivarlo individualmente.
              </p>

              {isLoading ? (
                <div className="flex justify-center py-16">
                  <LoadingSpinner size="lg" text="Cargando horarios..." />
                </div>
              ) : horarios.length === 0 ? (
                <div className="text-center py-10 text-ink-400 text-sm">
                  No hay horarios configurados. Usa el generador de arriba.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-7 gap-2 min-w-[700px]">
                    {DIAS.map((dia) => (
                      <div key={dia}>
                        <div className="text-center font-medium text-ink-700 text-sm mb-2 pb-2 border-b border-ink-100">
                          {DIA_LABELS[dia]}
                        </div>
                        <div className="space-y-1">
                          {horariosPorDia[dia]?.length === 0 ? (
                            <p className="text-xs text-ink-300 text-center py-2">—</p>
                          ) : (
                            horariosPorDia[dia].map((horario) => {
                              const hora = parseInt(horario.horaInicio.split(':')[0]);
                              const ampm = hora >= 12 ? 'PM' : 'AM';
                              const hora12 = hora === 0 ? 12 : hora > 12 ? hora - 12 : hora;
                              return (
                                <button
                                  key={horario.id}
                                  onClick={() => toggleDisponible(horario)}
                                  disabled={toggling === horario.id}
                                  className={`w-full text-xs py-1.5 rounded text-center transition-colors border ${
                                    horario.disponible
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'
                                  }`}
                                >
                                  {toggling === horario.id ? '...' : `${hora12}${ampm}`}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
