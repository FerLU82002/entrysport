import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, LandPlot, MapPin, Phone, Mail } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CanchaCard } from '../../components/canchas/CanchaCard';
import { localesService } from '../../services/locales.service';
import { urlImagen } from '../../utils/media';
import { Local } from '../../types';

export const LocalDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [local, setLocal] = useState<Local | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    localesService
      .getById(Number(id))
      .then((res) => setLocal(res.data))
      .catch(() => navigate('/locales'))
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-50">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" text="Cargando local..." />
        </div>
      </div>
    );
  }

  if (!local) return null;

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/locales')}
          className="text-ink-500 hover:text-ink-900 text-sm mb-4 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={15} strokeWidth={1.75} />
          Volver a locales
        </button>

        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {local.imagenUrl ? (
              <img
                src={urlImagen(local.imagenUrl)}
                alt={local.nombre}
                className="w-full sm:w-40 h-40 rounded-lg object-cover"
              />
            ) : (
              <div className="w-full sm:w-40 h-40 bg-ink-100 rounded-lg flex items-center justify-center text-ink-300">
                <Building2 size={32} strokeWidth={1.5} />
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold text-ink-900">{local.nombre}</h1>
              {local.descripcion && <p className="text-ink-500 mt-1 text-sm">{local.descripcion}</p>}
              <div className="mt-3 space-y-1.5 text-sm text-ink-600">
                {local.direccion && (
                  <p className="flex items-center gap-1.5">
                    <MapPin size={14} strokeWidth={1.75} className="shrink-0 text-ink-400" />
                    {local.direccion}
                  </p>
                )}
                <p className="flex items-center gap-1.5">
                  <Phone size={14} strokeWidth={1.75} className="shrink-0 text-ink-400" />
                  {local.telefono}
                </p>
                {local.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail size={14} strokeWidth={1.75} className="shrink-0 text-ink-400" />
                    {local.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {local.fotos && local.fotos.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {local.fotos.map((foto) => (
                <img
                  key={foto}
                  src={urlImagen(foto)}
                  alt={local.nombre}
                  className="w-24 h-24 rounded-md object-cover shrink-0 border border-ink-100"
                />
              ))}
            </div>
          )}
        </div>

        <h2 className="text-base font-semibold text-ink-900 mb-4">Espacios deportivos</h2>

        {!local.canchas || local.canchas.length === 0 ? (
          <div className="card text-center py-12 text-ink-400">
            <LandPlot className="mx-auto mb-3" size={28} strokeWidth={1.5} />
            <p className="text-sm">Este local aún no tiene espacios deportivos publicados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {local.canchas.map((cancha) => (
              <CanchaCard
                key={cancha.id}
                cancha={{ ...cancha, descuentoPct: local.descuentoPct ?? 0 }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
