import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Phone } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { localesService } from '../../services/locales.service';
import { urlImagen } from '../../utils/media';
import { Local } from '../../types';

export const LocalesPage = () => {
  const [locales, setLocales] = useState<Local[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    localesService
      .getAll()
      .then((res) => setLocales(res.data))
      .catch(() => setError('Error al cargar los locales'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-ink-900">Complejos deportivos</h1>
          <p className="text-ink-500 mt-1 text-sm">
            Elige un local y descubre sus espacios deportivos disponibles
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Cargando locales..." />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-600 text-sm">{error}</div>
        ) : locales.length === 0 ? (
          <div className="text-center py-16 text-ink-400">
            <Building2 className="mx-auto mb-3" size={32} strokeWidth={1.5} />
            <p className="text-sm">Aún no hay locales publicados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {locales.map((local) => {
              const portada = local.imagenUrl || local.fotos?.[0];
              return (
                <Link
                  key={local.id}
                  to={`/locales/${local.id}`}
                  className="bg-white rounded-lg border border-ink-100 shadow-card overflow-hidden hover:border-ink-300 transition-colors block"
                >
                  {portada ? (
                    <img src={urlImagen(portada)} alt={local.nombre} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-ink-100 flex items-center justify-center text-ink-300">
                      <Building2 size={28} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-ink-900 mb-1.5">{local.nombre}</h3>
                    {local.direccion && (
                      <p className="flex items-center gap-1.5 text-sm text-ink-500 mb-1">
                        <MapPin size={13} strokeWidth={1.75} className="shrink-0" />
                        {local.direccion}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-sm text-ink-500 mb-2.5">
                      <Phone size={13} strokeWidth={1.75} className="shrink-0" />
                      {local.telefono}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {Array.from(new Set(local.canchas?.map((c) => c.deporte))).map((d) => (
                        <span key={d} className="text-xs px-2 py-0.5 rounded bg-ink-100 text-ink-600 font-medium">
                          {d}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-ink-400">
                      {local.canchas?.length || 0} espacio(s) deportivo(s)
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
