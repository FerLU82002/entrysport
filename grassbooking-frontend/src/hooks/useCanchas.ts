import { useState, useEffect } from 'react';
import { Cancha } from '../types';
import { canchasService } from '../services/canchas.service';

export const useCanchas = (soloActivas = true) => {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await canchasService.getAll(soloActivas);
      setCanchas(res.data);
    } catch {
      setError('Error al cargar canchas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [soloActivas]);

  return { canchas, isLoading, error, recargar: cargar };
};
