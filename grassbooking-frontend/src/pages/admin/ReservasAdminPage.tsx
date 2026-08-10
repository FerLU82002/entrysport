import { useState, useEffect } from 'react';
import { X, ClipboardList, Plus, RefreshCw, LayoutList, CalendarDays } from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ReservaCard } from '../../components/reservas/ReservaCard';
import { CalendarioReservas } from '../../components/reservas/CalendarioReservas';
import { reservasService, CreateReservaManualPayload } from '../../services/reservas.service';
import { pagosService } from '../../services/pagos.service';
import { canchasService } from '../../services/canchas.service';
import { Reserva, EstadoReserva, EstadoPago, Cancha, SlotDisponibilidad } from '../../types';
import { nombreClienteReserva, telefonoClienteReserva, canchaLabel } from '../../utils/reserva';
import axios from 'axios';

const ESTADOS_RESERVA: { value: EstadoReserva | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'cancelada', label: 'Canceladas' },
  { value: 'completada', label: 'Completadas' },
  { value: 'no_asistio', label: 'No asistió' },
];

const METODOS_PAGO = ['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'];

const hoy = () => new Date().toISOString().split('T')[0];

export const ReservasAdminPage = () => {
  const [vista, setVista] = useState<'lista' | 'calendario'>('calendario');
  const [calRefreshKey, setCalRefreshKey] = useState(0);

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoReserva | 'todas'>('todas');
  const [filtroFecha, setFiltroFecha] = useState('');

  // Modal gestionar reserva existente
  const [modalReserva, setModalReserva] = useState<Reserva | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoReserva>('confirmada');
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('pendiente');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [actualizando, setActualizando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  // Modal nueva reserva manual
  const [showNueva, setShowNueva] = useState(false);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [slots, setSlots] = useState<SlotDisponibilidad[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [nueva, setNueva] = useState<CreateReservaManualPayload>({
    idCancha: 0,
    fechaReserva: hoy(),
    horaInicio: '',
    nombreCliente: '',
    telefonoCliente: '',
    metodoPago: 'efectivo',
    pagado: true,
    notas: '',
  });
  const [guardandoNueva, setGuardandoNueva] = useState(false);
  const [errorNueva, setErrorNueva] = useState('');

  const cargar = async () => {
    setIsLoading(true);
    try {
      const params: { fecha?: string; estado?: string } = {};
      if (filtroFecha) params.fecha = filtroFecha;
      if (filtroEstado !== 'todas') params.estado = filtroEstado;
      const res = await reservasService.getTodas(params);
      setReservas(res.data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [filtroEstado, filtroFecha]);

  // Cargar canchas cuando se abre el modal de nueva reserva
  useEffect(() => {
    if (showNueva && canchas.length === 0) {
      canchasService.getMisCanchas().then((res) => setCanchas(res.data)).catch(() => {});
    }
  }, [showNueva]);

  // Recargar slots cuando cambia cancha o fecha
  useEffect(() => {
    if (!nueva.idCancha || !nueva.fechaReserva) {
      setSlots([]);
      return;
    }
    setCargandoSlots(true);
    setNueva((p) => ({ ...p, horaInicio: '' }));
    reservasService
      .getDisponibilidad(nueva.idCancha, nueva.fechaReserva)
      .then((res) => setSlots(res.data.slots))
      .catch(() => setSlots([]))
      .finally(() => setCargandoSlots(false));
  }, [nueva.idCancha, nueva.fechaReserva]);

  const abrirModal = (reserva: Reserva) => {
    setModalReserva(reserva);
    setNuevoEstado(reserva.estado);
    setEstadoPago(reserva.pago?.estadoPago ?? 'pendiente');
    setMetodoPago(reserva.pago?.metodoPago ?? 'efectivo');
    setErrorModal('');
  };

  const handleGuardar = async () => {
    if (!modalReserva) return;
    setActualizando(true);
    setErrorModal('');
    try {
      await reservasService.cambiarEstado(modalReserva.id, nuevoEstado);
      if (modalReserva.pago?.id) {
        await pagosService.update(modalReserva.pago.id, estadoPago, metodoPago);
      }
      setModalReserva(null);
      cargar();
      setCalRefreshKey(k => k + 1);
    } catch {
      setErrorModal('Error al guardar. Intenta de nuevo.');
    } finally {
      setActualizando(false);
    }
  };

  const handleGuardarNueva = async () => {
    if (!nueva.idCancha || !nueva.fechaReserva || !nueva.horaInicio) {
      setErrorNueva('Completa cancha, fecha y hora.');
      return;
    }
    setGuardandoNueva(true);
    setErrorNueva('');
    try {
      await reservasService.createManual(nueva);
      setShowNueva(false);
      setNueva({
        idCancha: 0,
        fechaReserva: hoy(),
        horaInicio: '',
        nombreCliente: '',
        telefonoCliente: '',
        metodoPago: 'efectivo',
        pagado: true,
        notas: '',
      });
      setSlots([]);
      cargar();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorNueva(err.response?.data?.message || 'Error al registrar reserva');
      } else {
        setErrorNueva('Error inesperado. Intenta de nuevo.');
      }
    } finally {
      setGuardandoNueva(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <main className="px-4 py-4 sm:px-6 sm:py-6 max-w-6xl w-full">
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <h1 className="text-base sm:text-xl font-semibold text-ink-900 truncate">
                Gestión de reservas
              </h1>

              <div className="flex items-center gap-2 shrink-0">
                {/* Vista toggle — íconos en mobile, texto en sm+ */}
                <div className="flex rounded-md border border-ink-200 overflow-hidden">
                  <button
                    onClick={() => setVista('calendario')}
                    title="Vista calendario"
                    className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 transition-colors ${
                      vista === 'calendario'
                        ? 'bg-ink-900 text-white'
                        : 'bg-white text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    <CalendarDays size={15} strokeWidth={2} />
                    <span className="hidden sm:inline text-sm">Calendario</span>
                  </button>
                  <button
                    onClick={() => setVista('lista')}
                    title="Vista lista"
                    className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 border-l border-ink-200 transition-colors ${
                      vista === 'lista'
                        ? 'bg-ink-900 text-white'
                        : 'bg-white text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    <LayoutList size={15} strokeWidth={2} />
                    <span className="hidden sm:inline text-sm">Lista</span>
                  </button>
                </div>

                {/* Registrar — icono en mobile, texto en sm+ */}
                <button
                  onClick={() => { setShowNueva(true); setErrorNueva(''); }}
                  className="btn-primary flex items-center gap-1.5 text-sm px-3 py-1.5"
                >
                  <Plus size={16} strokeWidth={2} />
                  <span className="hidden sm:inline">Registrar</span>
                </button>
              </div>
            </div>

            {/* ── Calendario ── */}
            {vista === 'calendario' && (
              <CalendarioReservas
                onGestionar={abrirModal}
                refreshKey={calRefreshKey}
              />
            )}

            {/* ── Lista ── */}
            {vista === 'lista' && (
              <>
                <div className="flex flex-wrap gap-3 mb-4">
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="input-field max-w-xs"
                  />
                  {filtroFecha && (
                    <button onClick={() => setFiltroFecha('')} className="btn-secondary text-sm">
                      Limpiar fecha
                    </button>
                  )}
                </div>

                <div className="flex gap-1.5 flex-wrap mb-6">
                  {ESTADOS_RESERVA.map((e) => (
                    <button
                      key={e.value}
                      onClick={() => setFiltroEstado(e.value)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        filtroEstado === e.value
                          ? 'bg-ink-900 text-white'
                          : 'bg-white text-ink-600 border border-ink-200 hover:border-ink-300'
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-16">
                    <LoadingSpinner size="lg" text="Cargando reservas..." />
                  </div>
                ) : reservas.length === 0 ? (
                  <div className="card text-center py-12 text-ink-400">
                    <ClipboardList className="mx-auto mb-3" size={28} strokeWidth={1.5} />
                    <p className="text-sm">No hay reservas con este filtro</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservas.map((reserva) => (
                      <ReservaCard
                        key={reserva.id}
                        reserva={reserva}
                        showUsuario
                        onCambiarEstado={abrirModal}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── Modal: gestionar reserva existente ── */}
      {modalReserva && (() => {
        const montoTotal = Number(modalReserva.montoTotal);
        const montoPago = modalReserva.pago?.monto != null ? Number(modalReserva.pago.monto) : montoTotal;
        const hayAdelanto = montoPago > 0 && montoPago < montoTotal;
        const faltante = Number((montoTotal - montoPago).toFixed(2));
        return (
          <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-ink-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-ink-900">Gestionar reserva</h3>
                <button onClick={() => setModalReserva(null)} className="text-ink-400 hover:text-ink-700">
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>

              {/* Info + cobro resumido */}
              <div className="bg-ink-50 rounded-md p-3 mb-5 text-sm space-y-1">
                <p className="text-ink-500">
                  Código: <span className="font-mono font-medium text-ink-700">
                    #{modalReserva.codigoReserva?.slice(0, 8).toUpperCase()}
                  </span>
                </p>
                <p className="text-ink-500">
                  Cliente: <span className="font-medium text-ink-700">
                    {nombreClienteReserva(modalReserva)}
                  </span>
                  {telefonoClienteReserva(modalReserva) && (
                    <span className="text-ink-400"> · {telefonoClienteReserva(modalReserva)}</span>
                  )}
                </p>
                <p className="text-ink-500">
                  Cancha: <span className="font-medium text-ink-700">
                    {canchaLabel(modalReserva)}
                  </span>
                </p>
                <p className="text-ink-500">
                  Fecha: <span className="font-medium text-ink-700">
                    {modalReserva.fechaReserva} · {modalReserva.horaInicio.substring(0, 5)}–{modalReserva.horaFin.substring(0, 5)}
                  </span>
                </p>
                {modalReserva.notas && (
                  <p className="text-ink-500">
                    Obs: <span className="font-medium text-ink-700">{modalReserva.notas}</span>
                  </p>
                )}
                <div className="border-t border-ink-200 my-1.5" />
                {hayAdelanto ? (
                  <>
                    <p className="text-ink-500">
                      Adelanto recibido:{' '}
                      <span className="font-medium text-green-700">S/ {montoPago.toFixed(2)}</span>
                    </p>
                    <p className="text-ink-500">
                      Falta cobrar al llegar:{' '}
                      <span className="font-semibold text-amber-700">S/ {faltante.toFixed(2)}</span>
                    </p>
                    <p className="text-ink-400 text-xs">Total reserva: S/ {montoTotal.toFixed(2)}</p>
                  </>
                ) : (
                  <p className="text-ink-500">
                    Total: <span className="font-semibold text-ink-900">S/ {montoTotal.toFixed(2)}</span>
                  </p>
                )}
              </div>

              {/* Estado */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Estado de la reserva</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value as EstadoReserva)}
                  className="input-field"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="completada">Completada</option>
                  <option value="no_asistio">No asistió</option>
                </select>
              </div>

              <div className="border-t border-ink-100 my-4" />

              {/* Cobro */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  {hayAdelanto ? 'El cliente pagó el resto al llegar' : 'Cobro'}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEstadoPago('pendiente')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                      estadoPago === 'pendiente'
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                    }`}
                  >
                    {hayAdelanto ? 'Aún no' : 'Sin cobrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstadoPago('pagado')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                      estadoPago === 'pagado'
                        ? 'bg-green-700 text-white border-green-700'
                        : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                    }`}
                  >
                    {hayAdelanto ? 'Sí, cobrado' : 'Cobrado'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstadoPago('reembolsado')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                      estadoPago === 'reembolsado'
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                    }`}
                  >
                    Reembolsado
                  </button>
                </div>
              </div>

              {estadoPago === 'pagado' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">¿Cómo pagó?</label>
                  <div className="flex flex-wrap gap-2">
                    {METODOS_PAGO.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetodoPago(m)}
                        className={`px-3 py-1.5 rounded-md text-sm capitalize border transition-colors ${
                          metodoPago === m
                            ? 'bg-ink-900 text-white border-ink-900'
                            : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {errorModal && <p className="text-red-600 text-sm mb-3">{errorModal}</p>}

              <div className="flex gap-3 mt-2">
                <button onClick={handleGuardar} disabled={actualizando} className="flex-1 btn-primary py-2.5">
                  {actualizando ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" /> Guardando...
                    </span>
                  ) : 'Guardar cambios'}
                </button>
                <button onClick={() => setModalReserva(null)} className="flex-1 btn-secondary py-2.5">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal: nueva reserva manual ── */}
      {showNueva && (
        <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-ink-100 my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-ink-900">Registrar reserva manual</h3>
              <button onClick={() => setShowNueva(false)} className="text-ink-400 hover:text-ink-700">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Cancha */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Cancha</label>
                <select
                  className="input-field"
                  value={nueva.idCancha || ''}
                  onChange={(e) => setNueva((p) => ({ ...p, idCancha: Number(e.target.value), horaInicio: '' }))}
                >
                  <option value="">Selecciona una cancha</option>
                  {canchas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} — {c.deporte}</option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Fecha</label>
                <input
                  type="date"
                  className="input-field"
                  value={nueva.fechaReserva}
                  min={hoy()}
                  onChange={(e) => setNueva((p) => ({ ...p, fechaReserva: e.target.value, horaInicio: '' }))}
                />
              </div>

              {/* Slots disponibles */}
              {nueva.idCancha > 0 && nueva.fechaReserva && (
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Hora</label>
                  {cargandoSlots ? (
                    <div className="flex items-center gap-2 text-ink-400 text-sm">
                      <RefreshCw size={14} className="animate-spin" /> Cargando horarios...
                    </div>
                  ) : slots.length === 0 ? (
                    /* Sin horarios configurados: ingreso libre entre 08:00–23:00 */
                    <div>
                      <input
                        type="time"
                        min="08:00"
                        max="23:00"
                        className="input-field"
                        value={nueva.horaInicio}
                        onChange={(e) => setNueva((p) => ({ ...p, horaInicio: e.target.value }))}
                      />
                      <p className="text-xs text-ink-400 mt-1">Ingresa la hora manualmente (08:00 – 23:00)</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5">
                      {slots.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          disabled={!s.disponible}
                          onClick={() => setNueva((p) => ({ ...p, horaInicio: s.horaInicio }))}
                          className={`py-2 rounded-md text-xs font-medium border transition-colors ${
                            nueva.horaInicio === s.horaInicio
                              ? 'bg-ink-900 text-white border-ink-900'
                              : s.disponible
                                ? 'bg-white text-ink-700 border-ink-200 hover:border-ink-400'
                                : 'bg-ink-50 text-ink-300 border-ink-100 cursor-not-allowed line-through'
                          }`}
                        >
                          {s.horaInicio}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-ink-100" />

              {/* Nombre cliente */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Nombre del cliente <span className="text-ink-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: Juan Pérez"
                  value={nueva.nombreCliente}
                  onChange={(e) => setNueva((p) => ({ ...p, nombreCliente: e.target.value }))}
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Teléfono <span className="text-ink-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="999 888 777"
                  value={nueva.telefonoCliente}
                  onChange={(e) => setNueva((p) => ({ ...p, telefonoCliente: e.target.value }))}
                />
              </div>

              <div className="border-t border-ink-100" />

              {/* Método de pago */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Método de pago</label>
                <div className="flex flex-wrap gap-2">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNueva((p) => ({ ...p, metodoPago: m }))}
                      className={`px-3 py-1.5 rounded-md text-sm capitalize border transition-colors ${
                        nueva.metodoPago === m
                          ? 'bg-ink-900 text-white border-ink-900'
                          : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* ¿Ya pagó? */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNueva((p) => ({ ...p, pagado: !p.pagado }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    nueva.pagado ? 'bg-ink-900' : 'bg-ink-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      nueva.pagado ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-ink-700">
                  {nueva.pagado ? 'Ya pagó' : 'Pago pendiente'}
                </span>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Notas <span className="text-ink-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Observaciones adicionales..."
                  value={nueva.notas}
                  onChange={(e) => setNueva((p) => ({ ...p, notas: e.target.value }))}
                />
              </div>
            </div>

            {errorNueva && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-md">
                {errorNueva}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleGuardarNueva}
                disabled={guardandoNueva}
                className="flex-1 btn-primary py-2.5"
              >
                {guardandoNueva ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" /> Registrando...
                  </span>
                ) : 'Registrar reserva'}
              </button>
              <button onClick={() => setShowNueva(false)} className="flex-1 btn-secondary py-2.5">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
