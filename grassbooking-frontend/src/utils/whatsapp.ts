import { Reserva } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/** Normaliza un número peruano a formato internacional sin símbolos (51987654321). */
const normalizarTelefono = (telefono: string): string => {
  const soloDigitos = telefono.replace(/\D/g, '');
  if (soloDigitos.startsWith('51') && soloDigitos.length === 11) return soloDigitos;
  if (soloDigitos.length === 9) return `51${soloDigitos}`;
  return soloDigitos;
};

export const construirEnlaceWhatsapp = (telefono: string, mensaje: string): string => {
  const numero = normalizarTelefono(telefono);
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
};

export const construirMensajeComprobante = (reserva: Reserva, montoAPagar?: number): string => {
  const fecha = format(parseISO(reserva.fechaReserva), "EEEE d 'de' MMMM", { locale: es });
  const monto = montoAPagar ?? Number(reserva.montoTotal);
  const esAdelanto = montoAPagar != null && montoAPagar < Number(reserva.montoTotal);
  const lineas = [
    'Hola, quiero enviar el comprobante de pago de mi reserva:',
    '',
    `Cancha: ${reserva.cancha?.nombre ?? `#${reserva.idCancha}`}`,
    `Fecha: ${fecha}`,
    `Hora: ${reserva.horaInicio.substring(0, 5)} - ${reserva.horaFin.substring(0, 5)}`,
    esAdelanto
      ? `Adelanto pagado: S/ ${monto.toFixed(2)} (total reserva: S/ ${Number(reserva.montoTotal).toFixed(2)})`
      : `Monto: S/ ${monto.toFixed(2)}`,
    `Código de reserva: ${reserva.codigoReserva?.slice(0, 8).toUpperCase()}`,
    '',
    'Adjunto la captura del pago por Yape a continuación.',
  ];
  return lineas.join('\n');
};
