import { create } from "zustand";
import type { Notification, NotificationType } from "@/types";
import { generateId } from "@/lib/utils";
import { APP_CONSTANTS } from "@/lib/config";

interface UIState {
  notifications: Notification[];
  isSidebarOpen: boolean;
  theme: "light" | "dark";
}

interface UIActions {
  addNotification: (
    type: NotificationType,
    title: string,
    message: string,
    duration?: number
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

type UIStore = UIState & UIActions;

/**
 * Store de UI (notificaciones, tema, sidebar, etc.) con Zustand
 */
export const useUIStore = create<UIStore>((set, get) => ({
  // Estado inicial
  notifications: [],
  isSidebarOpen: true,
  theme: "light",

  /**
   * Agrega una notificación
   */
  addNotification: (
    type: NotificationType,
    title: string,
    message: string,
    duration: number = APP_CONSTANTS.NOTIFICATION_DURATION
  ) => {
    const id = generateId();
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto-remover después del duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  /**
   * Remueve una notificación
   */
  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  /**
   * Limpia todas las notificaciones
   */
  clearNotifications: () => {
    set({ notifications: [] });
  },

  /**
   * Alterna el estado del sidebar
   */
  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  /**
   * Establece el estado del sidebar
   */
  setSidebarOpen: (isOpen: boolean) => {
    set({ isSidebarOpen: isOpen });
  },

  /**
   * Alterna el tema
   */
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      // Solo usar localStorage si está disponible (en el cliente)
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", newTheme);
      }
      return { theme: newTheme };
    });
  },

  /**
   * Establece el tema
   */
  setTheme: (theme: "light" | "dark") => {
    // Solo usar localStorage si está disponible (en el cliente)
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
    set({ theme });
  },
}));

/**
 * Hook para mostrar notificación de éxito
 */
export const useNotifySuccess = () => {
  const addNotification = useUIStore((state) => state.addNotification);
  return (title: string, message: string, duration?: number) =>
    addNotification("success", title, message, duration);
};

/**
 * Hook para mostrar notificación de error
 */
export const useNotifyError = () => {
  const addNotification = useUIStore((state) => state.addNotification);
  return (title: string, message: string, duration?: number) =>
    addNotification("error", title, message, duration);
};

/**
 * Hook para mostrar notificación de advertencia
 */
export const useNotifyWarning = () => {
  const addNotification = useUIStore((state) => state.addNotification);
  return (title: string, message: string, duration?: number) =>
    addNotification("warning", title, message, duration);
};

/**
 * Hook para mostrar notificación de información
 */
export const useNotifyInfo = () => {
  const addNotification = useUIStore((state) => state.addNotification);
  return (title: string, message: string, duration?: number) =>
    addNotification("info", title, message, duration);
};
