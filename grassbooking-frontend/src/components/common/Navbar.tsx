import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { ApiResponse, Notificacion } from '../../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const Navbar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const cargarNotificaciones = () => {
    if (!usuario || usuario.rol !== 'usuario') return;
    api
      .get<ApiResponse<Notificacion[]>>('/notificaciones')
      .then((res) => setNotificaciones(res.data.data))
      .catch(() => {});
  };

  useEffect(() => {
    cargarNotificaciones();
  }, [usuario]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const marcarLeida = async (id: number) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`);
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    } catch {}
  };

  const marcarTodasLeidas = async () => {
    const noLeidasList = notificaciones.filter((n) => !n.leida);
    await Promise.all(noLeidasList.map((n) => api.patch(`/notificaciones/${n.id}/leer`).catch(() => {})));
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdminLocal = usuario?.rol === 'admin_local';
  const isSuperAdmin = usuario?.rol === 'super_admin';
  const isUsuario = usuario?.rol === 'usuario';
  const estaAutenticado = !!usuario;
  const basePath = isSuperAdmin ? '/superadmin' : isAdminLocal ? '/admin' : estaAutenticado ? '/dashboard' : '/locales';

  const enlaces = isSuperAdmin
    ? [
        { to: '/superadmin', label: 'Dashboard' },
        { to: '/superadmin/locales', label: 'Locales' },
        { to: '/superadmin/crear-admin', label: 'Crear admin' },
      ]
    : isAdminLocal
    ? [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/mi-local', label: 'Mi local' },
        { to: '/admin/reservas', label: 'Reservas' },
        { to: '/admin/canchas', label: 'Espacios' },
        { to: '/admin/reportes', label: 'Reportes' },
      ]
    : [
        { to: '/locales', label: 'Locales' },
        { to: '/canchas', label: 'Canchas' },
        ...(isUsuario ? [{ to: '/mis-reservas', label: 'Mis reservas' }] : []),
      ];

  return (
    <nav className="bg-white border-b border-ink-100 shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={basePath} className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-ink-900 text-white text-sm font-semibold">
              C
            </span>
            <span className="font-semibold text-ink-900 tracking-tight">Chocolaterospe</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {enlaces.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 rounded-md text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isUsuario && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) cargarNotificaciones(); }}
                  className="relative p-2 rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-50 transition-colors"
                  title="Notificaciones"
                >
                  <Bell size={18} strokeWidth={1.75} />
                  {noLeidas > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-ink-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
                      <h3 className="font-medium text-ink-900 text-sm">Notificaciones</h3>
                      {noLeidas > 0 && (
                        <button
                          onClick={marcarTodasLeidas}
                          className="text-xs text-ink-500 hover:text-ink-900 font-medium"
                        >
                          Marcar todas leídas
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notificaciones.length === 0 ? (
                        <div className="py-10 text-center text-ink-400 text-sm">
                          Sin notificaciones
                        </div>
                      ) : (
                        notificaciones.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => !notif.leida && marcarLeida(notif.id)}
                            className={`flex gap-3 px-4 py-3 border-b border-ink-50 cursor-pointer hover:bg-ink-50 transition-colors ${
                              !notif.leida ? 'bg-brand-50/40' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-relaxed ${notif.leida ? 'text-ink-500' : 'text-ink-900 font-medium'}`}>
                                {notif.mensaje}
                              </p>
                              <p className="text-xs text-ink-400 mt-1">
                                {formatDistanceToNow(parseISO(notif.createdAt), { addSuffix: true, locale: es })}
                              </p>
                            </div>
                            {!notif.leida && (
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {estaAutenticado ? (
              <div className="flex items-center gap-3 pl-2">
                <span className="text-sm text-ink-500">{usuario?.nombre}</span>
                <button
                  onClick={handleLogout}
                  className="btn-ghost flex items-center gap-1.5"
                >
                  <LogOut size={15} strokeWidth={1.75} />
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2">
                <Link to="/login" className="btn-ghost">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="btn-primary">
                  Regístrate
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-md text-ink-600 hover:bg-ink-50"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
            {noLeidas > 0 && isUsuario && !menuOpen && (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-ink-100 px-4 pb-4 space-y-1">
          {enlaces.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm text-ink-700 hover:text-ink-900"
            >
              {link.label}
            </Link>
          ))}

          {isUsuario && notificaciones.length > 0 && (
            <div className="pt-2 border-t border-ink-100">
              <p className="text-xs text-ink-400 mb-2 mt-2">
                Notificaciones {noLeidas > 0 && `(${noLeidas} sin leer)`}
              </p>
              {notificaciones.slice(0, 3).map((n) => (
                <div
                  key={n.id}
                  onClick={() => { marcarLeida(n.id); setMenuOpen(false); }}
                  className={`text-xs py-1.5 ${n.leida ? 'text-ink-400' : 'text-ink-900 font-medium'}`}
                >
                  {n.mensaje}
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-ink-100">
            {estaAutenticado ? (
              <div className="flex items-center justify-between">
                <p className="text-ink-500 text-sm">{usuario?.nombre}</p>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-red-600">
                  <LogOut size={15} strokeWidth={1.75} />
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-ink-900">
                  Iniciar sesión
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-brand-700">
                  Regístrate
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
