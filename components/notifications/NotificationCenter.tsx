"use client";

import { useState } from "react";
import { useNotificationStore, NotificationType } from "@/lib/stores/notificationStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface NotificationCenterProps {
  compact?: boolean;
  maxItems?: number;
}

export function NotificationCenter({ compact = false, maxItems = 5 }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } =
    useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);

  // Mostrar solo las más recientes si es compacto
  const displayNotifications = compact ? notifications.slice(0, maxItems) : notifications;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "anomaly":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "anomaly":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  if (compact) {
    return (
      <div className="relative">
        {/* Botón de notificaciones */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        {/* Dropdown de notificaciones */}
        {isOpen && (
          <>
            {/* Overlay para cerrar */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel de notificaciones */}
            <div className="absolute right-0 top-full mt-2 w-96 z-50">
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>Notificaciones</span>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </CardTitle>
                    {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Marcar todas
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  {displayNotifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No hay notificaciones</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`border rounded-lg p-3 transition-all ${
                            getNotificationStyle(notification.type)
                          } ${notification.read ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.timestamp).toLocaleString("es-PE")}
                              </p>
                              {notification.actionUrl && (
                                <Link
                                  href={notification.actionUrl}
                                  className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                                  onClick={() => setIsOpen(false)}
                                >
                                  {notification.actionLabel || "Ver más"}
                                </Link>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              {!notification.read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                                  className="p-1 hover:bg-white rounded"
                                  title="Marcar como leída"
                                >
                                  <Eye className="h-3 w-3 text-gray-500" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDelete(notification.id, e)}
                                className="p-1 hover:bg-white rounded"
                                title="Eliminar"
                              >
                                <X className="h-3 w-3 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {notifications.length > maxItems && (
                    <div className="text-center mt-3 pt-3 border-t">
                      <Link
                        href="/admin/notificaciones"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => setIsOpen(false)}
                      >
                        Ver todas las notificaciones ({notifications.length})
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  }

  // Modo completo (página dedicada)
  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notificaciones</h2>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0
              ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? "es" : ""} sin leer`
              : "No tienes notificaciones pendientes"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
          {notifications.length > 0 && (
            <Button onClick={clearAll} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar todas
            </Button>
          )}
        </div>
      </div>

      {/* Lista de notificaciones */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-gray-500">No hay notificaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`${getNotificationStyle(notification.type)} ${
                notification.read ? "opacity-70" : "border-l-4"
              }`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                        {notification.metadata && (
                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            {notification.metadata.meterCode && (
                              <p>Medidor: {notification.metadata.meterCode}</p>
                            )}
                            {notification.metadata.value !== undefined && (
                              <p>Valor: {notification.metadata.value}</p>
                            )}
                            {notification.metadata.variance !== undefined && (
                              <p>Variación: {notification.metadata.variance.toFixed(1)}%</p>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-3">
                          {new Date(notification.timestamp).toLocaleString("es-PE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <Button
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={(e) => handleDelete(notification.id, e)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {notification.actionUrl && (
                      <div className="mt-3">
                        <Link
                          href={notification.actionUrl}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {notification.actionLabel || "Ver detalles"}
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
