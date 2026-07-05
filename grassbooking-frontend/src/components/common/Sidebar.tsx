import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const adminLinks: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/reservas', label: 'Reservas', icon: '📅' },
  { to: '/admin/canchas', label: 'Canchas', icon: '⚽' },
  { to: '/admin/horarios', label: 'Horarios', icon: '🕐' },
  { to: '/admin/reportes', label: 'Reportes', icon: '📈' },
  { to: '/admin/excepciones', label: 'Fechas especiales', icon: '🚫' },
];

export const Sidebar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} h-screen shrink-0 bg-gray-900 text-white flex flex-col transition-all duration-300`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && (
          <div>
            <p className="font-bold text-green-400">GrassBooking</p>
            <p className="text-xs text-gray-400">Panel Admin</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-1 py-4">
        {adminLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-lg">{link.icon}</span>
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        {!collapsed && (
          <p className="text-xs text-gray-400 mb-2 truncate">{usuario?.nombre}</p>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span>🚪</span>
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  );
};
