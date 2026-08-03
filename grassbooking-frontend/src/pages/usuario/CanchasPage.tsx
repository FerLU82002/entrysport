import { LandPlot } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CanchaCard } from '../../components/canchas/CanchaCard';
import { useCanchas } from '../../hooks/useCanchas';

export const CanchasPage = () => {
  const { canchas, isLoading, error } = useCanchas('publicas');

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-ink-900">Canchas disponibles</h1>
          <p className="text-ink-500 mt-1 text-sm">Selecciona una cancha para ver disponibilidad y reservar</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Cargando canchas..." />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-600 text-sm">{error}</div>
        ) : canchas.length === 0 ? (
          <div className="text-center py-16 text-ink-400">
            <LandPlot className="mx-auto mb-3" size={32} strokeWidth={1.5} />
            <p className="text-sm">No hay canchas disponibles en este momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {canchas.map((cancha) => (
              <CanchaCard key={cancha.id} cancha={cancha} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
