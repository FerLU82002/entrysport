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

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [error, setError] = useState('');

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
            G
          </span>
          <h1 className="text-xl font-semibold text-ink-900">Inicia sesión</h1>
          <p className="text-ink-500 text-sm mt-1">Entra a tu cuenta de GrassBooking</p>
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

          <p className="text-center text-sm text-ink-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" state={from ? { from } : undefined} className="text-ink-900 font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </div>

        <div className="mt-4 p-3.5 rounded-md border border-ink-100 bg-white text-xs text-ink-500 space-y-0.5">
          <p className="font-medium text-ink-700 mb-1">Cuentas de prueba</p>
          <p>Super admin — superadmin@grassbooking.com / SuperAdmin123!</p>
          <p>Admin de local — admin@grassbambino.com / AdminLocal123!</p>
          <p>Demo — usuario@demo.com / Demo123!</p>
        </div>
      </div>
    </div>
  );
};
