import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usuariosService } from '../../services/usuarios.service';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener mayúscula, minúscula y número'),
});

type FormData = z.infer<typeof schema>;

export const CrearAdminLocalPage = () => {
  const [error, setError] = useState('');
  const [creado, setCreado] = useState<{ nombre: string; email: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await usuariosService.crearAdminLocal(data);
      setCreado({ nombre: res.data.nombre, email: res.data.email });
      reset();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Error al crear la cuenta' : 'Error inesperado');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <main className="p-6 max-w-lg">
            <h1 className="text-xl font-semibold text-ink-900 mb-1">Crear cuenta de administrador de local</h1>
            <p className="text-sm text-ink-500 mb-6">
              Esta cuenta le permitirá al dueño registrar su local, sus espacios deportivos y configurar sus pagos.
            </p>

            {creado && (
              <div className="bg-brand-50 border border-brand-200 text-brand-800 px-4 py-3 rounded-md mb-4 text-sm">
                Cuenta creada para <strong>{creado.nombre}</strong> ({creado.email}). Comparte las credenciales con el dueño del local de forma segura.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre completo</label>
                <input {...register('nombre')} className="input-field" placeholder="Carlos Dueño" />
                {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
                <input {...register('email')} type="email" className="input-field" placeholder="dueno@canchaejemplo.com" />
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Teléfono (opcional)</label>
                <input {...register('telefono')} className="input-field" placeholder="987654321" />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Contraseña temporal</label>
                <input {...register('password')} type="password" className="input-field" placeholder="••••••••" />
                {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Creando...</span>
                ) : 'Crear cuenta'}
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
};
