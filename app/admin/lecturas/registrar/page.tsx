"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuthStore } from "@/lib/stores/authStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PredictiveValidation } from "@/components/readings/PredictiveValidation";
import { SyncIndicator, useSyncStatus } from "@/components/readings/SyncIndicator";
import { QRScanner } from "@/components/readings/QRScanner";
import { NotificationHelpers } from "@/lib/stores/notificationStore";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import {
  Camera,
  MapPin,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  QrCode,
  ArrowLeft,
  Send,
  Database,
  Trash2,
} from "lucide-react";
import { readingsService } from "@/lib/services/readings.service";
import { Reading } from "@/types/readings";

interface MeterInfo {
  id: number;
  code: string;
  qr_code: string;
  service_type: string;
  customer_name: string;
  location: string;
  latitude: number;
  longitude: number;
  last_reading_value: number;
  last_reading_date: string | null;
}

interface ValidationAlert {
  type: "success" | "warning" | "error";
  message: string;
}

export default function RegistrarLecturaPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();

  // Estado de sincronización
  const { status: syncStatus, updateStatus: updateSyncStatus } = useSyncStatus();

  // Estado del medidor
  const [meterCode, setMeterCode] = useState("");
  const [meterInfo, setMeterInfo] = useState<MeterInfo | null>(null);
  const [loadingMeter, setLoadingMeter] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // Estado para autocompletado
  const [meterSuggestions, setMeterSuggestions] = useState<MeterInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Estado de la lectura
  const [readingValue, setReadingValue] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Estado de geolocalización
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Validación
  const [validationAlert, setValidationAlert] = useState<ValidationAlert | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lecturas pendientes
  const [pendingReadings, setPendingReadings] = useState<Reading[]>([]);

  // Verificar autenticación y permisos
  useEffect(() => {
    if (!user || !isAdmin()) {
      router.push("/login-admin");
    }
  }, [user, isAdmin, router]);

  // Actualizar contador de pendientes cuando cambia
  useEffect(() => {
    updateSyncStatus({ pendingCount: pendingReadings.length });
  }, [pendingReadings, updateSyncStatus]);

  // Obtener geolocalización
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationAccuracy(position.coords.accuracy);
          setLocationError(null);
        },
        (error) => {
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError("Geolocalización no disponible");
    }
  }, []);

  // Cargar lecturas pendientes
  useEffect(() => {
    loadPendingReadings();
  }, []);

  // Autocompletado: buscar medidores mientras escribe (con debounce)
  useEffect(() => {
    const searchMeters = async () => {
      if (meterCode.length < 2) {
        setMeterSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const token = Cookies.get("access_token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/portal/meters?search=${encodeURIComponent(meterCode)}&limit=5`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data.meters.length > 0) {
          setMeterSuggestions(data.data.meters);
          setShowSuggestions(true);
        } else {
          setMeterSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Error buscando sugerencias:", error);
        setMeterSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    // Debounce de 300ms
    const timeoutId = setTimeout(() => {
      searchMeters();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [meterCode]);

  const loadPendingReadings = async () => {
    try {
      const readings = await readingsService.getPendingReadings();
      setPendingReadings(readings);
      updateSyncStatus({ pendingCount: readings.length });
    } catch (error) {
      console.error("Error cargando lecturas pendientes:", error);
    }
  };

  // Seleccionar un medidor de las sugerencias
  const handleSelectMeter = (meter: MeterInfo) => {
    setMeterInfo(meter);
    setMeterCode(meter.code);
    setShowSuggestions(false);
    setMeterSuggestions([]);
  };

  // Buscar medidor por código
  const handleSearchMeter = async () => {
    if (!meterCode.trim()) {
      return;
    }

    setLoadingMeter(true);
    setMeterInfo(null);
    setValidationAlert(null);

    try {
      // Buscar en el backend
      const token = Cookies.get("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/meters?search=${encodeURIComponent(meterCode)}&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success && data.data.meters.length > 0) {
        setMeterInfo(data.data.meters[0]);
      } else {
        setValidationAlert({
          type: "error",
          message: "Medidor no encontrado. Verifica el código.",
        });
      }
    } catch (error) {
      console.error("Error buscando medidor:", error);
      setValidationAlert({
        type: "error",
        message: "Error al buscar medidor. Intenta nuevamente.",
      });
    } finally {
      setLoadingMeter(false);
    }
  };

  // Manejar QR escaneado exitosamente
  const handleQRScanned = (decodedText: string) => {
    console.log("QR escaneado:", decodedText);
    setMeterCode(decodedText);
    setShowQRScanner(false);
    // Buscar automáticamente el medidor
    setTimeout(() => {
      handleSearchMeter();
    }, 100);
  };

  // Validar lectura en tiempo real
  useEffect(() => {
    if (!meterInfo || !readingValue) {
      setValidationAlert(null);
      return;
    }

    const value = parseFloat(readingValue);
    if (isNaN(value)) {
      setValidationAlert({
        type: "error",
        message: "Valor inválido. Ingresa un número.",
      });
      return;
    }

    // Validar contra última lectura
    if (meterInfo.last_reading_value) {
      const consumption = value - meterInfo.last_reading_value;

      if (consumption < 0) {
        setValidationAlert({
          type: "error",
          message: `⚠️ Valor menor a la última lectura (${meterInfo.last_reading_value}). Verifica el número.`,
        });
      } else if (consumption === 0) {
        setValidationAlert({
          type: "warning",
          message: "Consumo cero. Verifica que el medidor esté funcionando.",
        });
      } else if (consumption > meterInfo.last_reading_value * 0.5) {
        // Consumo > 50% del valor anterior
        setValidationAlert({
          type: "warning",
          message: `⚠️ Consumo muy alto (${consumption.toFixed(2)}). Esta lectura requerirá revisión.`,
        });
      } else {
        setValidationAlert({
          type: "success",
          message: `✓ Consumo normal: ${consumption.toFixed(2)} unidades`,
        });
      }
    } else {
      setValidationAlert({
        type: "success",
        message: "Primera lectura del medidor",
      });
    }
  }, [readingValue, meterInfo]);

  // Manejar captura de foto
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Enviar lectura
  const handleSubmitReading = async () => {
    if (!meterInfo || !readingValue || !location) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convertir foto a base64 si existe
      let photoBase64: string | undefined;
      if (photo) {
        const reader = new FileReader();
        photoBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
          reader.readAsDataURL(photo);
        });
      }

      // Crear lectura usando el servicio
      await readingsService.createReading({
        meter_id: meterInfo.id,
        meter_code: meterInfo.code,
        value: parseFloat(readingValue),
        operator_id: user?.id || 0,
        operator_name: user?.name || "",
        latitude: location.latitude,
        longitude: location.longitude,
        notes: notes || undefined,
        photo_base64: photoBase64,
        photo_filename: photo ? `medidor_${meterInfo.code}_${Date.now()}.jpg` : undefined,
      });

      // Limpiar formulario
      setMeterCode("");
      setMeterInfo(null);
      setReadingValue("");
      setNotes("");
      setPhoto(null);
      setPhotoPreview(null);
      setValidationAlert({
        type: "success",
        message: "✓ Lectura registrada exitosamente",
      });

      // Recargar lecturas pendientes
      await loadPendingReadings();

      // Notificación de lectura guardada
      NotificationHelpers.readingSaved(meterInfo.code);

      // Limpiar alerta después de 3 segundos
      setTimeout(() => setValidationAlert(null), 3000);
    } catch (error) {
      console.error("Error registrando lectura:", error);
      setValidationAlert({
        type: "error",
        message: "Error al registrar lectura. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sincronizar lecturas pendientes
  const handleSyncNow = async () => {
    if (!syncStatus.isOnline) {
      setValidationAlert({
        type: "error",
        message: "Sin conexión a internet. La sincronización se realizará automáticamente cuando estés online.",
      });
      return;
    }

    updateSyncStatus({ isSyncing: true, syncProgress: 0 });

    try {
      // Simular progreso
      updateSyncStatus({ syncProgress: 30 });
      
      const result = await readingsService.syncNow();

      updateSyncStatus({
        syncProgress: 100,
        syncedCount: syncStatus.syncedCount + (result.syncedCount || 0),
        lastSyncTime: new Date(),
        lastError: null,
      });

      // Notificación de sincronización exitosa
      NotificationHelpers.syncSuccess(result.syncedCount || 0);

      setValidationAlert({
        type: "success",
        message: `✓ Sincronizadas ${result.syncedCount || 0} lecturas exitosamente`,
      });

      await loadPendingReadings();

      setTimeout(() => setValidationAlert(null), 3000);
    } catch (error) {
      console.error("Error sincronizando:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      
      updateSyncStatus({
        failedCount: syncStatus.failedCount + 1,
        lastError: errorMessage,
      });

      // Notificación de error
      NotificationHelpers.syncError(errorMessage);

      setValidationAlert({
        type: "error",
        message: "Error en la sincronización. Intenta nuevamente.",
      });
    } finally {
      updateSyncStatus({ isSyncing: false, syncProgress: 0 });
    }
  };

  // Eliminar lectura pendiente
  const handleDeletePendingReading = async (localId: string) => {
    try {
      await readingsService.deleteReading(localId);
      await loadPendingReadings();
    } catch (error) {
      console.error("Error eliminando lectura:", error);
    }
  };

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Registrar Lectura</h1>
            <p className="text-sm text-gray-500">
              Operario: {user.name} | {syncStatus.isOnline ? "En línea" : "Sin conexión"}
            </p>
          </div>
        </div>

        {/* Indicadores de estado */}
        {/* Indicador de sincronización y notificaciones */}
        <div className="flex items-center space-x-2">
          <NotificationCenter compact={true} maxItems={5} />
          <SyncIndicator
            status={syncStatus}
            onSync={handleSyncNow}
            compact={true}
          />
        </div>
      </div>

      {/* Alerta de validación */}
      {validationAlert && (
        <Alert
          className={`mb-4 ${
            validationAlert.type === "success"
              ? "bg-green-50 border-green-200"
              : validationAlert.type === "warning"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          {validationAlert.type === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          {validationAlert.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
          {validationAlert.type === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
          <AlertDescription>{validationAlert.message}</AlertDescription>
        </Alert>
      )}

      {/* Formulario principal */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Datos del Medidor</span>
          </CardTitle>
          <CardDescription>Escanea el código QR o ingresa el código manualmente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buscar medidor con autocompletado */}
          <div className="space-y-2">
            <Label htmlFor="meterCode">Código del Medidor</Label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  id="meterCode"
                  value={meterCode}
                  onChange={(e) => {
                    setMeterCode(e.target.value);
                    setMeterInfo(null); // Limpiar selección anterior
                  }}
                  onFocus={() => {
                    if (meterSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Retrasar el cierre para permitir clic en sugerencias
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Escribe para buscar medidor..."
                  onKeyPress={(e) => e.key === "Enter" && handleSearchMeter()}
                  disabled={loadingMeter}
                />
                
                {/* Indicador de carga en el input */}
                {loadingSuggestions && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}

                {/* Lista de sugerencias */}
                {showSuggestions && meterSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {meterSuggestions.map((meter) => (
                      <div
                        key={meter.id}
                        onClick={() => handleSelectMeter(meter)}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-900">
                              {meter.code}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {meter.customer_name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              📍 {meter.location}
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {meter.service_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => setShowQRScanner(true)}
                variant="outline"
                className="flex-shrink-0"
                disabled={loadingMeter}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Escanear QR
              </Button>
              <Button
                onClick={handleSearchMeter}
                disabled={loadingMeter || !meterCode.trim()}
                className="flex-shrink-0"
              >
                {loadingMeter ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>
            
            {/* Mensaje helper */}
            <p className="text-xs text-gray-500">
              Escribe al menos 2 caracteres para ver sugerencias
            </p>
          </div>

          {/* Información del medidor */}
          {meterInfo && (
            <div className="border rounded-lg p-4 bg-blue-50 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold">Código:</span> {meterInfo.code}
                </div>
                <div>
                  <span className="font-semibold">Tipo:</span>{" "}
                  <Badge variant="outline">{meterInfo.service_type}</Badge>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Cliente:</span> {meterInfo.customer_name}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Ubicación:</span> {meterInfo.location}
                </div>
                <div>
                  <span className="font-semibold">Última lectura:</span>{" "}
                  {meterInfo.last_reading_value || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Fecha:</span>{" "}
                  {meterInfo.last_reading_date
                    ? new Date(meterInfo.last_reading_date).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>
          )}

          {/* Lectura actual */}
          {meterInfo && (
            <>
              <div>
                <Label htmlFor="readingValue">Valor de la Lectura *</Label>
                <Input
                  id="readingValue"
                  type="number"
                  step="0.01"
                  value={readingValue}
                  onChange={(e) => setReadingValue(e.target.value)}
                  placeholder="Ingresa el valor del medidor"
                  className="text-lg font-semibold"
                />
              </div>

              {/* Validación predictiva */}
              {readingValue && (
                <PredictiveValidation
                  currentValue={parseFloat(readingValue)}
                  meterHistory={{
                    last_reading_value: meterInfo.last_reading_value,
                    last_reading_date: meterInfo.last_reading_date,
                    average_consumption: meterInfo.last_reading_value * 0.1, // Estimación: 10% del valor
                    consumption_trend: "stable",
                  }}
                  onValidationChange={(result) => {
                    // Actualizar estado de validación
                    if (!result.isValid) {
                      setValidationAlert({
                        type: result.level === "critical" ? "error" : "warning",
                        message: result.messages.join(" - "),
                      });
                      
                      // Notificación de lectura anómala
                      if (result.level === "critical") {
                        NotificationHelpers.anomalousReading(
                          meterInfo.code,
                          meterInfo.id,
                          parseFloat(readingValue),
                          result.expectedConsumption,
                          result.variance
                        );
                      }
                    } else if (result.level === "warning") {
                      setValidationAlert({
                        type: "warning",
                        message: result.messages.join(" - "),
                      });
                    } else {
                      setValidationAlert({
                        type: "success",
                        message: result.messages[0],
                      });
                    }
                  }}
                />
              )}

              {/* Notas */}
              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                  placeholder="Agrega cualquier observación..."
                  rows={3}
                />
              </div>

              {/* Captura de foto */}
              <div>
                <Label htmlFor="photo">Foto del Medidor (opcional)</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("photo")?.click()}
                    className="flex items-center space-x-2"
                  >
                    <Camera className="h-4 w-4" />
                    <span>{photo ? "Cambiar foto" : "Tomar foto"}</span>
                  </Button>
                  {photo && <span className="text-sm text-green-600">✓ Foto capturada</span>}
                </div>
                {photoPreview && (
                  <div className="mt-2">
                    <img src={photoPreview} alt="Preview" className="max-w-xs rounded-lg border" />
                  </div>
                )}
              </div>

              {/* GPS */}
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span className="font-semibold">Geolocalización:</span>
                  {location ? (
                    <span className="text-green-600">
                      ✓ {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      {locationAccuracy && ` (±${locationAccuracy.toFixed(0)}m)`}
                    </span>
                  ) : locationError ? (
                    <span className="text-red-600">✗ {locationError}</span>
                  ) : (
                    <span className="text-gray-500">Obteniendo ubicación...</span>
                  )}
                </div>
              </div>

              {/* Botón de envío */}
              <Button
                onClick={handleSubmitReading}
                disabled={
                  isSubmitting || !readingValue || !location || validationAlert?.type === "error"
                }
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Registrar Lectura
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lecturas pendientes de sincronización */}
      {pendingReadings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Lecturas Pendientes de Sincronización</span>
            </CardTitle>
            <CardDescription>
              Estas lecturas se sincronizarán automáticamente cuando haya conexión a internet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingReadings.map((reading) => (
                <div
                  key={reading.local_id}
                  className="flex items-center justify-between border rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-semibold">Medidor ID: {reading.meter_id}</div>
                    <div className="text-sm text-gray-600">
                      Valor: {reading.value} | {new Date(reading.reading_date).toLocaleString()}
                    </div>
                    {reading.validation_status === "anomaly" && (
                      <Badge variant="destructive" className="mt-1">
                        Requiere revisión
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePendingReading(reading.local_id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de escáner QR */}
      {showQRScanner && (
        <QRScanner
          onScanSuccess={handleQRScanned}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}
