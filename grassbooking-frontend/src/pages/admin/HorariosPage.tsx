import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useCanchas } from '../../hooks/useCanchas';
import api from '../../services/api';
import { ApiResponse, Horario } from '../../types';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIA_LABELS: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
};

export const HorariosPage = () => {
  const { canchas } = useCanchas(false);
  const [canchaId, setCanchaId] = useState<number | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    if (canchas.length > 0 && !canchaId) {
      setCanchaId(canchas[0].id);
    }
  }, [canchas, canchaId]);

  useEffect(() => {
    if (!canchaId) return;
    setIsLoading(true);
    api
      .get<ApiResponse<Horario[]>>(`/horarios/${canchaId}`)
      .then((res) => setHorarios(res.data.data))
      .finally(() => setIsLoading(false));
  }, [canchaId]);

  const toggleDisponible = async (horario: Horario) => {
    setToggling(horario.id);
    try {
      await api.patch(`/horarios/${horario.id}`, {
        disponible: !horario.disponible,
      });
      setHorarios((prev) =>
        prev.map((h) =>
          h.id === horario.id ? { ...h, disponible: !h.disponible } : h,
        ),
      );
    } finally {
      setToggling(null);
    }
  };

  const horariosPorDia = DIAS.reduce<Record<string, Horario[]>>((acc, dia) => {
    acc[dia] = horarios.filter((h) => h.diaSemana === dia).sort((a, b) =>
      a.horaInicio.localeCompare(b.horaInicio),
    );
    return acc;
  }, {});

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
        <main className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Configuración de horarios</h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cancha</label>
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

          <p className="text-sm text-gray-500 mb-4">
            Haz clic en un horario para activar/desactivar. Los horarios desactivados no estarán disponibles para reserva.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" text="Cargando horarios..." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 min-w-[700px]">
                {DIAS.map((dia) => (
                  <div key={dia}>
                    <div className="text-center font-medium text-gray-700 text-sm mb-2 pb-2 border-b">
                      {DIA_LABELS[dia]}
                    </div>
                    <div className="space-y-1">
                      {horariosPorDia[dia]?.map((horario) => {
                        const hora = parseInt(horario.horaInicio.split(':')[0]);
                        const ampm = hora >= 12 ? 'PM' : 'AM';
                        const hora12 = hora > 12 ? hora - 12 : hora;
                        return (
                          <button
                            key={horario.id}
                            onClick={() => toggleDisponible(horario)}
                            disabled={toggling === horario.id}
                            className={`w-full text-xs py-1.5 rounded text-center transition-colors ${
                              horario.disponible
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {toggling === horario.id ? '...' : `${hora12}${ampm}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
        </div>
      </div>
    </div>
  );
};
