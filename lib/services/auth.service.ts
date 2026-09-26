import { apiClient } from "./api";
import { API_ENDPOINTS, APP_CONSTANTS } from "@/lib/config";
import type { LoginCredentials, AuthResponse, User } from "@/types";

/**
 * Servicio de autenticación.
 *
 * Los tokens NO pasan por aquí: el BFF (app/api/odoo) los guarda en cookies httpOnly y los agrega a cada llamada, y
 * también refresca la sesión cuando vence. En el navegador solo queda el perfil (nombre, correo, rol) para dibujar la
 * pantalla; no es una credencial: si alguien lo edita, el servidor igual exige la cookie de sesión.
 */
class AuthService {
  /**
   * Inicia sesión (cliente)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.AUTH.LOGIN, credentials);
      const customer = response?.success ? response.data?.customer : null;
      if (!customer) throw new Error("Respuesta inválida del servidor");

      const user: User = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        role: "cliente", // Los clientes siempre son 'cliente'
      };
      this.setUser(user);
      return { success: true, user };
    } catch (error: any) {
      throw new Error(error.message || "Error al iniciar sesión");
    }
  }

  /**
   * Login de administrador
   */
  async loginAdmin(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.AUTH.LOGIN_ADMIN, credentials);
      const usuario = response?.success ? response.data?.user : null;
      if (!usuario) throw new Error("Respuesta inválida del servidor");

      const adminUser: User = {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        phone: "",
        role: "admin",
      };
      this.setUser(adminUser);
      return { success: true, user: adminUser };
    } catch (error: any) {
      throw new Error(error.message || "Error al iniciar sesión como administrador");
    }
  }

  /**
   * Cierra sesión: el BFF avisa a Odoo y borra las cookies; aquí se limpia el perfil local.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Aunque falle la red, se limpia lo local; las cookies vencen solas
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Obtiene el usuario actual (solo para dibujar la pantalla)
   */
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(APP_CONSTANTS.USER_KEY);
      return userStr ? (JSON.parse(userStr) as User) : null;
    } catch {
      return null;
    }
  }

  /**
   * ¿Hay perfil guardado? La sesión real la decide el servidor con la cookie httpOnly: si venció, la siguiente llamada
   * responde 401 y el cliente vuelve al login.
   */
  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === "admin";
  }

  isCliente(): boolean {
    return this.getCurrentUser()?.role === "cliente";
  }

  /**
   * Guarda el perfil (no contiene credenciales)
   */
  private setUser(user: User): void {
    localStorage.setItem(APP_CONSTANTS.USER_KEY, JSON.stringify(user));
  }

  /**
   * Limpia el perfil local
   */
  private clearAuth(): void {
    try {
      localStorage.removeItem(APP_CONSTANTS.USER_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  /**
   * Antes refrescaba el token cada 14 minutos desde el navegador. Ahora el BFF refresca solo cuando una llamada
   * responde 401, así que no hay nada que programar. Se conserva para no romper a quien lo llama.
   */
  startTokenRefreshInterval(): NodeJS.Timeout {
    return setInterval(() => undefined, 24 * 60 * 60 * 1000);
  }

  stopTokenRefreshInterval(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }
}

// Exportar una instancia única
export const authService = new AuthService();
