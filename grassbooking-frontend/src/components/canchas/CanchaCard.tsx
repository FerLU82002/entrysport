import { Link } from 'react-router-dom';
import { LandPlot, MapPin } from 'lucide-react';
import { Cancha } from '../../types';
import { urlImagen } from '../../utils/media';

interface Props {
  cancha: Cancha;
  showActions?: boolean;
  onEdit?: (cancha: Cancha) => void;
  onToggleEstado?: (cancha: Cancha) => void;
}

export const CanchaCard = ({ cancha, showActions, onEdit, onToggleEstado }: Props) => {
  const portada = cancha.imagenUrl || cancha.fotos?.[0];
  const descuentoPct = cancha.descuentoPct ?? 0;
  const hayDescuento = descuentoPct > 0;

  const precioDia = Number(cancha.precioHoraDia);
  const precioNoche = Number(cancha.precioHoraNoche);
  const precioDiaDesc = Number((precioDia * (1 - descuentoPct / 100)).toFixed(2));
  const precioNocheDesc = Number((precioNoche * (1 - descuentoPct / 100)).toFixed(2));

  return (
    <div className="bg-white rounded-lg border border-ink-100 shadow-card overflow-hidden hover:border-ink-300 transition-colors">
      <div className="relative">
        {portada ? (
          <img src={urlImagen(portada)} alt={cancha.nombre} className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-36 bg-ink-100 flex items-center justify-center text-ink-300">
            <LandPlot size={26} strokeWidth={1.5} />
          </div>
        )}
        {hayDescuento && (
          <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white shadow">
            -{descuentoPct}% descuento
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-ink-900">{cancha.nombre}</h3>
          <span
            className={`badge shrink-0 ${
              cancha.estado === 'activa'
                ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200'
                : 'bg-ink-100 text-ink-500 ring-1 ring-inset ring-ink-200'
            }`}
          >
            {cancha.estado === 'activa' ? 'Activa' : 'Inactiva'}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs px-2 py-0.5 rounded bg-ink-100 text-ink-600 font-medium">
            {cancha.deporte}
          </span>
          <p className="text-sm text-ink-500">{cancha.tipoSuperficie}</p>
        </div>

        {cancha.local?.nombre && (
          <p className="flex items-center gap-1.5 text-xs text-ink-400 mb-1">
            <MapPin size={12} strokeWidth={1.75} />
            {cancha.local.nombre}
          </p>
        )}

        {cancha.descripcion && (
          <p className="text-xs text-ink-400 mb-3 line-clamp-2">{cancha.descripcion}</p>
        )}

        <div className="mb-4">
          {hayDescuento ? (
            <>
              <p className="text-xs text-ink-400 line-through">
                S/ {precioDia.toFixed(2)} – S/ {precioNoche.toFixed(2)}
                <span className="not-italic"> / hora (día / noche)</span>
              </p>
              <p className="text-ink-900 font-semibold">
                S/ {precioDiaDesc.toFixed(2)} – S/ {precioNocheDesc.toFixed(2)}{' '}
                <span className="text-sm font-normal text-ink-400">/ hora (día / noche)</span>
              </p>
            </>
          ) : (
            <p className="text-ink-900 font-semibold">
              S/ {precioDia.toFixed(2)} – S/ {precioNoche.toFixed(2)}{' '}
              <span className="text-sm font-normal text-ink-400">/ hora (día / noche)</span>
            </p>
          )}
        </div>

        {showActions ? (
          <div className="flex gap-2">
            <button onClick={() => onEdit?.(cancha)} className="flex-1 btn-secondary text-sm">
              Editar
            </button>
            <button
              onClick={() => onToggleEstado?.(cancha)}
              className={`flex-1 text-sm py-2 px-3 rounded-md font-medium transition-colors border ${
                cancha.estado === 'activa'
                  ? 'text-red-600 border-red-200 hover:bg-red-50'
                  : 'text-brand-700 border-brand-200 hover:bg-brand-50'
              }`}
            >
              {cancha.estado === 'activa' ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ) : (
          <Link to={`/reservar/${cancha.id}`} className="block w-full btn-primary text-center text-sm">
            Reservar ahora
          </Link>
        )}
      </div>
    </div>
  );
};
