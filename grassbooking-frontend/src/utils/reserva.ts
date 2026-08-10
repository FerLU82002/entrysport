import { Reserva } from '../types';

export function nombreClienteReserva(r: Reserva): string {
  if (r.usuario?.nombre) return r.usuario.nombre;
  const m = r.notas?.match(/Cliente:\s*([^|]+)/);
  return m ? m[1].trim() : 'Cliente';
}

export function canchaLabel(r: Reserva): string {
  return r.cancha?.nombre ?? `Cancha #${r.idCancha}`;
}
