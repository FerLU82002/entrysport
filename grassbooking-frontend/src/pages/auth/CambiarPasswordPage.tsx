import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import axios from 'axios';

const schema = z.object({
  passwordActual: z.string().min(1, 'Requerido'),
  passwordNueva: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe tener mayúscula, minúscula y número'),
  confirmar: z.string(),
}).refine((d) => d.passwordNueva === d.confirmar, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar'],
});

type FormData = z.infer<typeof schema>;

export const CambiarPasswordPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await api.post('/auth/cambiar-password', {
        passwordActual: data.passwordActual,
        passwordNueva: data.passwordNueva,
      });

      // Actualizar mustChangePassword en localStorage si existe
      const raw = localStorage.getItem('chocolaterospe_user');
      if (raw) {
        const user = JSON.parse(raw);
        localStorage.setItem('chocolaterospe_user', JSON.stringify({ ...user, mustChangePassword: false }));
      }

      navigate('/admin');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al cambiar contraseña');
      } else {
        setError('Error inesperado. Intenta de nuevo.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-ink-900 text-white mb-4">
            <ShieldCheck size={18} />
          </span>
          <h1 className="text-xl font-semibold text-ink-900">Cambia tu contraseña</h1>
          <p className="text-ink-500 text-sm mt-1">
            Tu contraseña es temporal. Debes establecer una nueva para continuar.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-ink-100 shadow-card p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Contraseña temporal actual</label>
              <input {...register('passwordActual')} type="password" placeholder="••••••••" className="input-field" />
              {errors.passwordActual && <p className="text-red-600 text-xs mt-1">{errors.passwordActual.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Nueva contraseña</label>
              <input {...register('passwordNueva')} type="password" placeholder="••••••••" className="input-field" />
              {errors.passwordNueva && <p className="text-red-600 text-xs mt-1">{errors.passwordNueva.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Confirmar nueva contraseña</label>
              <input {...register('confirmar')} type="password" placeholder="••••••••" className="input-field" />
              {errors.confirmar && <p className="text-red-600 text-xs mt-1">{errors.confirmar.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-md">
                {error}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-2.5">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" /> Actualizando...
                </span>
              ) : 'Establecer nueva contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
