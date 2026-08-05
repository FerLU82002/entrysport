import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import axios from 'axios';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type FormData = z.infer<typeof schema>;

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const COGNITO_REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI;

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [error, setError] = useState('');

  const loginConCognito = () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: COGNITO_CLIENT_ID,
      redirect_uri: COGNITO_REDIRECT_URI,
      scope: 'openid email profile',
    });
    window.location.href = `https://${COGNITO_DOMAIN}/login?${params}`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await login(data);
      navigate(from || '/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al iniciar sesión');
      } else {
        setError('Error inesperado. Intenta de nuevo.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-ink-900 text-white text-base font-semibold mb-4">
            C
          </span>
          <h1 className="text-xl font-semibold text-ink-900">Inicia sesión</h1>
          <p className="text-ink-500 text-sm mt-1">Entra a tu cuenta de Chocolaterospe</p>
        </div>

        <div className="bg-white rounded-lg border border-ink-100 shadow-card p-7">
          {from && (
            <div className="bg-brand-50 border border-brand-200 text-brand-800 text-sm px-3 py-2.5 rounded-md mb-5">
              Inicia sesión para completar tu reserva — tu horario elegido te espera.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <input {...register('email')} type="email" placeholder="tu@email.com" className="input-field" />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Contraseña</label>
              <input {...register('password')} type="password" placeholder="••••••••" className="input-field" />
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-md">
                {error}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-2.5">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" /> Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-ink-400">o continúa con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={loginConCognito}
            className="w-full flex items-center justify-center gap-2 border border-ink-200 rounded-md py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor"/>
            </svg>
            Continuar con AWS Cognito
          </button>

          <p className="text-center text-sm text-ink-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" state={from ? { from } : undefined} className="text-ink-900 font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
