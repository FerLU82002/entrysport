import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { CognitoCallbackPage } from '../pages/auth/CognitoCallbackPage';
import { CambiarPasswordPage } from '../pages/auth/CambiarPasswordPage';
import { GitHubCallbackPage } from '../pages/auth/GitHubCallbackPage';

import { DashboardUsuario } from '../pages/usuario/DashboardUsuario';
import { CanchasPage } from '../pages/usuario/CanchasPage';
import { LocalesPage } from '../pages/usuario/LocalesPage';
import { LocalDetallePage } from '../pages/usuario/LocalDetallePage';
import { ReservaPage } from '../pages/usuario/ReservaPage';
import { MisReservasPage } from '../pages/usuario/MisReservasPage';

import { DashboardAdmin } from '../pages/admin/DashboardAdmin';
import { MiLocalPage } from '../pages/admin/MiLocalPage';
import { GestionCanchasPage } from '../pages/admin/GestionCanchasPage';
import { HorariosPage } from '../pages/admin/HorariosPage';
import { ReservasAdminPage } from '../pages/admin/ReservasAdminPage';
import { ReportesPage } from '../pages/admin/ReportesPage';
import { ExcepcionesPage } from '../pages/admin/ExcepcionesPage';
import { MarketingPage } from '../pages/admin/MarketingPage';

import { DashboardSuperAdmin } from '../pages/superadmin/DashboardSuperAdmin';
import { LocalesAdminPage } from '../pages/superadmin/LocalesAdminPage';
import { CrearAdminLocalPage } from '../pages/superadmin/CrearAdminLocalPage';
import { UsuariosAdminPage } from '../pages/superadmin/UsuariosAdminPage';

const rutaInicioPorRol = (rol?: string) => {
  if (rol === 'super_admin') return '/superadmin';
  if (rol === 'admin_local') return '/admin';
  return '/dashboard';
};

export const AppRouter = () => {
  const { isLoading, isAuthenticated, usuario } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={rutaInicioPorRol(usuario?.rol)} /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
      />
      <Route path="/callback" element={<CognitoCallbackPage />} />
      <Route path="/cambiar-password" element={<CambiarPasswordPage />} />
      <Route path="/github-callback" element={<GitHubCallbackPage />} />

      {/* Explorar locales y canchas, y ver disponibilidad, es público — como en Joinnus.
          Solo se pide cuenta al confirmar la reserva (ver ConfirmacionReserva). */}
      <Route path="/locales" element={<LocalesPage />} />
      <Route path="/locales/:id" element={<LocalDetallePage />} />
      <Route path="/canchas" element={<CanchasPage />} />
      <Route path="/reservar/:idCancha" element={<ReservaPage />} />

      <Route element={<ProtectedRoute roles={['usuario']} />}>
        <Route path="/dashboard" element={<DashboardUsuario />} />
        <Route path="/mis-reservas" element={<MisReservasPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['admin_local']} />}>
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/mi-local" element={<MiLocalPage />} />
        <Route path="/admin/canchas" element={<GestionCanchasPage />} />
        <Route path="/admin/horarios" element={<HorariosPage />} />
        <Route path="/admin/reservas" element={<ReservasAdminPage />} />
        <Route path="/admin/reportes" element={<ReportesPage />} />
        <Route path="/admin/excepciones" element={<ExcepcionesPage />} />
        <Route path="/admin/marketing" element={<MarketingPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['super_admin']} />}>
        <Route path="/superadmin" element={<DashboardSuperAdmin />} />
        <Route path="/superadmin/locales" element={<LocalesAdminPage />} />
        <Route path="/superadmin/crear-admin" element={<CrearAdminLocalPage />} />
        <Route path="/superadmin/usuarios" element={<UsuariosAdminPage />} />
      </Route>

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={rutaInicioPorRol(usuario?.rol)} />
          ) : (
            <Navigate to="/locales" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
