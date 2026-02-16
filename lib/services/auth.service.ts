import Cookies from "js-cookie";
import { apiClient } from "./api";
import { API_ENDPOINTS, APP_CONSTANTS, config } from "@/lib/config";
import type { LoginCredentials, AuthResponse, User, TokenPayload } from "@/types";

/**
 * Servicio de autenticación
 */
class AuthService {
  /**
   * Inicia sesión (cliente o admin)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      // DEBUG: Ver qué está recibiendo del servidor
      console.log('🔍 Respuesta del servidor:', response);

      // Respuesta de Odoo: { success: true, data: { access_token, refresh_token, customer } }
      if (response.success && response.data) {
        const { access_token, refresh_token, customer } = response.data;
        
        console.log('✅ Tokens recibidos:', { access_token: access_token ? 'presente' : 'ausente', refresh_token: refresh_token ? 'presente' : 'ausente' });
        console.log('✅ Customer recibido:', customer);
        
        if (access_token && refresh_token && customer) {
          this.setTokens(access_token, refresh_token);
          console.log('💾 Tokens guardados en cookies');
          
          // Transformar customer de Odoo a User
          const user: User = {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone || '',
            role: 'cliente', // Los clientes siempre son 'cliente'
          };
          
          this.setUser(user);
          console.log('💾 Usuario guardado en localStorage:', user);
          
          return {
            success: true,
            access_token,
            refresh_token,
            user,
          };
        } else {
          console.error('❌ Faltan datos en la respuesta:', { access_token, refresh_token, customer });
        }
      } else {
        console.error('❌ Estructura de respuesta inválida:', response);
      }

      throw new Error("Respuesta inválida del servidor");
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      throw new Error(error.message || "Error al iniciar sesión");
    }
  }

  /**
   * Login de administrador
   */
  async loginAdmin(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.AUTH.LOGIN_ADMIN,
        credentials
      );

      console.log('🔍 Respuesta del servidor (admin):', response);

      if (response.success && response.data) {
        const { access_token, refresh_token, user } = response.data;
        
        console.log('✅ Tokens admin recibidos:', { access_token: access_token ? 'presente' : 'ausente', refresh_token: refresh_token ? 'presente' : 'ausente' });
        console.log('✅ Usuario admin recibido:', user);
        
        if (access_token && refresh_token && user) {
          this.setTokens(access_token, refresh_token);
          console.log('💾 Tokens admin guardados en cookies');
          
          // Usuario admin ya viene con role: 'admin' desde Odoo
          const adminUser: User = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: '',
            role: 'admin',
          };
          
          this.setUser(adminUser);
          console.log('💾 Usuario admin guardado en localStorage:', adminUser);
          
          return {
            success: true,
            access_token,
            refresh_token,
            user: adminUser,
          };
        } else {
          console.error('❌ Faltan datos en la respuesta admin:', { access_token, refresh_token, user });
        }
      } else {
        console.error('❌ Estructura de respuesta inválida (admin):', response);
      }

      throw new Error("Respuesta inválida del servidor");
    } catch (error: any) {
      console.error('❌ Error en login admin:', error);
      throw new Error(error.message || "Error al iniciar sesión como administrador");
    }
  }

  /**
   * Cierra sesión
   */
  async logout(): Promise<void> {
    try {
      // Intentar cerrar sesión en el servidor
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    } finally {
      // Limpiar datos locales siempre
      this.clearAuth();
    }
  }

  /**
   * Refresca el token de acceso
   */
  async refreshToken(): Promise<string> {
    const refreshToken = Cookies.get(APP_CONSTANTS.REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      throw new Error("No hay refresh token disponible");
    }

    try {
      const response = await apiClient.post<{ access_token: string }>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refresh_token: refreshToken }
      );

      const newAccessToken = response.access_token;
      
      Cookies.set(APP_CONSTANTS.ACCESS_TOKEN_KEY, newAccessToken, {
        expires: 1 / 96, // 15 minutos
        secure: config.environment === "production",
        sameSite: "strict",
      });

      return newAccessToken;
    } catch (error: any) {
      this.clearAuth();
      throw new Error(error.message || "Error al refrescar el token");
    }
  }

  /**
   * Obtiene el usuario actual desde localStorage
   */
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(APP_CONSTANTS.USER_KEY);
      if (!userStr) return null;
      return JSON.parse(userStr) as User;
    } catch (error) {
      console.error("Error al obtener usuario actual:", error);
      return null;
    }
  }

  /**
   * Verifica si hay una sesión activa
   */
  isAuthenticated(): boolean {
    const accessToken = Cookies.get(APP_CONSTANTS.ACCESS_TOKEN_KEY);
    const user = this.getCurrentUser();
    return !!accessToken && !!user;
  }

  /**
   * Verifica si el usuario es admin
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "admin";
  }

  /**
   * Verifica si el usuario es cliente
   */
  isCliente(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "cliente";
  }

  /**
   * Decodifica un JWT token (sin verificación, solo para lectura)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload) as TokenPayload;
    } catch (error) {
      console.error("Error al decodificar token:", error);
      return null;
    }
  }

  /**
   * Verifica si el token ha expirado
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  }

  /**
   * Guarda los tokens en cookies
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    Cookies.set(APP_CONSTANTS.ACCESS_TOKEN_KEY, accessToken, {
      expires: 1 / 96, // 15 minutos
      secure: config.environment === "production",
      sameSite: "strict",
    });

    Cookies.set(APP_CONSTANTS.REFRESH_TOKEN_KEY, refreshToken, {
      expires: 7, // 7 días
      secure: config.environment === "production",
      sameSite: "strict",
    });
  }

  /**
   * Guarda el usuario en localStorage
   */
  private setUser(user: User): void {
    try {
      const userStr = JSON.stringify(user);
      console.log('🔧 Intentando guardar en localStorage:', { key: APP_CONSTANTS.USER_KEY, user });
      localStorage.setItem(APP_CONSTANTS.USER_KEY, userStr);
      
      // Verificar que se guardó
      const saved = localStorage.getItem(APP_CONSTANTS.USER_KEY);
      console.log('✔️ Verificación inmediata - guardado:', saved ? 'SÍ' : 'NO');
      if (saved) {
        console.log('✔️ Contenido guardado:', JSON.parse(saved));
      }
    } catch (error) {
      console.error('❌ Error guardando en localStorage:', error);
      throw error;
    }
  }

  /**
   * Limpia todos los datos de autenticación
   */
  private clearAuth(): void {
    Cookies.remove(APP_CONSTANTS.ACCESS_TOKEN_KEY);
    Cookies.remove(APP_CONSTANTS.REFRESH_TOKEN_KEY);
    localStorage.removeItem(APP_CONSTANTS.USER_KEY);
  }

  /**
   * Inicia el refresh automático del token
   */
  startTokenRefreshInterval(): NodeJS.Timeout {
    return setInterval(async () => {
      const accessToken = Cookies.get(APP_CONSTANTS.ACCESS_TOKEN_KEY);
      
      if (accessToken && !this.isTokenExpired(accessToken)) {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error("Error en refresh automático:", error);
          // Si falla el refresh, cerrar sesión
          this.clearAuth();
          window.location.href = "/login";
        }
      }
    }, APP_CONSTANTS.REFRESH_TOKEN_INTERVAL);
  }

  /**
   * Detiene el refresh automático del token
   */
  stopTokenRefreshInterval(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }
}

// Exportar una instancia única
export const authService = new AuthService();
