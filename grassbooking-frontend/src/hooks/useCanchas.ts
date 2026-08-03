import { useState, useEffect } from 'react';
import { Cancha } from '../types';
import { canchasService } from '../services/canchas.service';

type Modo = 'publicas' | 'mi-local';

export const useCanchas = (modo: Modo = 'publicas', idLocal?: number) => {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res =
        modo === 'mi-local'
          ? await canchasService.getMisCanchas()
          : await canchasService.getAll(idLocal);
      setCanchas(res.data);
    } catch {
      setError('Error al cargar canchas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, idLocal]);

  return { canchas, isLoading, error, recargar: cargar };
};
