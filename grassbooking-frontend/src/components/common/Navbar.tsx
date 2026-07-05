import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { ApiResponse, Notificacion } from '../../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const TIPO_ICONO: Record<string, string> = {
  confirmacion: '✅',
  cancelacion: '❌',
  recordatorio: '🔔',
  modificacion: '✏️',
};

export const Navbar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const cargarNotificaciones = () => {
    if (!usuario || usuario.rol === 'admin') return;
    api
      .get<ApiResponse<Notificacion[]>>('/notificaciones')
      .then((res) => setNotificaciones(res.data.data))
      .catch(() => {});
  };

  useEffect(() => {
    cargarNotificaciones();
  }, [usuario]);

  // Cerrar dropdown al hacer clic fuera
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
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
      );
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

  const isAdmin = usuario?.rol === 'admin';
  const basePath = isAdmin ? '/admin' : '/dashboard';

  return (
    <nav className="bg-green-700 text-white shadow-lg shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={basePath} className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">⚽</span>
            <span>GrassBooking</span>
          </Link>

          {/* Menú escritorio */}
          <div className="hidden md:flex items-center gap-6">
            {isAdmin ? (
              <>
                <Link to="/admin" className="hover:text-green-200 transition-colors text-sm font-medium">Dashboard</Link>
                <Link to="/admin/reservas" className="hover:text-green-200 transition-colors text-sm font-medium">Reservas</Link>
                <Link to="/admin/canchas" className="hover:text-green-200 transition-colors text-sm font-medium">Canchas</Link>
                <Link to="/admin/reportes" className="hover:text-green-200 transition-colors text-sm font-medium">Reportes</Link>
              </>
            ) : (
              <>
                <Link to="/canchas" className="hover:text-green-200 transition-colors text-sm font-medium">Canchas</Link>
                <Link to="/mis-reservas" className="hover:text-green-200 transition-colors text-sm font-medium">Mis Reservas</Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Campana de notificaciones — solo para usuarios */}
            {!isAdmin && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) cargarNotificaciones(); }}
                  className="relative p-2 rounded-lg hover:bg-green-800 transition-colors"
                  title="Notificaciones"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {noLeidas > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {noLeidas > 9 ? '9+' : noLeidas}
                    </span>
                  )}
                </button>

                {/* Dropdown de notificaciones */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800 text-sm">Notificaciones</h3>
                      {noLeidas > 0 && (
                        <button
                          onClick={marcarTodasLeidas}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Marcar todas como leídas
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notificaciones.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">
                          <p className="text-2xl mb-1">🔔</p>
                          <p>Sin notificaciones</p>
                        </div>
                      ) : (
                        notificaciones.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => !notif.leida && marcarLeida(notif.id)}
                            className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                              !notif.leida ? 'bg-green-50' : ''
                            }`}
                          >
                            <span className="text-lg flex-shrink-0 mt-0.5">
                              {TIPO_ICONO[notif.tipo] ?? '🔔'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-relaxed ${notif.leida ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                                {notif.mensaje}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(parseISO(notif.createdAt), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </p>
                            </div>
                            {!notif.leida && (
                              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <span className="text-sm text-green-200">{usuario?.nombre}</span>
            <button
              onClick={handleLogout}
              className="bg-green-800 hover:bg-green-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Salir
            </button>
          </div>

          {/* Botón hamburguesa (móvil) */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-green-800"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
            {noLeidas > 0 && !isAdmin && (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500" />
            )}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="md:hidden bg-green-800 px-4 pb-4 space-y-2">
          {isAdmin ? (
            <>
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-green-200">Dashboard</Link>
              <Link to="/admin/reservas" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-green-200">Reservas</Link>
              <Link to="/admin/canchas" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-green-200">Canchas</Link>
              <Link to="/admin/reportes" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-green-200">Reportes</Link>
            </>
          ) : (
            <>
              <Link to="/canchas" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-green-200">Canchas</Link>
              <Link to="/mis-reservas" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-green-200">Mis Reservas</Link>
              {notificaciones.length > 0 && (
                <div className="pt-2 border-t border-green-700">
                  <p className="text-xs text-green-300 mb-2">
                    Notificaciones {noLeidas > 0 && `(${noLeidas} sin leer)`}
                  </p>
                  {notificaciones.slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { marcarLeida(n.id); setMenuOpen(false); }}
                      className={`text-xs py-1.5 flex gap-2 ${n.leida ? 'text-green-300' : 'text-white font-medium'}`}
                    >
                      <span>{TIPO_ICONO[n.tipo] ?? '🔔'}</span>
                      <span className="line-clamp-2">{n.mensaje}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="pt-2 border-t border-green-700">
            <p className="text-green-300 text-sm">{usuario?.nombre}</p>
            <button onClick={handleLogout} className="mt-2 text-sm text-red-300 hover:text-red-200">
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
