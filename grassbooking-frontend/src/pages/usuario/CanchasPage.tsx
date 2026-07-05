import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CanchaCard } from '../../components/canchas/CanchaCard';
import { useCanchas } from '../../hooks/useCanchas';

export const CanchasPage = () => {
  const { canchas, isLoading, error } = useCanchas(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Canchas disponibles</h1>
          <p className="text-gray-500 mt-1">Selecciona una cancha para ver disponibilidad y reservar</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Cargando canchas..." />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">
            <p>{error}</p>
          </div>
        ) : canchas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">🏟️</p>
            <p>No hay canchas disponibles en este momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canchas.map((cancha) => (
              <CanchaCard key={cancha.id} cancha={cancha} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
