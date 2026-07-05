import { useState } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CanchaCard } from '../../components/canchas/CanchaCard';
import { CanchaForm } from '../../components/canchas/CanchaForm';
import { useCanchas } from '../../hooks/useCanchas';
import { canchasService } from '../../services/canchas.service';
import { Cancha } from '../../types';

export const GestionCanchasPage = () => {
  const { canchas, isLoading, recargar } = useCanchas(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [canchaEditando, setCanchaEditando] = useState<Cancha | undefined>();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: Partial<Cancha>) => {
    setGuardando(true);
    setError('');
    try {
      if (canchaEditando) {
        await canchasService.update(canchaEditando.id, data);
      } else {
        await canchasService.create(data);
      }
      setMostrarForm(false);
      setCanchaEditando(undefined);
      recargar();
    } catch {
      setError('Error al guardar la cancha');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (cancha: Cancha) => {
    await canchasService.update(cancha.id, {
      estado: cancha.estado === 'activa' ? 'inactiva' : 'activa',
    });
    recargar();
  };

  const handleEdit = (cancha: Cancha) => {
    setCanchaEditando(cancha);
    setMostrarForm(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
        <main className="p-6 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Gestión de canchas</h1>
            <button
              onClick={() => {
                setCanchaEditando(undefined);
                setMostrarForm(true);
              }}
              className="btn-primary"
            >
              + Nueva cancha
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {mostrarForm && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {canchaEditando ? 'Editar cancha' : 'Nueva cancha'}
              </h2>
              <CanchaForm
                cancha={canchaEditando}
                onSubmit={handleSubmit}
                onCancelar={() => {
                  setMostrarForm(false);
                  setCanchaEditando(undefined);
                }}
                isLoading={guardando}
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" text="Cargando canchas..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {canchas.map((cancha) => (
                <CanchaCard
                  key={cancha.id}
                  cancha={cancha}
                  showActions
                  onEdit={handleEdit}
                  onToggleEstado={handleToggleEstado}
                />
              ))}
            </div>
          )}
        </main>
        </div>
      </div>
    </div>
  );
};
