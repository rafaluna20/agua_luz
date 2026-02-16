import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "info" | "success" | "warning" | "error" | "anomaly";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    readingId?: string;
    meterId?: number;
    meterCode?: string;
    value?: number;
    expectedValue?: number;
    variance?: number;
  };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      /**
       * Agrega una nueva notificación
       */
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        // Auto-eliminar notificaciones info/success después de 7 días
        if (notification.type === "info" || notification.type === "success") {
          setTimeout(() => {
            const { notifications } = get();
            const exists = notifications.find((n) => n.id === newNotification.id);
            if (exists && exists.read) {
              get().deleteNotification(newNotification.id);
            }
          }, 7 * 24 * 60 * 60 * 1000); // 7 días
        }
      },

      /**
       * Marca una notificación como leída
       */
      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.read) {
            return state;
          }

          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      /**
       * Marca todas las notificaciones como leídas
       */
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      /**
       * Elimina una notificación
       */
      deleteNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      /**
       * Limpia todas las notificaciones
       */
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      /**
       * Obtiene el conteo de notificaciones no leídas
       */
      getUnreadCount: () => {
        return get().unreadCount;
      },
    }),
    {
      name: "notifications-storage",
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

/**
 * Funciones helper para crear notificaciones específicas
 */

export const NotificationHelpers = {
  /**
   * Notificación de lectura anómala
   */
  anomalousReading: (
    meterCode: string,
    meterId: number,
    value: number,
    expectedValue: number,
    variance: number
  ) => {
    const { addNotification } = useNotificationStore.getState();
    
    addNotification({
      type: "anomaly",
      title: "⚠️ Lectura Anómala Detectada",
      message: `El medidor ${meterCode} tiene un consumo ${variance > 0 ? "superior" : "inferior"} al esperado (${Math.abs(variance).toFixed(1)}% de variación)`,
      actionUrl: `/admin/lecturas/${meterId}`,
      actionLabel: "Ver detalles",
      metadata: {
        meterId,
        meterCode,
        value,
        expectedValue,
        variance,
      },
    });
  },

  /**
   * Notificación de sincronización exitosa
   */
  syncSuccess: (count: number) => {
    const { addNotification } = useNotificationStore.getState();
    
    addNotification({
      type: "success",
      title: "✓ Sincronización Exitosa",
      message: `Se sincronizaron ${count} lectura${count > 1 ? "s" : ""} correctamente`,
    });
  },

  /**
   * Notificación de error de sincronización
   */
  syncError: (error: string) => {
    const { addNotification } = useNotificationStore.getState();
    
    addNotification({
      type: "error",
      title: "❌ Error en Sincronización",
      message: error || "No se pudieron sincronizar las lecturas. Intenta nuevamente.",
      actionLabel: "Reintentar",
    });
  },

  /**
   * Notificación de modo offline
   */
  offlineMode: () => {
    const { addNotification } = useNotificationStore.getState();
    
    addNotification({
      type: "warning",
      title: "📡 Modo Offline Activado",
      message: "Sin conexión a internet. Las lecturas se sincronizarán automáticamente cuando recuperes la conexión.",
    });
  },

  /**
   * Notificación de reconexión
   */
  backOnline: () => {
    const { addNotification } = useNotificationStore.getState();
    
    addNotification({
      type: "info",
      title: "🌐 Conexión Recuperada",
      message: "Conectado a internet. Sincronizando lecturas pendientes...",
    });
  },

  /**
   * Notificación de lectura guardada
   */
  readingSaved: (meterCode: string) => {
    const { addNotification } = useNotificationStore.getState();
    
    addNotification({
      type: "success",
      title: "✓ Lectura Guardada",
      message: `Lectura del medidor ${meterCode} guardada correctamente`,
    });
  },

  /**
   * Notificación de validación requerida
   */
  validationRequired: (count: number) => {
    const { addNotification } = useNotificationStore.getState();
    
    addNotification({
      type: "warning",
      title: "⚠️ Lecturas Pendientes de Validación",
      message: `Hay ${count} lectura${count > 1 ? "s" : ""} que requiere${count > 1 ? "n" : ""} revisión del supervisor`,
      actionUrl: "/admin/lecturas/pendientes",
      actionLabel: "Revisar",
    });
  },

  /**
   * Notificación de cuota diaria alcanzada
   */
  dailyQuotaReached: (quota: number) => {
    const { addNotification } = useNotificationStore.getState();
    
    addNotification({
      type: "info",
      title: "🎯 Meta del Día Cumplida",
      message: `¡Excelente trabajo! Has registrado ${quota} lecturas hoy.`,
    });
  },
};
