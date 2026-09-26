import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { config, API_ENDPOINTS, APP_CONSTANTS, ERROR_MESSAGES } from "@/lib/config";
import type { ApiResponse } from "@/types";

/**
 * Cliente HTTP configurado con Axios
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: APP_CONSTANTS.API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Para enviar cookies
    });

    this.setupInterceptors();
  }

  /**
   * Interceptores. El token NO se maneja aquí: vive en cookies httpOnly y lo agrega el BFF (app/api/odoo), que
   * también refresca la sesión cuando vence. Si aun así llega un 401, la sesión terminó de verdad: al login.
   */
  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const url = error.config?.url || "";
        const esIntentoDeLogin = url.includes("/auth/login") || url.includes("/auth/admin-login");
        if (error.response?.status === 401 && !esIntentoDeLogin && typeof window !== "undefined") {
          this.clearAuth();
          const admin = window.location.pathname.startsWith("/admin");
          if (!window.location.pathname.startsWith("/login")) {
            window.location.href = admin ? "/login-admin" : "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Limpia los datos locales de la sesión (las cookies las borra el BFF al cerrar sesión o al vencer).
   */
  private clearAuth(): void {
    try {
      localStorage.removeItem(APP_CONSTANTS.USER_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;

      if (axiosError.response) {
        // El servidor respondió con un código de error
        const responseData = axiosError.response.data;

        // Formato de error de Odoo: { success: false, error: { code, message } }
        if (responseData?.error?.message) {
          throw new Error(responseData.error.message);
        }

        // Otros formatos de error
        const message = responseData?.message ||
          responseData?.error ||
          ERROR_MESSAGES.SERVER_ERROR;
        throw new Error(message);
      } else if (axiosError.request) {
        // La petición se hizo pero no hubo respuesta
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
    }

    throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, params?: any, config?: any): Promise<T> {
    try {
      const response = await this.client.get<T>(url, { params, ...config });
      return response.data;
    } catch (error: any) {
      // Si el tipo de respuesta es blob y hay error, intentar leer el blob como JSON para mostrar el error
      if (config?.responseType === 'blob' && error?.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          if (json.error || json.message) {
            error.response.data = json; // Reemplazar blob con json para handleError
          }
        } catch (e) {
          // No es JSON, continuar con el error original
        }
      }
      return this.handleError(error);
    }
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(url);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Descarga un archivo
   */
  async downloadFile(url: string, filename: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Upload de archivo
   */
  async uploadFile<T = any>(url: string, file: File, fieldName: string = "file"): Promise<T> {
    try {
      const formData = new FormData();
      formData.append(fieldName, file);

      const response = await this.client.post<T>(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Exportar una instancia única
export const apiClient = new ApiClient();
