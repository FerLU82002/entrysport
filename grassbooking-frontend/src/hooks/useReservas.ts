import { useState, useEffect } from 'react';
import { Reserva } from '../types';
import { reservasService } from '../services/reservas.service';

export const useReservas = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await reservasService.getMisReservas();
      setReservas(res.data);
    } catch {
      setError('Error al cargar reservas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return { reservas, isLoading, error, recargar: cargar };
};
