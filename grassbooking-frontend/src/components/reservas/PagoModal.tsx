import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, CreditCard, Landmark, QrCode, MessageCircle } from 'lucide-react';
import { Reserva, ConfiguracionPagoPublica } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { localesService } from '../../services/locales.service';
import { pagosService } from '../../services/pagos.service';
import { mercadoPagoOauthService } from '../../services/mercadopago-oauth.service';
import { useAuth } from '../../hooks/useAuth';
import { urlImagen } from '../../utils/media';
import { construirEnlaceWhatsapp, construirMensajeComprobante } from '../../utils/whatsapp';

declare global {
  interface Window {
    Culqi?: {
      publicKey: string;
      init: () => void;
      settings: (opts: Record<string, unknown>) => void;
      open: () => void;
      close: () => void;
      token?: { id: string };
      order?: unknown;
      error?: { user_message?: string };
    };
    culqi?: () => void;
  }
}

const CULQI_SCRIPT_URL = 'https://checkout.culqi.com/js/v4';

interface Props {
  reserva: Reserva;
  onClose: () => void;
  onPagado: () => void;
}

export const PagoModal = ({ reserva, onClose, onPagado }: Props) => {
  const { usuario } = useAuth();
  const [config, setConfig] = useState<ConfiguracionPagoPublica | null>(null);
  const [mercadopagoConectado, setMercadopagoConectado] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [procesando, setProcesando] = useState<'culqi' | 'mercadopago' | null>(null);
  const [mostrarYape, setMostrarYape] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reserva.idCancha || !reserva.cancha?.idLocal) return;
    const idLocal = reserva.cancha.idLocal;
    Promise.all([
      localesService.getConfigPagoPublica(idLocal),
      mercadoPagoOauthService.obtenerEstadoPublico(idLocal),
    ])
      .then(([configRes, mpRes]) => {
        setConfig(configRes.data);
        setMercadopagoConectado(mpRes.data.conectada);
      })
      .catch(() => setError('No se pudo cargar los métodos de pago de este local'))
      .finally(() => setIsLoading(false));
  }, [reserva]);

  const cargarScriptCulqi = () =>
    new Promise<void>((resolve, reject) => {
      if (window.Culqi) return resolve();
      const script = document.createElement('script');
      script.src = CULQI_SCRIPT_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Culqi'));
      document.body.appendChild(script);
    });

  const pagarConCulqi = async () => {
    if (!config?.culqiPublicKey) return;
    setError('');
    setProcesando('culqi');

    try {
      await cargarScriptCulqi();
      if (!window.Culqi) throw new Error('Culqi no disponible');

      window.Culqi.publicKey = config.culqiPublicKey;
      window.Culqi.init();
      window.Culqi.settings({
        title: reserva.cancha?.nombre || 'Reserva',
        currency: config.moneda || 'PEN',
        amount: Math.round(Number(reserva.montoTotal) * 100),
      });

      window.culqi = async () => {
        if (window.Culqi?.token) {
          try {
            await pagosService.pagarConCulqi(
              reserva.id,
              window.Culqi.token.id,
              usuario?.email,
            );
            window.Culqi?.close();
            onPagado();
          } catch (err) {
            setError(
              axios.isAxiosError(err)
                ? err.response?.data?.message || 'El pago fue rechazado'
                : 'Error al procesar el pago',
            );
          } finally {
            setProcesando(null);
          }
        } else if (window.Culqi?.error) {
          setError(window.Culqi.error.user_message || 'Error al generar el token de pago');
          setProcesando(null);
        }
      };

      window.Culqi.open();
    } catch {
      setError('No se pudo iniciar el pago con Culqi');
      setProcesando(null);
    }
  };

  const pagarConMercadoPago = async () => {
    setError('');
    setProcesando('mercadopago');
    try {
      const res = await pagosService.pagarConMercadoPago(reserva.id);
      window.location.href = res.data.initPoint;
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || 'No se pudo generar el pago'
          : 'Error inesperado',
      );
      setProcesando(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg border border-ink-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-ink-900">Pagar reserva</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="bg-ink-50 rounded-md p-3 mb-5 text-sm">
          <p className="text-ink-500">
            Monto a pagar:{' '}
            <span className="font-semibold text-ink-900">
              S/ {Number(reserva.montoTotal).toFixed(2)}
            </span>
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner text="Cargando métodos de pago..." />
          </div>
        ) : (
          <div className="space-y-2.5">
            {config?.culqiActivo && (
              <button
                onClick={pagarConCulqi}
                disabled={!!procesando}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
              >
                {procesando === 'culqi' ? <LoadingSpinner size="sm" /> : <CreditCard size={16} strokeWidth={1.75} />}
                Pagar con tarjeta
              </button>
            )}
            {mercadopagoConectado && (
              <button
                onClick={pagarConMercadoPago}
                disabled={!!procesando}
                className="w-full btn-secondary py-2.5 flex items-center justify-center gap-2"
              >
                {procesando === 'mercadopago' ? <LoadingSpinner size="sm" /> : <Landmark size={16} strokeWidth={1.75} />}
                Pagar con Mercado Pago
              </button>
            )}
            {config?.yapeActivo && config.yapeQrUrl && config.yapeTelefono && (
              <div>
                <button
                  onClick={() => setMostrarYape(!mostrarYape)}
                  className="w-full btn-secondary py-2.5 flex items-center justify-center gap-2"
                >
                  <QrCode size={16} strokeWidth={1.75} />
                  Pagar con Yape
                </button>

                {mostrarYape && (
                  <div className="mt-3 border border-ink-200 rounded-md p-3 text-center">
                    <img
                      src={urlImagen(config.yapeQrUrl)}
                      alt="Código QR de Yape"
                      className="w-40 h-40 mx-auto rounded-md border border-ink-100 object-contain"
                    />
                    <p className="text-sm text-ink-600 mt-2">{config.yapeTelefono}</p>
                    <p className="text-xs text-ink-400 mt-1">
                      Escanea el QR, paga desde tu app y envía tu comprobante por WhatsApp.
                    </p>
                    <a
                      href={construirEnlaceWhatsapp(config.yapeTelefono, construirMensajeComprobante(reserva))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} strokeWidth={1.75} />
                      Ya pagué, enviar comprobante
                    </a>
                  </div>
                )}
              </div>
            )}
            {config?.aceptaEfectivo && (
              <p className="text-center text-xs text-ink-400">
                También puedes pagar en efectivo al llegar al local.
              </p>
            )}
            {!config?.culqiActivo && !mercadopagoConectado && !config?.yapeActivo && (
              <p className="text-center text-sm text-ink-400 py-2">
                Este local aún no habilitó pagos en línea. Paga en efectivo al llegar.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <button onClick={onClose} className="w-full btn-ghost mt-4 justify-center flex">
          Cerrar
        </button>
      </div>
    </div>
  );
};
