// ==========================================
// TIPOS DE AUTENTICACIÓN
// ==========================================
export type UserRole = 'cliente' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  customer_id?: number;
  phone?: string;
  address?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: User;
  message?: string;
}

export interface TokenPayload {
  user_id: number;
  email: string;
  role: UserRole;
  customer_id?: number;
  exp: number;
  iat: number;
}

// ==========================================
// TIPOS DE MEDIDOR Y LECTURA
// ==========================================
export interface Meter {
  id: number;
  name: string;
  code: string;
  service_type: 'water' | 'electricity';
  meter_level: {
    id: number;
    name: string;
    code: string;
  };
  status: 'active' | 'inactive' | 'maintenance';
  last_reading?: number;
  last_reading_date?: string;
  customer_id?: number;
  customer_name?: string;
}

export interface Reading {
  id: number;
  meter_id: number;
  meter_name: string;
  value: number;
  previous_value: number;
  consumption: number;
  reading_date: string;
  previous_reading_date?: string;
  state: 'draft' | 'validated' | 'anomaly' | 'rejected';
  reader_name?: string;
  has_photo: boolean;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface ConsumptionHistory {
  period: string;
  consumption: number;
  cost: number;
  service_type: 'water' | 'electricity';
}

// ==========================================
// TIPOS DE FACTURA Y RECIBO
// ==========================================
export interface Invoice {
  id: number;
  invoice_number: string;
  partner_id: number;
  partner_name: string;
  invoice_date: string;
  date_due: string;
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  amount_residual: number;
  state: 'draft' | 'posted' | 'cancel' | 'paid';
  payment_state: 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'reversed' | 'invoicing_legacy';
  invoice_line_ids: InvoiceLine[];
}

export interface InvoiceLine {
  id: number;
  name: string;
  quantity: number;
  price_unit: number;
  price_subtotal: number;
  price_total: number;
  product_id: number;
  product_name: string;
}

export interface Recibo {
  id: number;
  numero_recibo: string;
  cliente: {
    id: number;
    nombre: string;
    direccion: string;
    documento: string;
  };
  medidor: {
    id: number;
    codigo: string;
    tipo_servicio: 'water' | 'electricity';
  };
  lectura_anterior: number;
  lectura_actual: number;
  consumo: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  periodo: string;
  detalles: DetalleRecibo[];
  subtotal: number;
  igv: number;
  total: number;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'cancelado';
  fecha_pago?: string;
  metodo_pago?: string;
}

export interface DetalleRecibo {
  concepto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// ==========================================
// TIPOS DE PAGO
// ==========================================
export type MetodoPago = 'yape' | 'tarjeta' | 'transferencia';

export interface PaymentRequest {
  recibo_id: number;
  monto: number;
  metodo_pago: MetodoPago;
  email?: string;
  telefono?: string;
}

export interface PaymentResponse {
  success: boolean;
  transaction_id: string;
  payment_url?: string;
  qr_code?: string;
  reference?: string;
  message: string;
}

export interface PaymentStatus {
  transaction_id: string;
  estado: 'pending' | 'completed' | 'failed' | 'cancelled';
  monto: number;
  fecha: string;
  metodo: MetodoPago;
}

// ==========================================
// TIPOS DE DASHBOARD ADMIN
// ==========================================
export interface DashboardStats {
  total_clientes: number;
  total_medidores: number;
  medidores_activos: number;
  medidores_inactivos: number;
  lecturas_pendientes: number;
  lecturas_mes_actual: number;
  facturacion_mes_actual: number;
  pagos_pendientes: number;
  consumo_promedio_agua: number;
  consumo_promedio_luz: number;
}

export interface ConsumptionTrend {
  mes: string;
  agua: number;
  luz: number;
}

export interface RevenueData {
  mes: string;
  facturado: number;
  cobrado: number;
  pendiente: number;
}

export interface ClienteResumen {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  total_medidores: number;
  deuda_pendiente: number;
  ultimo_pago?: string;
  estado: 'activo' | 'suspendido' | 'moroso';
}

// ==========================================
// TIPOS DE FORMULARIOS
// ==========================================
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

// ==========================================
// TIPOS DE RESPUESTA API
// ==========================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ==========================================
// TIPOS DE NOTIFICACIÓN
// ==========================================
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

// ==========================================
// TIPOS DE CONFIGURACIÓN
// ==========================================
export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'production';
  enableAnalytics: boolean;
  paymentMethods: {
    yape: boolean;
    tarjeta: boolean;
    transferencia: boolean;
  };
}
