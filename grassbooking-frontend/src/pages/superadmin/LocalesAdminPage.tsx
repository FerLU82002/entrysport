import { useEffect, useState } from 'react';
import { Building2, Phone, MapPin } from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { localesService } from '../../services/locales.service';
import { Local } from '../../types';

export const LocalesAdminPage = () => {
  const [locales, setLocales] = useState<Local[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actualizando, setActualizando] = useState<number | null>(null);

  const cargar = () => {
    setIsLoading(true);
    localesService
      .getAllAdmin()
      .then((res) => setLocales(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(cargar, []);

  const toggleEstado = async (local: Local) => {
    setActualizando(local.id);
    try {
      await localesService.actualizarEstado(local.id, local.estado === 'activo' ? 'inactivo' : 'activo');
      cargar();
    } finally {
      setActualizando(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <main className="p-6 max-w-6xl">
            <h1 className="text-xl font-semibold text-ink-900 mb-6">Locales registrados</h1>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" text="Cargando locales..." />
              </div>
            ) : locales.length === 0 ? (
              <div className="card text-center py-12 text-ink-400">
                <Building2 className="mx-auto mb-3" size={28} strokeWidth={1.5} />
                <p className="text-sm">Aún no hay locales registrados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {locales.map((local) => (
                  <div key={local.id} className="card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-medium text-ink-900">{local.nombre}</h3>
                          <span
                            className={`badge ${
                              local.estado === 'activo'
                                ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200'
                                : 'bg-ink-100 text-ink-500 ring-1 ring-inset ring-ink-200'
                            }`}
                          >
                            {local.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="flex items-center gap-1.5 text-sm text-ink-500">
                          <Phone size={13} strokeWidth={1.75} /> {local.telefono}
                        </p>
                        {local.direccion && (
                          <p className="flex items-center gap-1.5 text-sm text-ink-500">
                            <MapPin size={13} strokeWidth={1.75} /> {local.direccion}
                          </p>
                        )}
                        <p className="text-xs text-ink-400 mt-1">
                          {local.canchas?.length || 0} espacio(s) ·{' '}
                          {local.administradores?.length
                            ? local.administradores.map((a) => a.nombre).join(', ')
                            : 'Sin administrador asignado'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleEstado(local)}
                        disabled={actualizando === local.id}
                        className={`text-sm py-2 px-4 rounded-md font-medium transition-colors border shrink-0 ${
                          local.estado === 'activo'
                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                            : 'text-brand-700 border-brand-200 hover:bg-brand-50'
                        }`}
                      >
                        {actualizando === local.id
                          ? '...'
                          : local.estado === 'activo'
                          ? 'Desactivar'
                          : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
