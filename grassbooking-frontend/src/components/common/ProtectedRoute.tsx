import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';
import { RolUsuario } from '../../types';

interface Props {
  roles: RolUsuario[];
}

const rutaInicioPorRol = (rol?: RolUsuario) => {
  if (rol === 'super_admin') return '/superadmin';
  if (rol === 'admin_local') return '/admin';
  return '/dashboard';
};

export const ProtectedRoute = ({ roles }: Props) => {
  const { isAuthenticated, isLoading, usuario } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!usuario || !roles.includes(usuario.rol)) {
    return <Navigate to={rutaInicioPorRol(usuario?.rol)} replace />;
  }

  return <Outlet />;
};
