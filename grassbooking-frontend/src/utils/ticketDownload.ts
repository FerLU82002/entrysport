import { Reserva } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const W = 480;
const PAD = 36;
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const MONO = '"SF Mono", "Fira Code", "Courier New", monospace';

const C = {
  dark:     '#111827',
  darkMid:  '#374151',
  mid:      '#6B7280',
  light:    '#9CA3AF',
  border:   '#E5E7EB',
  bg:       '#F3F4F6',
  white:    '#FFFFFF',
  green:    '#15803D',
  greenBg:  '#DCFCE7',
  amber:    '#B45309',
  amberBg:  '#FEF3C7',
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,       y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,     y,     x + r,   y,         r);
  ctx.closePath();
}

function roundedRectTop(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,   x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x,     y + h);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x, y,   x + r, y,         r);
  ctx.closePath();
}

// Dashed divider with notch circles at card edges — looks like a tear-off ticket
function ticketDivider(ctx: CanvasRenderingContext2D, y: number, cardX: number) {
  const rightEdge = W - cardX;

  // Circles (bg color) over each card edge = "punched holes"
  ctx.fillStyle = C.bg;
  ctx.beginPath(); ctx.arc(cardX, y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rightEdge, y, 13, 0, Math.PI * 2); ctx.fill();

  // Dashed line between holes
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 14, y);
  ctx.lineTo(rightEdge - 14, y);
  ctx.stroke();
  ctx.restore();
}

function pill(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  bg: string, fg: string,
) {
  ctx.font = `700 10px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const pH = 20; const pPad = 8;
  ctx.fillStyle = bg;
  roundedRect(ctx, x, y - pH / 2, tw + pPad * 2, pH, 10);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pPad, y);
}

function smallLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.font = `600 10px ${FONT}`;
  ctx.fillStyle = C.light;
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), x, y);
}

export const descargarTicketReserva = (reserva: Reserva) => {
  const montoTotal = Number(reserva.montoTotal);
  const montoPago  = reserva.pago?.monto != null ? Number(reserva.pago.monto) : montoTotal;
  const hayAdelanto       = montoPago > 0 && montoPago < montoTotal;
  const faltante          = Number((montoTotal - montoPago).toFixed(2));
  const esPagadoCompleto  = reserva.pago?.estadoPago === 'pagado';

  const canchaName = reserva.cancha?.nombre ?? `Cancha #${reserva.idCancha}`;
  const codigo     = (reserva.codigoReserva ?? '').slice(0, 8).toUpperCase();
  const fechaStr   = format(parseISO(reserva.fechaReserva), "EEEE, d 'de' MMMM yyyy", { locale: es });
  const fechaCap   = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
  const horaInicio = reserva.horaInicio.substring(0, 5);
  const horaFin    = reserva.horaFin.substring(0, 5);

  // Card geometry
  const CARD_X  = 16;
  const CARD_Y  = 16;
  const CARD_W  = W - CARD_X * 2;
  const HDR_H   = 68;
  const H       = hayAdelanto && !esPagadoCompleto ? 610 : 570;

  const DPR    = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width  = W * DPR;
  canvas.height = H * DPR;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(DPR, DPR);

  // ── Outer background ──
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // ── Card shadow ──
  ctx.shadowColor   = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur    = 28;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = C.white;
  roundedRect(ctx, CARD_X, CARD_Y, CARD_W, H - CARD_Y * 2, 18);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // ── Header (dark) ──
  ctx.fillStyle = C.dark;
  roundedRectTop(ctx, CARD_X, CARD_Y, CARD_W, HDR_H, 18);
  ctx.fill();

  // App name
  ctx.font = `700 16px ${FONT}`;
  ctx.fillStyle = C.white;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('EntrySport', PAD, CARD_Y + HDR_H / 2);

  // Right label
  ctx.font = `500 10px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'right';
  ctx.fillText('COMPROBANTE DE RESERVA', W - PAD, CARD_Y + HDR_H / 2);
  ctx.textAlign = 'left';

  let y = CARD_Y + HDR_H + 26;

  // ── Cancha ──
  ctx.font = `700 19px ${FONT}`;
  ctx.fillStyle = C.dark;
  ctx.textBaseline = 'middle';
  ctx.fillText(canchaName, PAD, y);
  y += 30;

  // ── Fecha / Horario (2 cols) ──
  const col2 = PAD + (CARD_W / 2) - 8;
  smallLabel(ctx, 'Fecha', PAD, y);
  smallLabel(ctx, 'Horario', col2, y);
  y += 18;

  ctx.font = `500 13px ${FONT}`;
  ctx.fillStyle = C.darkMid;
  ctx.textBaseline = 'middle';
  ctx.fillText(fechaCap, PAD, y);
  ctx.fillText(`${horaInicio} – ${horaFin}`, col2, y);
  y += 26;

  // ── Estado ──
  smallLabel(ctx, 'Estado', PAD, y);
  y += 18;

  const estadoLabel =
    reserva.estado === 'confirmada'  ? 'CONFIRMADA'  :
    reserva.estado === 'completada'  ? 'COMPLETADA'  :
    reserva.estado === 'cancelada'   ? 'CANCELADA'   :
    reserva.estado === 'no_asistio'  ? 'NO ASISTIÓ'  : 'PENDIENTE';
  const esPositivo = reserva.estado === 'confirmada' || reserva.estado === 'completada';
  pill(ctx, estadoLabel, PAD, y, esPositivo ? C.greenBg : C.amberBg, esPositivo ? C.green : C.amber);
  y += 28;

  // ── Ticket divider ──
  y += 6;
  ticketDivider(ctx, y, CARD_X);
  y += 26;

  // ── Detalle de pago ──
  smallLabel(ctx, 'Detalle de pago', PAD, y);
  y += 22;

  const drawPayRow = (
    lbl: string, val: string,
    lSize = 13, vSize = 14,
    lColor = C.mid, vColor = C.dark,
    vBold = false,
  ) => {
    ctx.textBaseline = 'middle';
    ctx.font = `400 ${lSize}px ${FONT}`;
    ctx.fillStyle = lColor;
    ctx.fillText(lbl, PAD, y);

    ctx.font = `${vBold ? '700' : '500'} ${vSize}px ${FONT}`;
    ctx.fillStyle = vColor;
    ctx.textAlign = 'right';
    ctx.fillText(val, W - PAD, y);
    ctx.textAlign = 'left';
    y += 24;
  };

  if (hayAdelanto && !esPagadoCompleto) {
    drawPayRow('Total reserva',    `S/ ${montoTotal.toFixed(2)}`, 13, 13, C.mid, C.darkMid);
    drawPayRow('Adelanto pagado',  `S/ ${montoPago.toFixed(2)}`,  13, 15, C.mid, C.green, true);
    drawPayRow('Saldo al llegar',  `S/ ${faltante.toFixed(2)}`,   13, 15, C.mid, C.amber, true);
  } else if (esPagadoCompleto) {
    drawPayRow('Total reserva',    `S/ ${montoTotal.toFixed(2)}`, 13, 13, C.mid, C.darkMid);
    pill(ctx, 'PAGO COMPLETO', PAD, y, C.greenBg, C.green);
    ctx.font = `700 15px ${FONT}`;
    ctx.fillStyle = C.green;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`S/ ${montoTotal.toFixed(2)}`, W - PAD, y);
    ctx.textAlign = 'left';
    y += 28;
  } else {
    drawPayRow('Total a pagar', `S/ ${montoTotal.toFixed(2)}`, 13, 16, C.mid, C.dark, true);
  }

  y += 10;

  // ── Code box ──
  const boxH = 62;
  ctx.fillStyle = C.bg;
  roundedRect(ctx, PAD, y, W - PAD * 2, boxH, 10);
  ctx.fill();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  roundedRect(ctx, PAD, y, W - PAD * 2, boxH, 10);
  ctx.stroke();

  ctx.font = `500 10px ${FONT}`;
  ctx.fillStyle = C.light;
  ctx.textBaseline = 'middle';
  ctx.fillText('CÓDIGO DE RESERVA', PAD + 14, y + 16);

  ctx.font = `700 22px ${MONO}`;
  ctx.fillStyle = C.dark;
  ctx.fillText(`# ${codigo}`, PAD + 14, y + 42);

  y += boxH + 18;

  // ── Footer ──
  ctx.font = `400 11px ${FONT}`;
  ctx.fillStyle = C.light;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Válido solo con el código de reserva · entrysport.pe', W / 2, y);
  ctx.textAlign = 'left';

  // ── Download ──
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `reserva-${codigo}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
};
