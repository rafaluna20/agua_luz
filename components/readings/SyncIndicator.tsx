"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  WifiOff,
  Wifi,
  Database,
  Upload,
  ArrowUp,
} from "lucide-react";

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  lastError: string | null;
  syncProgress: number; // 0-100
}

interface SyncIndicatorProps {
  status: SyncStatus;
  onSync?: () => void;
  compact?: boolean;
}

export function SyncIndicator({ status, onSync, compact = false }: SyncIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");

  // Actualizar "tiempo transcurrido"
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!status.lastSyncTime) {
        setTimeAgo("Nunca");
        return;
      }

      const now = new Date();
      const diff = now.getTime() - status.lastSyncTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        setTimeAgo(`Hace ${days} día${days > 1 ? "s" : ""}`);
      } else if (hours > 0) {
        setTimeAgo(`Hace ${hours} hora${hours > 1 ? "s" : ""}`);
      } else if (minutes > 0) {
        setTimeAgo(`Hace ${minutes} min`);
      } else {
        setTimeAgo("Ahora");
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Actualizar cada 30s

    return () => clearInterval(interval);
  }, [status.lastSyncTime]);

  // Determinar el estado principal
  const getStatusInfo = () => {
    if (!status.isOnline) {
      return {
        label: "Sin conexión",
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        icon: WifiOff,
      };
    }

    if (status.isSyncing) {
      return {
        label: "Sincronizando...",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        icon: RefreshCw,
      };
    }

    if (status.failedCount > 0) {
      return {
        label: "Error en sincronización",
        color: "text-red-600",
        bgColor: "bg-red-50",
        icon: AlertCircle,
      };
    }

    if (status.pendingCount > 0) {
      return {
        label: `${status.pendingCount} pendiente${status.pendingCount > 1 ? "s" : ""}`,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        icon: Clock,
      };
    }

    return {
      label: "Sincronizado",
      color: "text-green-600",
      bgColor: "bg-green-50",
      icon: CheckCircle2,
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Modo compacto (barra superior)
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {/* Estado de conexión */}
        <Badge variant={status.isOnline ? "default" : "destructive"} className="flex items-center space-x-1">
          {status.isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span>{status.isOnline ? "Online" : "Offline"}</span>
        </Badge>

        {/* Lecturas pendientes */}
        {status.pendingCount > 0 && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Database className="h-3 w-3" />
            <span>{status.pendingCount} pendientes</span>
          </Badge>
        )}

        {/* Estado de sincronización */}
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${statusInfo.bgColor}`}>
          <StatusIcon
            className={`h-3 w-3 ${statusInfo.color} ${status.isSyncing ? "animate-spin" : ""}`}
          />
          <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>

        {/* Botón de sincronización */}
        {status.isOnline && status.pendingCount > 0 && onSync && (
          <Button
            onClick={onSync}
            disabled={status.isSyncing}
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${status.isSyncing ? "animate-spin" : ""}`} />
            <span>Sincronizar</span>
          </Button>
        )}
      </div>
    );
  }

  // Modo completo (card)
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header con estado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                <StatusIcon
                  className={`h-5 w-5 ${statusInfo.color} ${status.isSyncing ? "animate-spin" : ""}`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{statusInfo.label}</h3>
                <p className="text-xs text-gray-500">
                  {status.isOnline ? `Última sincronización: ${timeAgo}` : "Modo offline activo"}
                </p>
              </div>
            </div>

            {/* Botón de sincronización */}
            {status.isOnline && onSync && (
              <Button
                onClick={onSync}
                disabled={status.isSyncing || status.pendingCount === 0}
                size="sm"
                variant={status.pendingCount > 0 ? "default" : "outline"}
              >
                {status.isSyncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Sincronizar
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Barra de progreso */}
          {status.isSyncing && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Progreso</span>
                <span className="font-medium text-blue-600">{status.syncProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${status.syncProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-3">
            {/* Pendientes */}
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-xs text-gray-500">Pendientes</span>
              </div>
              <p className="text-lg font-bold text-yellow-600">{status.pendingCount}</p>
            </div>

            {/* Sincronizadas */}
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-500">Sincronizadas</span>
              </div>
              <p className="text-lg font-bold text-green-600">{status.syncedCount}</p>
            </div>

            {/* Fallidas */}
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs text-gray-500">Fallidas</span>
              </div>
              <p className="text-lg font-bold text-red-600">{status.failedCount}</p>
            </div>
          </div>

          {/* Mensaje de error */}
          {status.lastError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-red-900">Último error:</p>
                  <p className="text-xs text-red-700 mt-1">{status.lastError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Modo offline notice */}
          {!status.isOnline && status.pendingCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <WifiOff className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-900">Modo offline activado</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Las lecturas se sincronizarán automáticamente cuando haya conexión a internet
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success notice */}
          {status.isOnline && status.pendingCount === 0 && status.syncedCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-green-900">Todo sincronizado</p>
                  <p className="text-xs text-green-700 mt-1">
                    Todas las lecturas han sido enviadas exitosamente al servidor
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook para gestionar el estado de sincronización
 */
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    syncedCount: 0,
    failedCount: 0,
    lastError: null,
    syncProgress: 0,
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updateStatus = useCallback((updates: Partial<SyncStatus>) => {
    setStatus((prev) => ({ ...prev, ...updates }));
  }, []);

  return { status, updateStatus };
}
