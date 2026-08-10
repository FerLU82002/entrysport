import { Reserva } from '../types';

// Prioriza el nombre de cliente registrado en la reserva manual, luego el
// formato legado embebido en "notas" ("Cliente: X | ..."), luego la cuenta
// dueña de la reserva (válido para reservas self-service).
export function nombreClienteReserva(r: Reserva): string {
  if (r.nombreCliente) return r.nombreCliente;
  const m = r.notas?.match(/Cliente:\s*([^|]+)/);
  if (m) return m[1].trim();
  if (r.usuario?.nombre) return r.usuario.nombre;
  return 'Cliente';
}

export function telefonoClienteReserva(r: Reserva): string | undefined {
  return r.telefonoCliente || r.usuario?.telefono;
}

export function canchaLabel(r: Reserva): string {
  const nombre = r.cancha?.nombre ?? `Cancha #${r.idCancha}`;
  return r.cancha?.deporte ? `${nombre} · ${r.cancha.deporte}` : nombre;
}
