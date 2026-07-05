import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

import { DashboardUsuario } from '../pages/usuario/DashboardUsuario';
import { CanchasPage } from '../pages/usuario/CanchasPage';
import { ReservaPage } from '../pages/usuario/ReservaPage';
import { MisReservasPage } from '../pages/usuario/MisReservasPage';

import { DashboardAdmin } from '../pages/admin/DashboardAdmin';
import { GestionCanchasPage } from '../pages/admin/GestionCanchasPage';
import { HorariosPage } from '../pages/admin/HorariosPage';
import { ReservasAdminPage } from '../pages/admin/ReservasAdminPage';
import { ReportesPage } from '../pages/admin/ReportesPage';
import { ExcepcionesPage } from '../pages/admin/ExcepcionesPage';

export const AppRouter = () => {
  const { isLoading, isAuthenticated, usuario } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={usuario?.rol === 'admin' ? '/admin' : '/dashboard'} /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
      />

      <Route element={<ProtectedRoute rol="usuario" />}>
        <Route path="/dashboard" element={<DashboardUsuario />} />
        <Route path="/canchas" element={<CanchasPage />} />
        <Route path="/reservar/:idCancha" element={<ReservaPage />} />
        <Route path="/mis-reservas" element={<MisReservasPage />} />
      </Route>

      <Route element={<ProtectedRoute rol="admin" />}>
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/canchas" element={<GestionCanchasPage />} />
        <Route path="/admin/horarios" element={<HorariosPage />} />
        <Route path="/admin/reservas" element={<ReservasAdminPage />} />
        <Route path="/admin/reportes" element={<ReportesPage />} />
        <Route path="/admin/excepciones" element={<ExcepcionesPage />} />
      </Route>

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={usuario?.rol === 'admin' ? '/admin' : '/dashboard'} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
