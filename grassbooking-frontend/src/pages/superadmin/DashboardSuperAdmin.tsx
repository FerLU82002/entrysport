import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, UserPlus, Users } from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { localesService } from '../../services/locales.service';
import { Local } from '../../types';

export const DashboardSuperAdmin = () => {
  const [locales, setLocales] = useState<Local[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localesService
      .getAllAdmin()
      .then((res) => setLocales(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const activos = locales.filter((l) => l.estado === 'activo').length;
  const totalCanchas = locales.reduce((acc, l) => acc + (l.canchas?.length || 0), 0);
  const totalAdmins = locales.reduce((acc, l) => acc + (l.administradores?.length || 0), 0);

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <main className="p-6 max-w-6xl">
            <h1 className="text-xl font-semibold text-ink-900 mb-6">Panel general</h1>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" text="Cargando datos..." />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="card">
                    <p className="text-sm text-ink-500 font-medium">Locales registrados</p>
                    <p className="text-2xl font-semibold text-ink-900 mt-1">{locales.length}</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-ink-500 font-medium">Locales activos</p>
                    <p className="text-2xl font-semibold text-ink-900 mt-1">{activos}</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-ink-500 font-medium">Espacios deportivos</p>
                    <p className="text-2xl font-semibold text-ink-900 mt-1">{totalCanchas}</p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-ink-500 font-medium">Administradores de local</p>
                    <p className="text-2xl font-semibold text-ink-900 mt-1">{totalAdmins}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link to="/superadmin/locales" className="card hover:border-ink-300 transition-colors flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-md bg-ink-100 text-ink-500 shrink-0">
                      <Building2 size={18} strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="font-medium text-ink-800 text-sm">Ver locales</p>
                      <p className="text-xs text-ink-400">Gestiona todos los complejos deportivos</p>
                    </div>
                  </Link>
                  <Link to="/superadmin/crear-admin" className="card hover:border-ink-300 transition-colors flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-md bg-ink-100 text-ink-500 shrink-0">
                      <UserPlus size={18} strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="font-medium text-ink-800 text-sm">Crear cuenta de admin</p>
                      <p className="text-xs text-ink-400">Da acceso a un nuevo dueño de cancha</p>
                    </div>
                  </Link>
                  <Link to="/superadmin/usuarios" className="card hover:border-ink-300 transition-colors flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-md bg-ink-100 text-ink-500 shrink-0">
                      <Users size={18} strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="font-medium text-ink-800 text-sm">Ver usuarios</p>
                      <p className="text-xs text-ink-400">Lista de todos los usuarios registrados</p>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
