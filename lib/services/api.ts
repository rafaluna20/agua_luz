import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { config, API_ENDPOINTS, APP_CONSTANTS, ERROR_MESSAGES } from "@/lib/config";
import type { ApiResponse } from "@/types";

/**
 * Cliente HTTP configurado con Axios
 */
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

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
   * Configura interceptores de request y response
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = Cookies.get(APP_CONSTANTS.ACCESS_TOKEN_KEY);
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Si el error es 401 y no estamos en refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Si ya estamos refrescando, agregar a la cola
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = Cookies.get(APP_CONSTANTS.REFRESH_TOKEN_KEY);
            
            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            const response = await this.client.post(API_ENDPOINTS.AUTH.REFRESH, {
              refresh_token: refreshToken,
            });

            // Respuesta de Odoo: { success: true, data: { access_token, ... } }
            const responseData = response.data?.data || response.data;
            const access_token = responseData.access_token;
            
            Cookies.set(APP_CONSTANTS.ACCESS_TOKEN_KEY, access_token, {
              expires: 1 / 96, // 15 minutos
              secure: config.environment === "production",
              sameSite: "strict",
            });

            // Procesar la cola de requests fallidos
            this.failedQueue.forEach((prom) => {
              prom.resolve(access_token);
            });
            this.failedQueue = [];

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            
            return this.client(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach((prom) => {
              prom.reject(refreshError);
            });
            this.failedQueue = [];
            
            // Limpiar tokens y redirigir al login
            this.clearAuth();
            window.location.href = "/login";
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Limpia los datos de autenticación
   */
  private clearAuth(): void {
    Cookies.remove(APP_CONSTANTS.ACCESS_TOKEN_KEY);
    Cookies.remove(APP_CONSTANTS.REFRESH_TOKEN_KEY);
    localStorage.removeItem(APP_CONSTANTS.USER_KEY);
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
  async get<T = any>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.client.get<T>(url, { params });
      return response.data;
    } catch (error) {
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
