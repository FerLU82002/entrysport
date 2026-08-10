import { Reserva } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const W    = 480;
const PAD  = 36;
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const MONO = '"SF Mono", "Fira Code", "Courier New", monospace';

const C = {
  dark:    '#111827',
  darkMid: '#374151',
  mid:     '#6B7280',
  light:   '#9CA3AF',
  border:  '#E5E7EB',
  bg:      '#F3F4F6',
  bgCard:  '#F9FAFB',
  white:   '#FFFFFF',
  green:   '#15803D',
  greenBg: '#DCFCE7',
  amber:   '#B45309',
  amberBg: '#FEF3C7',
  red:     '#B91C1C',
  redBg:   '#FEE2E2',
};

// ── helpers ────────────────────────────────────────────────────────────────

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

function ticketDivider(ctx: CanvasRenderingContext2D, y: number, cx: number) {
  ctx.fillStyle = C.bg;
  ctx.beginPath(); ctx.arc(cx,      y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W - cx,  y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + 14, y);
  ctx.lineTo(W - cx - 14, y);
  ctx.stroke();
  ctx.restore();
}

function pill(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  bg: string, fg: string,
) {
  ctx.font = `700 10px ${FONT}`;
  const tw   = ctx.measureText(text).width;
  const pH   = 20; const pP = 8;
  ctx.fillStyle = bg;
  roundedRect(ctx, x, y - pH / 2, tw + pP * 2, pH, 10);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pP, y);
}

function smallLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.font = `600 10px ${FONT}`;
  ctx.fillStyle = C.light;
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), x, y);
}

function hRule(ctx: CanvasRenderingContext2D, y: number) {
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function formatMetodo(m: string) {
  const MAP: Record<string, string> = {
    efectivo: 'Efectivo',
    yape:     'Yape',
    plin:     'Plin',
    transferencia: 'Transferencia',
    tarjeta:  'Tarjeta',
    culqi:    'Tarjeta (Culqi)',
    mercadopago: 'Mercado Pago',
  };
  return MAP[m?.toLowerCase()] ?? capitalize(m ?? '');
}

// ── main ───────────────────────────────────────────────────────────────────

export const descargarTicketReserva = (reserva: Reserva) => {
  const montoTotal = Number(reserva.montoTotal);
  const montoPago  = reserva.pago?.monto != null ? Number(reserva.pago.monto) : montoTotal;
  const estadoPago = reserva.pago?.estadoPago ?? 'pendiente';
  const metodoPago = formatMetodo(reserva.pago?.metodoPago ?? '');
  const fechaPago  = reserva.pago?.fechaPago
    ? format(parseISO(reserva.pago.fechaPago), "d 'de' MMMM yyyy", { locale: es })
    : null;

  // Payment scenario
  const esReembolsado    = estadoPago === 'reembolsado';
  const esPagadoCompleto = estadoPago === 'pagado';
  const hayAdelanto      = !esPagadoCompleto && montoPago > 0 && montoPago < montoTotal;
  const faltante         = Number((montoTotal - montoPago).toFixed(2));

  const canchaName = reserva.cancha?.nombre ?? `Cancha #${reserva.idCancha}`;
  const deporte    = reserva.cancha?.deporte ?? '';
  const codigo     = (reserva.codigoReserva ?? '').slice(0, 8).toUpperCase();
  const fechaStr   = format(parseISO(reserva.fechaReserva), "EEEE, d 'de' MMMM yyyy", { locale: es });
  const horaInicio = reserva.horaInicio.substring(0, 5);
  const horaFin    = reserva.horaFin.substring(0, 5);

  // ── Measure dynamic height ──────────────────────────────────────────────
  const CARD_X = 16;
  const HDR_H  = 68;
  // extra rows: adelanto adds hRule gap; esPagadoCompleto may have fechaPago
  let estimatedRows = 0;
  if (esPagadoCompleto) estimatedRows = fechaPago ? 3 : (metodoPago ? 2 : 1);
  else if (hayAdelanto) estimatedRows = metodoPago ? 5 : 4; // +1 for hRule gap
  else if (esReembolsado) estimatedRows = 2;
  else estimatedRows = 2; // pendiente: 1 row + text

  const H =
    CARD_X         // top margin
    + HDR_H        // header
    + 28           // pad
    + 30           // cancha name
    + (deporte ? 22 : 0)
    + 44           // fecha/hora
    + 46           // estado
    + 38           // divider
    + 22           // "detalle de pago" label
    + 32           // pill row
    + estimatedRows * 26
    + (reserva.notas ? 36 : 0)
    + 16           // gap before code box
    + 72           // code box
    + 28           // footer
    + CARD_X       // bottom margin
    + 24;          // safety buffer

  const DPR    = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width  = W * DPR;
  canvas.height = H * DPR;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(DPR, DPR);

  // ── Background ──────────────────────────────────────────────────────────
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.shadowColor   = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur    = 28;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = C.white;
  roundedRect(ctx, CARD_X, CARD_X, W - CARD_X * 2, H - CARD_X * 2, 18);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // ── Header ──────────────────────────────────────────────────────────────
  ctx.fillStyle = C.dark;
  roundedRectTop(ctx, CARD_X, CARD_X, W - CARD_X * 2, HDR_H, 18);
  ctx.fill();

  ctx.font = `700 16px ${FONT}`;
  ctx.fillStyle = C.white;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('Chocolaterospe', PAD, CARD_X + HDR_H / 2);

  ctx.font = `500 10px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'right';
  ctx.fillText('COMPROBANTE DE RESERVA', W - PAD, CARD_X + HDR_H / 2);
  ctx.textAlign = 'left';

  let y = CARD_X + HDR_H + 26;

  // ── Cancha / deporte ────────────────────────────────────────────────────
  ctx.font = `700 19px ${FONT}`;
  ctx.fillStyle = C.dark;
  ctx.textBaseline = 'middle';
  ctx.fillText(canchaName, PAD, y);
  y += 30;

  if (deporte) {
    ctx.font = `500 12px ${FONT}`;
    ctx.fillStyle = C.mid;
    ctx.fillText(capitalize(deporte), PAD, y);
    y += 22;
  }

  // ── Fecha / Horario ─────────────────────────────────────────────────────
  const col2 = PAD + (W - PAD * 2) / 2;
  smallLabel(ctx, 'Fecha', PAD, y);
  smallLabel(ctx, 'Horario', col2, y);
  y += 18;

  ctx.font = `500 13px ${FONT}`;
  ctx.fillStyle = C.darkMid;
  ctx.textBaseline = 'middle';
  ctx.fillText(capitalize(fechaStr), PAD, y);
  ctx.fillText(`${horaInicio} – ${horaFin}`, col2, y);
  y += 26;

  // ── Estado de la reserva ────────────────────────────────────────────────
  smallLabel(ctx, 'Estado de la reserva', PAD, y);
  y += 18;

  const estadoLabel =
    reserva.estado === 'confirmada' ? 'CONFIRMADA'  :
    reserva.estado === 'completada' ? 'COMPLETADA'  :
    reserva.estado === 'cancelada'  ? 'CANCELADA'   :
    reserva.estado === 'no_asistio' ? 'NO ASISTIÓ'  : 'PENDIENTE';
  const esPositivo = reserva.estado === 'confirmada' || reserva.estado === 'completada';
  pill(ctx, estadoLabel, PAD, y,
    esPositivo ? C.greenBg : C.amberBg,
    esPositivo ? C.green   : C.amber);
  y += 28;

  // ── Ticket divider ───────────────────────────────────────────────────────
  y += 6;
  ticketDivider(ctx, y, CARD_X);
  y += 26;

  // ── Detalle de pago ──────────────────────────────────────────────────────
  smallLabel(ctx, 'Detalle de pago', PAD, y);
  y += 22;

  // ---- Payment pill -------------------------------------------------------
  if (esPagadoCompleto) {
    pill(ctx, 'PAGO COMPLETO', PAD, y, C.greenBg, C.green);
  } else if (hayAdelanto) {
    pill(ctx, 'ADELANTO PAGADO', PAD, y, C.greenBg, C.green);
  } else if (esReembolsado) {
    pill(ctx, 'REEMBOLSADO', PAD, y, C.redBg, C.red);
  } else {
    pill(ctx, 'PENDIENTE DE PAGO', PAD, y, C.amberBg, C.amber);
  }
  y += 32;

  // ---- Row helper ---------------------------------------------------------
  const row = (
    lbl: string, val: string,
    lColor = C.mid, vColor = C.dark, vBold = false,
  ) => {
    ctx.textBaseline = 'middle';
    ctx.font = `400 13px ${FONT}`;
    ctx.fillStyle = lColor;
    ctx.fillText(lbl, PAD, y);
    ctx.font = `${vBold ? '700' : '500'} 14px ${FONT}`;
    ctx.fillStyle = vColor;
    ctx.textAlign = 'right';
    ctx.fillText(val, W - PAD, y);
    ctx.textAlign = 'left';
    y += 26;
  };

  // ---- Amounts by scenario ------------------------------------------------
  if (esPagadoCompleto) {
    row('Total pagado', `S/ ${montoTotal.toFixed(2)}`, C.mid, C.green, true);
    if (metodoPago) row('Método de pago', metodoPago);
    if (fechaPago)  row('Fecha de pago',  capitalize(fechaPago));

  } else if (hayAdelanto) {
    row('Adelanto pagado ahora', `S/ ${montoPago.toFixed(2)}`,  C.mid, C.green, true);
    if (metodoPago) row('Método del adelanto', metodoPago);
    y += 2;
    hRule(ctx, y); y += 10;
    row('Saldo pendiente al llegar', `S/ ${faltante.toFixed(2)}`,  C.mid, C.amber, true);
    row('Total de la reserva',       `S/ ${montoTotal.toFixed(2)}`, C.light, C.darkMid);

  } else if (esReembolsado) {
    row('Monto reembolsado', `S/ ${montoPago.toFixed(2)}`, C.mid, C.red, true);
    row('Total original',    `S/ ${montoTotal.toFixed(2)}`, C.light, C.darkMid);

  } else {
    // sin pago / pendiente
    row('Total a pagar al llegar', `S/ ${montoTotal.toFixed(2)}`, C.mid, C.dark, true);
    ctx.font = `400 12px ${FONT}`;
    ctx.fillStyle = C.light;
    ctx.textBaseline = 'middle';
    ctx.fillText('Sin pago anticipado · pagar en el local', PAD, y);
    y += 22;
  }

  // ── Notas ────────────────────────────────────────────────────────────────
  if (reserva.notas) {
    y += 4;
    hRule(ctx, y); y += 12;
    ctx.font = `400 11px ${FONT}`;
    ctx.fillStyle = C.light;
    ctx.textBaseline = 'middle';
    ctx.fillText(`Nota: ${reserva.notas}`, PAD, y);
    y += 24;
  }

  y += 12;

  // ── Código de reserva ────────────────────────────────────────────────────
  const boxH = 62;
  ctx.fillStyle = C.bgCard;
  roundedRect(ctx, PAD, y, W - PAD * 2, boxH, 10);
  ctx.fill();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  roundedRect(ctx, PAD, y, W - PAD * 2, boxH, 10);
  ctx.stroke();

  smallLabel(ctx, 'Código de reserva', PAD + 14, y + 16);

  ctx.font = `700 22px ${MONO}`;
  ctx.fillStyle = C.dark;
  ctx.textBaseline = 'middle';
  ctx.fillText(`# ${codigo}`, PAD + 14, y + 44);

  y += boxH + 18;

  // ── Footer ───────────────────────────────────────────────────────────────
  ctx.font = `400 11px ${FONT}`;
  ctx.fillStyle = C.light;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Válido solo con el código de reserva · chocolaterospe.space', W / 2, y);
  ctx.textAlign = 'left';

  // ── Download ─────────────────────────────────────────────────────────────
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

