import { Reserva } from '../types';

export function nombreClienteReserva(r: Reserva): string {
  if (r.usuario?.nombre) return r.usuario.nombre;
  if (r.nombreCliente)   return r.nombreCliente;
  const m = r.notas?.match(/Cliente:\s*([^|]+)/);
  return m ? m[1].trim() : 'Cliente';
}

export function telefonoClienteReserva(r: Reserva): string {
  if (r.usuario?.telefono) return r.usuario.telefono;
  if (r.telefonoCliente)   return r.telefonoCliente;
  return '';
}

export function canchaLabel(r: Reserva): string {
  return r.cancha?.nombre ?? `Cancha #${r.idCancha}`;
}
