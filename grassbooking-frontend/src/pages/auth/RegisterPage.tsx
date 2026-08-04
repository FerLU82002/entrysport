import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import axios from 'axios';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  telefono: z.string().max(15).optional(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe tener mayúscula, minúscula y número'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await registerUser({
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        password: data.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login', { state: from ? { from } : undefined }), 2000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al registrarse');
      } else {
        setError('Error inesperado. Intenta de nuevo.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-ink-900 text-white text-base font-semibold mb-4">
            C
          </span>
          <h1 className="text-xl font-semibold text-ink-900">Crea tu cuenta</h1>
          <p className="text-ink-500 text-sm mt-1">Únete a Chocolaterospe</p>
        </div>

        <div className="bg-white rounded-lg border border-ink-100 shadow-card p-7">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="mx-auto text-brand-600 mb-3" size={32} strokeWidth={1.5} />
              <p className="font-medium text-ink-900">Cuenta creada exitosamente</p>
              <p className="text-sm text-ink-500 mt-1">Redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre completo</label>
                <input {...register('nombre')} placeholder="Juan Pérez" className="input-field" />
                {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
                <input {...register('email')} type="email" placeholder="tu@email.com" className="input-field" />
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Teléfono (opcional)</label>
                <input {...register('telefono')} placeholder="987654321" className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Contraseña</label>
                <input {...register('password')} type="password" placeholder="••••••••" className="input-field" />
                {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Confirmar contraseña</label>
                <input {...register('confirmPassword')} type="password" placeholder="••••••••" className="input-field" />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-md">
                  {error}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-2.5">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" /> Registrando...
                  </span>
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </form>
          )}

          {!success && (
            <p className="text-center text-sm text-ink-500 mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" state={from ? { from } : undefined} className="text-ink-900 font-medium hover:underline">
                Iniciar sesión
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
