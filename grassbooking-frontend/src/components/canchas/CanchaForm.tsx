import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cancha } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  tipoSuperficie: z.string().optional(),
  precioHora: z.number().min(0, 'El precio debe ser positivo'),
  estado: z.enum(['activa', 'inactiva']),
  descripcion: z.string().optional(),
  imagenUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  cancha?: Cancha;
  onSubmit: (data: Partial<Cancha>) => Promise<void>;
  onCancelar: () => void;
  isLoading?: boolean;
}

export const CanchaForm = ({ cancha, onSubmit, onCancelar, isLoading }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      tipoSuperficie: 'Césped sintético',
      precioHora: 50,
      estado: 'activa',
      descripcion: '',
      imagenUrl: '',
    },
  });

  useEffect(() => {
    if (cancha) {
      reset({
        nombre: cancha.nombre,
        tipoSuperficie: cancha.tipoSuperficie,
        precioHora: Number(cancha.precioHora),
        estado: cancha.estado,
        descripcion: cancha.descripcion || '',
        imagenUrl: cancha.imagenUrl || '',
      });
    }
  }, [cancha, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input {...register('nombre')} className="input-field" placeholder="Cancha principal" />
        {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de superficie</label>
          <input {...register('tipoSuperficie')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio/hora (S/)</label>
          <input
            {...register('precioHora', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="input-field"
          />
          {errors.precioHora && <p className="text-red-500 text-xs mt-1">{errors.precioHora.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select {...register('estado')} className="input-field">
          <option value="activa">Activa</option>
          <option value="inactiva">Inactiva</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          {...register('descripcion')}
          rows={3}
          className="input-field resize-none"
          placeholder="Describe la cancha..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen (opcional)</label>
        <input {...register('imagenUrl')} className="input-field" placeholder="https://..." />
        {errors.imagenUrl && <p className="text-red-500 text-xs mt-1">{errors.imagenUrl.message}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isLoading} className="flex-1 btn-primary">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" /> Guardando...
            </span>
          ) : cancha ? (
            'Actualizar cancha'
          ) : (
            'Crear cancha'
          )}
        </button>
        <button type="button" onClick={onCancelar} className="flex-1 btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
};
