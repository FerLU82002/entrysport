import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import api from '../../services/api';

export const CognitoCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Inicio de sesión cancelado');
      return;
    }

    if (!code) {
      setError('No se recibió código de autorización');
      return;
    }

    api.post('/auth/cognito/exchange', { code })
      .then((res) => {
        const { token, usuario } = res.data.data;
        localStorage.setItem('chocolaterospe_token', token);
        localStorage.setItem('chocolaterospe_user', JSON.stringify(usuario));

        if (usuario.rol === 'super_admin') window.location.href = '/superadmin';
        else if (usuario.rol === 'admin_local') window.location.href = '/admin';
        else window.location.href = '/dashboard';
      })
      .catch(() => {
        setError('Error al iniciar sesión con Cognito. Intenta de nuevo.');
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/login" className="text-ink-900 font-medium hover:underline text-sm">
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center">
      <LoadingSpinner text="Iniciando sesión..." />
    </div>
  );
};
