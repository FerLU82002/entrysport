import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Check, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usuariosService } from '../../services/usuarios.service';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  longitud: z.number().min(8).max(20),
  duracionDias: z.number().min(1).max(30),
});

type FormData = z.infer<typeof schema>;

export const CrearAdminLocalPage = () => {
  const [error, setError] = useState('');
  const [creado, setCreado] = useState<{ nombre: string; email: string; passwordTemporal: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { longitud: 12, duracionDias: 7 },
  });

  const copiarPassword = () => {
    if (!creado) return;
    navigator.clipboard.writeText(creado.passwordTemporal);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const onSubmit = async (data: FormData) => {
    setError('');
    setCreado(null);
    try {
      const res = await usuariosService.crearAdminLocal({
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        longitud: data.longitud,
        duracionDias: data.duracionDias,
      });
      setCreado({
        nombre: res.data.nombre,
        email: res.data.email,
        passwordTemporal: (res.data as any).passwordTemporal,
      });
      reset({ longitud: 12, duracionDias: 7 });
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
              Se generará automáticamente una contraseña temporal que el administrador deberá cambiar al ingresar.
            </p>

            {creado && (
              <div className="bg-brand-50 border border-brand-200 rounded-md p-4 mb-5">
                <p className="text-sm font-medium text-brand-800 mb-1">
                  Cuenta creada para <strong>{creado.nombre}</strong> ({creado.email})
                </p>
                <p className="text-xs text-brand-700 mb-3">
                  Comparte esta contraseña temporal de forma segura. Solo se muestra una vez.
                </p>
                <div className="flex items-center gap-2 bg-white border border-brand-200 rounded-md px-3 py-2">
                  <span className="font-mono text-sm text-ink-900 flex-1 tracking-wider">
                    {creado.passwordTemporal}
                  </span>
                  <button
                    type="button"
                    onClick={copiarPassword}
                    className="text-brand-600 hover:text-brand-800 transition-colors"
                    title="Copiar contraseña"
                  >
                    {copiado ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCreado(null)}
                  className="mt-3 text-xs text-brand-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Crear otra cuenta
                </button>
              </div>
            )}

            {!creado && (
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">
                      Longitud contraseña
                    </label>
                    <input
                      {...register('longitud', { valueAsNumber: true })}
                      type="number"
                      min={8}
                      max={20}
                      className="input-field"
                      placeholder="12"
                    />
                    <p className="text-xs text-ink-400 mt-1">Entre 8 y 20 caracteres</p>
                    {errors.longitud && <p className="text-red-600 text-xs mt-1">{errors.longitud.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">
                      Validez (días)
                    </label>
                    <input
                      {...register('duracionDias', { valueAsNumber: true })}
                      type="number"
                      min={1}
                      max={30}
                      className="input-field"
                      placeholder="7"
                    />
                    <p className="text-xs text-ink-400 mt-1">Entre 1 y 30 días</p>
                    {errors.duracionDias && <p className="text-red-600 text-xs mt-1">{errors.duracionDias.message}</p>}
                  </div>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Creando...</span>
                  ) : 'Crear cuenta y generar contraseña'}
                </button>
              </form>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
