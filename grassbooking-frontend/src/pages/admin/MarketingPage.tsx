import { useEffect, useState } from 'react';
import { Tag, Wallet, Eye, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useDelayedLoading } from '../../hooks/useDelayedLoading';
import { localesService } from '../../services/locales.service';
import { useAuth } from '../../hooks/useAuth';

export const MarketingPage = () => {
  const { usuario } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const showSpinner = useDelayedLoading(isLoading);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [descuentoPct, setDescuentoPct] = useState(0);
  const [adelantoPct, setAdelantoPct] = useState(100);

  // Ejemplo de precio para el preview
  const precioEjemplo = 50;

  useEffect(() => {
    if (!usuario?.idLocal) {
      setIsLoading(false);
      return;
    }
    localesService
      .getMiConfigPago()
      .then((res) => {
        setDescuentoPct(res.data.descuentoPct ?? 0);
        setAdelantoPct(res.data.adelantoPct ?? 100);
      })
      .catch(() => setError('No se pudo cargar la configuración'))
      .finally(() => setIsLoading(false));
  }, [usuario?.idLocal]);

  const handleGuardar = async () => {
    setIsSaving(true);
    setError('');
    setSaved(false);
    try {
      await localesService.actualizarMiConfigPago({ descuentoPct, adelantoPct });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  // Calcular valores del preview
  const montoConDescuento = Number((precioEjemplo * (1 - descuentoPct / 100)).toFixed(2));
  const montoAdelanto = Number((montoConDescuento * adelantoPct / 100).toFixed(2));
  const montoPendiente = Number((montoConDescuento - montoAdelanto).toFixed(2));

  return (
    <main className="p-6 max-w-3xl">
            <h1 className="text-xl font-semibold text-ink-900 mb-1">Marketing</h1>
            <p className="text-sm text-ink-500 mb-6">
              Configura descuentos y cómo quieres que tus clientes paguen al reservar.
            </p>

            {!usuario?.idLocal ? (
              <div className="card text-center py-10">
                <p className="text-ink-500 text-sm">Aún no tienes un local asignado.</p>
              </div>
            ) : showSpinner ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" text="Cargando configuración..." />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Descuento */}
                <div className="card">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-md bg-green-100 text-green-700">
                      <Tag size={16} strokeWidth={1.75} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-ink-900">Descuento automático</h2>
                      <p className="text-xs text-ink-400">Se aplica sobre el precio de cada cancha</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-700">Porcentaje de descuento</span>
                      <span className="text-lg font-bold text-green-700 w-14 text-right">
                        {descuentoPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={1}
                      value={descuentoPct}
                      onChange={(e) => setDescuentoPct(Number(e.target.value))}
                      className="w-full accent-green-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-ink-400">
                      <span>Sin descuento</span>
                      <span>50% descuento</span>
                    </div>
                    <p className="text-xs text-ink-400">
                      {descuentoPct === 0
                        ? 'Los usuarios verán el precio original de la cancha.'
                        : `Los usuarios verán el precio con ${descuentoPct}% de descuento. Ideal para promociones por temporada o fidelización.`}
                    </p>
                  </div>
                </div>

                {/* Adelanto */}
                <div className="card">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-100 text-blue-700">
                      <Wallet size={16} strokeWidth={1.75} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-ink-900">Adelanto de reserva</h2>
                      <p className="text-xs text-ink-400">Porcentaje que el cliente paga al momento de reservar</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-700">Porcentaje de adelanto</span>
                      <span className="text-lg font-bold text-blue-700 w-14 text-right">
                        {adelantoPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={adelantoPct}
                      onChange={(e) => setAdelantoPct(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-ink-400">
                      <span>Todo al llegar (0%)</span>
                      <span>Pago completo (100%)</span>
                    </div>
                    <p className="text-xs text-ink-400">
                      {adelantoPct === 0
                        ? 'Los clientes no pagan nada al reservar. Pagan todo en el local.'
                        : adelantoPct === 100
                        ? 'Los clientes pagan el monto completo al reservar (en línea o en efectivo).'
                        : `Los clientes pagan el ${adelantoPct}% al reservar y el resto al llegar al local.`}
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="card border-dashed">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-md bg-ink-100 text-ink-500">
                      <Eye size={16} strokeWidth={1.75} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-ink-900">Vista previa</h2>
                      <p className="text-xs text-ink-400">Así verán los usuarios el precio (ejemplo: S/ {precioEjemplo})</p>
                    </div>
                  </div>

                  <div className="bg-ink-50 rounded-md p-4 space-y-1.5 text-sm">
                    {descuentoPct > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-ink-400">Precio base</span>
                          <span className="text-ink-400 line-through">S/ {precioEjemplo.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 font-medium flex items-center gap-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">
                              -{descuentoPct}%
                            </span>
                            Descuento
                          </span>
                          <span className="text-green-700 font-medium">
                            -S/ {(precioEjemplo - montoConDescuento).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-medium">
                      <span className="text-ink-700">Total a pagar</span>
                      <span className="text-ink-900 font-semibold">S/ {montoConDescuento.toFixed(2)}</span>
                    </div>

                    {adelantoPct > 0 && adelantoPct < 100 && (
                      <div className="border-t border-ink-200 pt-2 mt-1 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-ink-600">Pagas ahora ({adelantoPct}%)</span>
                          <span className="text-ink-900 font-semibold">S/ {montoAdelanto.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-400">Al llegar al local</span>
                          <span className="text-ink-400">S/ {montoPendiente.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {adelantoPct === 0 && (
                      <div className="border-t border-ink-200 pt-2 mt-1">
                        <div className="flex justify-between">
                          <span className="text-ink-500">Pago</span>
                          <span className="text-ink-700 font-medium">Al llegar al local</span>
                        </div>
                      </div>
                    )}

                    {adelantoPct === 100 && (
                      <div className="border-t border-ink-200 pt-2 mt-1">
                        <div className="flex justify-between">
                          <span className="text-ink-500">Pago</span>
                          <span className="text-ink-700">En línea o al llegar</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

                {saved && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-md">
                    <CheckCircle size={16} strokeWidth={1.75} />
                    Configuración guardada correctamente
                  </div>
                )}

                <button
                  onClick={handleGuardar}
                  disabled={isSaving}
                  className="btn-primary py-2.5 px-6"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" /> Guardando...
                    </span>
                  ) : (
                    'Guardar configuración'
                  )}
                </button>
              </div>
            )}
    </main>
  );
};
