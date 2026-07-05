import { Link } from 'react-router-dom';
import { Cancha } from '../../types';

interface Props {
  cancha: Cancha;
  showActions?: boolean;
  onEdit?: (cancha: Cancha) => void;
  onToggleEstado?: (cancha: Cancha) => void;
}

export const CanchaCard = ({ cancha, showActions, onEdit, onToggleEstado }: Props) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
    {cancha.imagenUrl ? (
      <img
        src={cancha.imagenUrl}
        alt={cancha.nombre}
        className="w-full h-40 object-cover"
      />
    ) : (
      <div className="w-full h-40 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-5xl">
        ⚽
      </div>
    )}

    <div className="p-4">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-gray-800">{cancha.nombre}</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            cancha.estado === 'activa'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {cancha.estado === 'activa' ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-1">{cancha.tipoSuperficie}</p>

      {cancha.descripcion && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{cancha.descripcion}</p>
      )}

      <p className="text-green-600 font-bold text-lg mb-4">
        S/ {Number(cancha.precioHora).toFixed(2)}{' '}
        <span className="text-sm font-normal text-gray-400">/ hora</span>
      </p>

      {showActions ? (
        <div className="flex gap-2">
          <button
            onClick={() => onEdit?.(cancha)}
            className="flex-1 btn-secondary text-sm"
          >
            Editar
          </button>
          <button
            onClick={() => onToggleEstado?.(cancha)}
            className={`flex-1 text-sm py-2 px-3 rounded-lg font-medium transition-colors ${
              cancha.estado === 'activa'
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {cancha.estado === 'activa' ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      ) : (
        <Link
          to={`/reservar/${cancha.id}`}
          className="block w-full btn-primary text-center text-sm"
        >
          Reservar ahora
        </Link>
      )}
    </div>
  </div>
);
