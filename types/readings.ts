/**
 * Modelos de TypeScript para sistema de lecturas offline
 * Enterprise-grade con validación completa
 */

export interface Meter {
  id: number;
  code: string;
  qr_code: string;
  service_type: 'water' | 'electricity';
  customer_id: number;
  customer_name: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  last_reading?: {
    id: number;
    value: number;
    date: string;
    consumption: number;
  };
  average_consumption: number; // Promedio últimos 3 meses
  state: 'active' | 'inactive' | 'suspended';
}

export interface Reading {
  id?: number; // Backend ID (undefined si no sincronizado)
  local_id: string; // UUID local único
  meter_id: number;
  meter_code: string;
  value: number;
  reading_date: string; // ISO 8601
  operator_id: number;
  operator_name: string;
  
  // Ubicación y evidencia
  latitude?: number;
  longitude?: number;
  photo_base64?: string;
  photo_filename?: string;
  
  // Metadatos
  notes?: string;
  device_info?: {
    platform: string;
    userAgent: string;
    appVersion: string;
  };
  
  // Estado de sincronización
  synced: boolean;
  sync_attempts: number;
  last_sync_attempt?: string;
  sync_error?: string;
  
  // Validación
  validation_status: 'pending' | 'valid' | 'anomaly' | 'error';
  validation_messages: string[];
  consumption?: number; // Calculado: value - previous_value
  consumption_percentage?: number; // % vs promedio
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ReadingException {
  id?: number;
  local_id: string;
  meter_id: number;
  meter_code: string;
  operator_id: number;
  
  // Tipo de excepción
  exception_type: 
    | 'no_access' 
    | 'customer_absent'
    | 'meter_damaged'
    | 'meter_inaccessible'
    | 'meter_not_found'
    | 'dangerous_area'
    | 'other';
  
  // Evidencia
  description: string;
  photo_base64?: string;
  photo_filename?: string;
  latitude?: number;
  longitude?: number;
  
  // Estado
  synced: boolean;
  created_at: string;
  
  // Para seguimiento
  requires_followup: boolean;
  followup_assigned_to?: number;
}

export interface ReadingRoute {
  id: number;
  operator_id: number;
  date: string;
  zone_id?: number;
  zone_name?: string;
  
  meters: Meter[];
  total_meters: number;
  completed_count: number;
  exception_count: number;
  
  estimated_duration_hours: number;
  started_at?: string;
  completed_at?: string;
  
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface SyncStatus {
  pending_readings: number;
  pending_exceptions: number;
  last_sync: string | null;
  sync_in_progress: boolean;
  next_auto_sync?: string;
  connection_type: 'wifi' | '4g' | '3g' | 'offline';
  can_sync: boolean;
}

export interface ValidationResult {
  is_valid: boolean;
  level: 'auto_approved' | 'requires_light_review' | 'requires_deep_review';
  messages: string[];
  anomalies: {
    type: 'high_consumption' | 'low_consumption' | 'zero_consumption' | 'negative_consumption' | 'gps_mismatch';
    severity: 'warning' | 'error' | 'critical';
    message: string;
    suggested_action?: string;
  }[];
}

export interface BulkSyncRequest {
  operator_id: number;
  date: string;
  readings: Omit<Reading, 'id' | 'synced'>[];
  exceptions: Omit<ReadingException, 'id' | 'synced'>[];
  route_id?: number;
  device_info: {
    platform: string;
    app_version: string;
    sync_timestamp: string;
  };
}

export interface BulkSyncResponse {
  success: boolean;
  synced_readings: number;
  synced_exceptions: number;
  failed_readings: {
    local_id: string;
    error: string;
  }[];
  validation_summary: {
    auto_approved: number;
    requires_review: number;
    rejected: number;
  };
  server_timestamp: string;
}

export interface DashboardStats {
  today: {
    total_operators: number;
    active_operators: number;
    total_meters_assigned: number;
    meters_completed: number;
    progress_percentage: number;
    exceptions: number;
  };
  realtime: {
    operator_id: number;
    operator_name: string;
    current_location?: { lat: number; lng: number };
    last_reading_time: string;
    readings_completed: number;
    readings_assigned: number;
    status: 'active' | 'idle' | 'offline';
  }[];
}
