import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usuariosService } from '../../services/usuarios.service';
import { Usuario } from '../../types';

const rolLabel: Record<string, { label: string; className: string }> = {
  super_admin: { label: 'Super Admin', className: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200' },
  admin_local: { label: 'Admin Local', className: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200' },
  usuario: { label: 'Usuario', className: 'bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200' },
};

export const UsuariosAdminPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    usuariosService
      .getAll()
      .then((res) => setUsuarios(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const filtrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <main className="p-6 max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-ink-900">Usuarios registrados</h1>
              <span className="text-sm text-ink-400">{usuarios.length} total</span>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-field max-w-sm"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" text="Cargando usuarios..." />
              </div>
            ) : filtrados.length === 0 ? (
              <div className="card text-center py-12 text-ink-400">
                <Users className="mx-auto mb-3" size={28} strokeWidth={1.5} />
                <p className="text-sm">No se encontraron usuarios</p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 border-b border-ink-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-ink-600">Nombre</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-600">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-600">Teléfono</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-600">Rol</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-600">Registrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {filtrados.map((u) => {
                      const rol = rolLabel[u.rol] ?? { label: u.rol, className: 'bg-ink-100 text-ink-600' };
                      return (
                        <tr key={u.id} className="hover:bg-ink-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-ink-900">{u.nombre}</td>
                          <td className="px-4 py-3 text-ink-600">{u.email}</td>
                          <td className="px-4 py-3 text-ink-500">{u.telefono || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${rol.className}`}>{rol.label}</span>
                          </td>
                          <td className="px-4 py-3 text-ink-400">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString('es-PE', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
