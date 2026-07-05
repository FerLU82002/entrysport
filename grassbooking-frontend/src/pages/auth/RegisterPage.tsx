import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al registrarse');
      } else {
        setError('Error inesperado. Intenta de nuevo.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold text-gray-800">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">GrassBooking - Grass Bambino</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-center p-4 rounded-lg">
            <p className="font-medium">¡Cuenta creada exitosamente!</p>
            <p className="text-sm mt-1">Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input {...register('nombre')} placeholder="Juan Pérez" className="input-field" />
              {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register('email')} type="email" placeholder="tu@email.com" className="input-field" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
              <input {...register('telefono')} placeholder="987654321" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input {...register('password')} type="password" placeholder="••••••••" className="input-field" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input {...register('confirmPassword')} type="password" placeholder="••••••••" className="input-field" />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-3">
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

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-green-600 font-medium hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
};
