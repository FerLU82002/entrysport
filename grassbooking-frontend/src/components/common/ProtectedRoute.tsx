import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface Props {
  rol: 'usuario' | 'admin';
}

export const ProtectedRoute = ({ rol }: Props) => {
  const { isAuthenticated, isLoading, usuario } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (rol === 'admin' && usuario?.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (rol === 'usuario' && usuario?.rol === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};
