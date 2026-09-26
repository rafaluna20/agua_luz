import { AppConfig } from "@/types";

/**
 * Configuración global de la aplicación
 */
export const config: AppConfig = {
  // El navegador solo habla con el BFF de este mismo dominio (app/api/odoo): los tokens no salen de las cookies httpOnly.
  apiUrl: "/api/odoo",
  environment: (process.env.NODE_ENV as "development" | "production") || "development",
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  paymentMethods: {
    yape: true,
    tarjeta: true,
    transferencia: true,
  },
};

/**
 * URLs de la API
 */
export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: "/portal/auth/login",
    LOGIN_ADMIN: "/portal/auth/admin-login",
    REFRESH: "/portal/auth/refresh",
    LOGOUT: "/portal/auth/logout",
  },
  // Cliente
  CUSTOMER: {
    ME: "/portal/customer/me",
    METERS: "/portal/customer/meters",
  },
  // Consumo
  CONSUMPTION: {
    HISTORY: "/portal/consumption/history",
  },
  // Facturas
  INVOICES: {
    LIST: "/portal/invoices",
    DETAIL: (id: number) => `/portal/invoice/${id}`,
    PDF: (id: number) => `/portal/invoice/${id}/pdf`,
  },
  // Pagos
  PAYMENTS: {
    CREATE: "/api/portal/payments/create",
    STATUS: (transactionId: string) => `/api/portal/payments/status/${transactionId}`,
  },
  // Admin
  ADMIN: {
    STATS: "/api/admin/dashboard/stats",
    CLIENTS: "/api/admin/clients",
    METERS: "/api/portal/meters",
    READINGS: "/api/admin/readings",
    REPORTS: "/api/admin/reports",
  },
};

/**
 * Constantes de la aplicación
 */
export const APP_CONSTANTS = {
  // Tokens
  ACCESS_TOKEN_KEY: "access_token",
  REFRESH_TOKEN_KEY: "refresh_token",
  USER_KEY: "user",

  // Paginación
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Timeouts
  API_TIMEOUT: 30000, // 30 segundos
  REFRESH_TOKEN_INTERVAL: 840000, // 14 minutos (antes de que expire a los 15)

  // Notificaciones
  NOTIFICATION_DURATION: 5000, // 5 segundos

  // Formatos
  DATE_FORMAT: "dd/MM/yyyy",
  DATETIME_FORMAT: "dd/MM/yyyy HH:mm",
  MONTH_FORMAT: "MMMM yyyy",

  // Validaciones
  PASSWORD_MIN_LENGTH: 8,
  PHONE_LENGTH: 9,

  // Límites de archivo
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
};

/**
 * Rutas de la aplicación
 */
export const APP_ROUTES = {
  // Públicas
  HOME: "/",
  LOGIN: "/login",
  LOGIN_ADMIN: "/login-admin",

  // Cliente
  CLIENTE: {
    DASHBOARD: "/dashboard",
    RECIBOS: "/recibos",
    RECIBO_DETAIL: (id: number) => `/recibos/${id}`,
    PAGOS: "/pagos",
    CONSUMO: "/consumo",
    PERFIL: "/perfil",
  },

  // Admin
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    CLIENTES: "/admin/clientes",
    CLIENTE_DETAIL: (id: number) => `/admin/clientes/${id}`,
    MEDIDORES: "/admin/medidores",
    MEDIDOR_DETAIL: (id: number) => `/admin/medidores/${id}`,
    LECTURAS: "/admin/lecturas",
    REPORTES: "/admin/reportes",
    CONFIGURACION: "/admin/configuracion",
  },
};

/**
 * Mensajes de error comunes
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Error de conexión. Por favor, verifica tu conexión a internet.",
  UNAUTHORIZED: "No tienes autorización para realizar esta acción.",
  SESSION_EXPIRED: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
  VALIDATION_ERROR: "Por favor, verifica los datos ingresados.",
  SERVER_ERROR: "Error del servidor. Por favor, intenta nuevamente más tarde.",
  NOT_FOUND: "Recurso no encontrado.",
  GENERIC_ERROR: "Ha ocurrido un error. Por favor, intenta nuevamente.",
};

/**
 * Mensajes de éxito comunes
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "¡Bienvenido!",
  LOGOUT_SUCCESS: "Sesión cerrada correctamente.",
  SAVE_SUCCESS: "Datos guardados correctamente.",
  DELETE_SUCCESS: "Eliminado correctamente.",
  UPDATE_SUCCESS: "Actualizado correctamente.",
  PAYMENT_SUCCESS: "Pago realizado exitosamente.",
};

/**
 * Configuración de servicios de pago
 */
export const PAYMENT_CONFIG = {
  YAPE: {
    name: "Yape",
    icon: "📱",
    qrSize: 200,
    expirationMinutes: 10,
  },
  TARJETA: {
    name: "Tarjeta de Crédito/Débito",
    icon: "💳",
    providers: ["Visa", "Mastercard", "American Express"],
  },
  TRANSFERENCIA: {
    name: "Transferencia Bancaria",
    icon: "🏦",
    banks: ["BCP", "BBVA", "Interbank", "Scotiabank"],
    accountNumber: "191-XXXXXXXX-X-XX",
    cci: "002-191-XXXXXXXXXXXXXX-XX",
  },
};
