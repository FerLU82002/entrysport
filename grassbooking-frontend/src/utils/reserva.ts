import { Reserva } from '../types';

/** Convierte "HH:MM" o "HH:MM:SS" a "H:MM AM/PM" */
export function to12h(hora: string): string {
  const [hStr, mStr = '00'] = hora.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr.padStart(2, '0')} ${ampm}`;
}

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
