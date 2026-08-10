import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  LandPlot,
  Clock,
  BarChart3,
  Ban,
  UserPlus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const adminLocalLinks: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/mi-local', label: 'Mi local', icon: Building2 },
  { to: '/admin/reservas', label: 'Reservas', icon: CalendarDays },
  { to: '/admin/canchas', label: 'Espacios deportivos', icon: LandPlot },
  { to: '/admin/horarios', label: 'Horarios', icon: Clock },
  { to: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/admin/excepciones', label: 'Fechas especiales', icon: Ban },
  { to: '/admin/marketing', label: 'Marketing', icon: Megaphone },
];

const superAdminLinks: NavItem[] = [
  { to: '/superadmin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/superadmin/locales', label: 'Locales', icon: Building2 },
  { to: '/superadmin/crear-admin', label: 'Crear admin de local', icon: UserPlus },
];

export const Sidebar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const esSuperAdmin = usuario?.rol === 'super_admin';
  const links = esSuperAdmin ? superAdminLinks : adminLocalLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-60'} h-screen shrink-0 bg-white border-r border-ink-100 flex flex-col transition-all duration-200`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-ink-100">
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-ink-900 text-white text-sm font-semibold shrink-0">
              C
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-ink-900 text-sm truncate">Chocolaterospe</p>
              <p className="text-xs text-ink-400 truncate">{esSuperAdmin ? 'Panel general' : 'Panel de mi local'}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-ink-400 hover:text-ink-900 hover:bg-ink-50 transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            title={collapsed ? link.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-ink-100 text-ink-900'
                  : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
              }`
            }
          >
            <link.icon size={17} strokeWidth={1.75} className="shrink-0" />
            {!collapsed && <span className="truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-ink-100">
        {!collapsed && (
          <p className="text-xs text-ink-400 mb-2 truncate px-1">{usuario?.nombre}</p>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-ink-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut size={17} strokeWidth={1.75} />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  );
};
