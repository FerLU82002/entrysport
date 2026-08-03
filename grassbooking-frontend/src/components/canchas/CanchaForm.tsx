import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cancha } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { SubidaFotos } from '../common/SubidaFotos';

const DEPORTES = ['Fútbol', 'Pádel', 'Vóley', 'Básquet', 'Tenis', 'Otro'];

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  deporte: z.string().min(1, 'Selecciona un deporte'),
  tipoSuperficie: z.string().optional(),
  precioHoraDia: z.number().min(0, 'El precio debe ser positivo'),
  precioHoraNoche: z.number().min(0, 'El precio debe ser positivo'),
  horaInicioNoche: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido'),
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
  const [fotos, setFotos] = useState<string[]>(cancha?.fotos || []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      deporte: 'Fútbol',
      tipoSuperficie: 'Césped sintético',
      precioHoraDia: 50,
      precioHoraNoche: 70,
      horaInicioNoche: '18:00',
      estado: 'activa',
      descripcion: '',
      imagenUrl: '',
    },
  });

  useEffect(() => {
    if (cancha) {
      reset({
        nombre: cancha.nombre,
        deporte: cancha.deporte,
        tipoSuperficie: cancha.tipoSuperficie,
        precioHoraDia: Number(cancha.precioHoraDia),
        precioHoraNoche: Number(cancha.precioHoraNoche),
        horaInicioNoche: cancha.horaInicioNoche.substring(0, 5),
        estado: cancha.estado,
        descripcion: cancha.descripcion || '',
        imagenUrl: cancha.imagenUrl || '',
      });
      setFotos(cancha.fotos || []);
    }
  }, [cancha, reset]);

  return (
    <form onSubmit={handleSubmit((data) => onSubmit({ ...data, fotos }))} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre</label>
        <input {...register('nombre')} className="input-field" placeholder="Cancha 1 - Fútbol 7" />
        {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Deporte</label>
          <select {...register('deporte')} className="input-field">
            {DEPORTES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.deporte && <p className="text-red-600 text-xs mt-1">{errors.deporte.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Tipo de superficie</label>
          <input {...register('tipoSuperficie')} className="input-field" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Precio/hora día (S/)</label>
          <input
            {...register('precioHoraDia', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="input-field"
          />
          {errors.precioHoraDia && <p className="text-red-600 text-xs mt-1">{errors.precioHoraDia.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Precio/hora noche (S/)</label>
          <input
            {...register('precioHoraNoche', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="input-field"
          />
          {errors.precioHoraNoche && <p className="text-red-600 text-xs mt-1">{errors.precioHoraNoche.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Tarifa nocturna desde</label>
          <input {...register('horaInicioNoche')} type="time" className="input-field" />
          {errors.horaInicioNoche && <p className="text-red-600 text-xs mt-1">{errors.horaInicioNoche.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Estado</label>
          <select {...register('estado')} className="input-field">
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">Descripción</label>
        <textarea
          {...register('descripcion')}
          rows={3}
          className="input-field resize-none"
          placeholder="Describe el espacio deportivo..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1.5">URL de imagen de portada (opcional)</label>
        <input {...register('imagenUrl')} className="input-field" placeholder="https://..." />
        {errors.imagenUrl && <p className="text-red-600 text-xs mt-1">{errors.imagenUrl.message}</p>}
        <p className="text-xs text-ink-400 mt-1">Se usa como miniatura en las tarjetas. También puedes solo subir fotos abajo.</p>
      </div>

      <SubidaFotos fotos={fotos} onChange={setFotos} label="Fotos del espacio deportivo" />

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isLoading} className="flex-1 btn-primary">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" /> Guardando...
            </span>
          ) : cancha ? (
            'Actualizar espacio'
          ) : (
            'Crear espacio'
          )}
        </button>
        <button type="button" onClick={onCancelar} className="flex-1 btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
};
