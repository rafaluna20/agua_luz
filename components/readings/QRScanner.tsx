"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/Button";
import { X, Camera, AlertCircle } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);

  useEffect(() => {
    // Obtener lista de cámaras disponibles
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
        }
      })
      .catch((err) => {
        console.error("Error obteniendo cámaras:", err);
        setError("No se pudo acceder a la cámara. Verifica los permisos.");
      });
  }, []);

  const startScanner = async () => {
    try {
      setError(null);
      setScanning(true);

      // Crear instancia del escáner
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      // Configuración del escáner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      };

      // Determinar qué cámara usar (preferir la trasera en móviles)
      const cameraId = cameras.length > 0 ? cameras[cameras.length - 1].id : { facingMode: "environment" };

      // Iniciar el escáner
      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          // QR detectado exitosamente
          console.log("QR escaneado:", decodedText);
          onScanSuccess(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Error de escaneo (normal mientras busca QR)
          // No mostrar estos errores al usuario
        }
      );
    } catch (err: any) {
      console.error("Error iniciando escáner:", err);
      setError(err.message || "Error al iniciar el escáner");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      setScanning(false);
    } catch (err) {
      console.error("Error deteniendo escáner:", err);
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  useEffect(() => {
    // Limpiar al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Escanear Código QR</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Visor de cámara */}
          <div className="relative">
            <div
              id="qr-reader"
              className="rounded-lg overflow-hidden border-2 border-gray-200"
              style={{ minHeight: scanning ? "auto" : "300px" }}
            />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center p-6">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    Presiona el botón para activar la cámara
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900 font-medium mb-1">Instrucciones:</p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Coloca el código QR dentro del cuadro</li>
              <li>Mantén el dispositivo estable</li>
              <li>Asegúrate de tener buena iluminación</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            {!scanning ? (
              <Button onClick={startScanner} className="flex-1" disabled={cameras.length === 0}>
                <Camera className="h-4 w-4 mr-2" />
                Activar Cámara
              </Button>
            ) : (
              <Button onClick={stopScanner} variant="destructive" className="flex-1">
                Detener Escáner
              </Button>
            )}
            <Button onClick={handleClose} variant="outline">
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
