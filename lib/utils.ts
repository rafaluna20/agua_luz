import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Combina clases de Tailwind CSS con merge automático
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un monto en moneda peruana (PEN)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea una fecha a formato legible en español
 */
export function formatDate(date: string | Date, formatStr: string = "dd/MM/yyyy"): string {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: es });
  } catch (error) {
    return "Fecha inválida";
  }
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}

/**
 * Obtiene el nombre del mes en español
 */
export function getMonthName(monthNumber: number): string {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return months[monthNumber - 1] || "";
}

/**
 * Calcula el número de días entre dos fechas
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === "string" ? parseISO(date1) : date1;
  const d2 = typeof date2 === "string" ? parseISO(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica si una fecha ha vencido
 */
export function isDateExpired(date: string | Date): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return dateObj < new Date();
}

/**
 * Trunca un texto a un número máximo de caracteres
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Convierte un número a formato con separadores de miles
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Calcula el porcentaje de un valor respecto a un total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Genera un ID único
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Valida un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida un teléfono peruano (9 dígitos)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^9\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Formatea un teléfono peruano
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Obtiene las iniciales de un nombre
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calcula el color de estado según el tipo
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Estados de factura
    paid: "text-green-600 bg-green-50",
    pending: "text-yellow-600 bg-yellow-50",
    overdue: "text-red-600 bg-red-50",
    cancelled: "text-gray-600 bg-gray-50",
    // Estados de lectura
    validated: "text-green-600 bg-green-50",
    draft: "text-blue-600 bg-blue-50",
    anomaly: "text-orange-600 bg-orange-50",
    rejected: "text-red-600 bg-red-50",
    // Estados de medidor
    active: "text-green-600 bg-green-50",
    inactive: "text-gray-600 bg-gray-50",
    maintenance: "text-orange-600 bg-orange-50",
  };
  return colors[status] || "text-gray-600 bg-gray-50";
}

/**
 * Traduce el estado al español
 */
export function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    // Payment states
    paid: "Pagado",
    not_paid: "No pagado",
    in_payment: "En proceso",
    partial: "Pago parcial",
    reversed: "Revertido",
    // Invoice states
    draft: "Borrador",
    posted: "Publicado",
    cancel: "Cancelado",
    pending: "Pendiente",
    overdue: "Vencido",
    // Reading states
    validated: "Validado",
    anomaly: "Anomalía",
    rejected: "Rechazado",
    // Meter states
    active: "Activo",
    inactive: "Inactivo",
    maintenance: "Mantenimiento",
  };
  return translations[status] || status;
}

/**
 * Obtiene el nombre del servicio en español
 */
export function getServiceName(serviceType: "water" | "electricity"): string {
  return serviceType === "water" ? "Agua" : "Luz";
}

/**
 * Obtiene el icono del tipo de servicio
 */
export function getServiceIcon(serviceType: "water" | "electricity"): string {
  return serviceType === "water" ? "💧" : "⚡";
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Descarga un archivo desde un blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Copia texto al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Error al copiar al portapapeles:", error);
    return false;
  }
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
