import { create } from "zustand";
import { authService } from "@/lib/services/auth.service";
import type { User, LoginCredentials } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenRefreshInterval: NodeJS.Timeout | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginAdmin: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  startTokenRefresh: () => void;
  stopTokenRefresh: () => void;
  isAdmin: () => boolean;
  isCliente: () => boolean;
}

type AuthStore = AuthState & AuthActions;

/**
 * Store de autenticación con Zustand
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // Estado inicial
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tokenRefreshInterval: null,

  /**
   * Inicia sesión como cliente
   */
  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authService.login(credentials);

      if (response.success && response.user) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        

        // Iniciar refresh automático del token
        get().startTokenRefresh();
        
        // Verificar que el estado se actualizó correctamente
        const currentState = get();
      } else {
        throw new Error(response.message || "Error al iniciar sesión");
      }
    } catch (error: any) {
      console.error('❌ AuthStore: Error en login:', error.message);
      set({
        error: error.message || "Error al iniciar sesión",
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  /**
   * Inicia sesión como administrador
   */
  loginAdmin: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authService.loginAdmin(credentials);

      if (response.success && response.user) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        

        // Iniciar refresh automático del token
        get().startTokenRefresh();
        
        // Verificar que el estado se actualizó correctamente
        const currentState = get();
      } else {
        throw new Error(response.message || "Error al iniciar sesión como administrador");
      }
    } catch (error: any) {
      console.error('❌ AuthStore: Error en login admin:', error.message);
      set({
        error: error.message || "Error al iniciar sesión como administrador",
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  /**
   * Cierra sesión
   */
  logout: async () => {
    set({ isLoading: true });

    try {
      // Detener refresh del token
      get().stopTokenRefresh();
      
      await authService.logout();
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
      // Limpiar el estado local aunque falle el servidor
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  /**
   * Verifica si hay una sesión activa
   */
  checkAuth: () => {
    
    try {
      const isAuth = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      

      set({
        isAuthenticated: isAuth,
        user: user,
      });

      // Si hay sesión, iniciar refresh del token
      if (isAuth) {
        get().startTokenRefresh();
      } else {
        // Limpiar cualquier dato corrupto
        authService['clearAuth']();
      }
    } catch (error) {
      console.error('❌ AuthStore: Error en checkAuth, limpiando autenticación:', error);
      // Si hay error al verificar, limpiar todo
      authService['clearAuth']();
      set({
        isAuthenticated: false,
        user: null,
        error: null,
      });
    }
  },

  /**
   * Establece el usuario
   */
  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  /**
   * Establece un error
   */
  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Limpia el error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Inicia el refresh automático del token
   */
  startTokenRefresh: () => {
    // Detener el interval anterior si existe
    const currentInterval = get().tokenRefreshInterval;
    if (currentInterval) {
      clearInterval(currentInterval);
    }

    // Iniciar nuevo interval
    const intervalId = authService.startTokenRefreshInterval();
    set({ tokenRefreshInterval: intervalId });
  },

  /**
   * Detiene el refresh automático del token
   */
  stopTokenRefresh: () => {
    const intervalId = get().tokenRefreshInterval;
    if (intervalId) {
      authService.stopTokenRefreshInterval(intervalId);
      set({ tokenRefreshInterval: null });
    }
  },

  /**
   * Verifica si el usuario actual es admin
   */
  isAdmin: () => {
    const { user } = get();
    return user?.role === 'admin';
  },

  /**
   * Verifica si el usuario actual es cliente
   */
  isCliente: () => {
    const { user } = get();
    return user?.role === 'cliente';
  },
}));

/**
 * Hook para obtener el usuario actual
 */
export const useUser = () => useAuthStore((state) => state.user);

/**
 * Hook para verificar si está autenticado
 */
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);

/**
 * Hook para verificar si es admin
 */
export const useIsAdmin = () => {
  const user = useAuthStore((state) => state.user);
  return user?.role === "admin";
};

/**
 * Hook para verificar si es cliente
 */
export const useIsCliente = () => {
  const user = useAuthStore((state) => state.user);
  return user?.role === "cliente";
};
