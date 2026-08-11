import { useState, useEffect } from 'react';
import { Cancha } from '../types';
import { canchasService } from '../services/canchas.service';
import { adminCache } from '../lib/adminCache';

type Modo = 'publicas' | 'mi-local';

export const useCanchas = (modo: Modo = 'publicas', idLocal?: number) => {
  const cacheKey = modo === 'mi-local' ? 'canchas:mi-local' : `canchas:publicas:${idLocal ?? 'all'}`;
  const cached = adminCache.get<Cancha[]>(cacheKey);

  const [canchas, setCanchas] = useState<Cancha[]>(cached ?? []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    if (!adminCache.has(cacheKey)) setIsLoading(true);
    setError(null);
    try {
      const res =
        modo === 'mi-local'
          ? await canchasService.getMisCanchas()
          : await canchasService.getAll(idLocal);
      setCanchas(res.data);
      adminCache.set(cacheKey, res.data);
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
