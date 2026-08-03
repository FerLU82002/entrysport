import { useRef, useState } from 'react';
import axios from 'axios';
import { X, Camera } from 'lucide-react';
import { uploadsService } from '../../services/uploads.service';
import { urlImagen } from '../../utils/media';
import { LoadingSpinner } from './LoadingSpinner';

const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;
const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp'];

interface Props {
  fotos: string[];
  onChange: (fotos: string[]) => void;
  maxFotos?: number;
  label?: string;
}

export const SubidaFotos = ({ fotos, onChange, maxFotos = 8, label = 'Fotos' }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  const handleSeleccion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files || []);
    e.target.value = ''; // permite volver a elegir el mismo archivo si se removió
    if (archivos.length === 0) return;

    setError('');

    const espacioDisponible = maxFotos - fotos.length;
    if (espacioDisponible <= 0) {
      setError(`Ya tienes el máximo de ${maxFotos} fotos.`);
      return;
    }

    const aSubir = archivos.slice(0, espacioDisponible);

    for (const archivo of aSubir) {
      if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
        setError(`"${archivo.name}" no es JPG, PNG o WEBP.`);
        continue;
      }
      if (archivo.size > TAMANO_MAXIMO_BYTES) {
        setError(`"${archivo.name}" pesa más de 5MB.`);
        continue;
      }

      setSubiendo(true);
      try {
        const res = await uploadsService.subirImagen(archivo);
        onChange([...fotos, res.data.url]);
      } catch (err) {
        setError(
          axios.isAxiosError(err) ? err.response?.data?.message || 'Error al subir la imagen' : 'Error inesperado',
        );
      } finally {
        setSubiendo(false);
      }
    }
  };

  const quitarFoto = (index: number) => {
    onChange(fotos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">
        {label} <span className="text-ink-400 font-normal">({fotos.length}/{maxFotos})</span>
      </label>

      {fotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {fotos.map((foto, index) => (
            <div key={foto + index} className="relative group aspect-square">
              <img
                src={urlImagen(foto)}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-md border border-ink-200"
              />
              <button
                type="button"
                onClick={() => quitarFoto(index)}
                className="absolute -top-1.5 -right-1.5 bg-ink-900 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Quitar foto"
              >
                <X size={11} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {fotos.length < maxFotos && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          {subiendo ? (
            <>
              <LoadingSpinner size="sm" /> Subiendo...
            </>
          ) : (
            <>
              <Camera size={15} strokeWidth={1.75} /> Agregar fotos
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleSeleccion}
      />

      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
};
