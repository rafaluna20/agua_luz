/**
 * Readings Service - Capa de servicio para lecturas
 * Integra IndexedDB, SyncManager y API backend
 */

import { db } from '@/lib/db/indexedDB';
import { getSyncManager } from '@/lib/sync/SyncManager';
import { 
  Reading, 
  ReadingException, 
  Meter, 
  ReadingRoute,
  ValidationResult,
  SyncStatus 
} from '@/types/readings';
import { v4 as uuidv4 } from 'uuid';

class ReadingsService {
  private syncManager = getSyncManager();

  // ==================== INITIALIZATION ====================

  /**
   * Inicializa el servicio de lecturas
   */
  async initialize(): Promise<void> {
    console.log('🚀 Inicializando servicio de lecturas...');
    
    // Inicializar IndexedDB
    await db.init();
    
    // Iniciar SyncManager
    await this.syncManager.start();
    
    console.log('✅ Servicio de lecturas inicializado');
  }

  /**
   * Detiene el servicio
   */
  stop(): void {
    this.syncManager.stop();
  }

  // ==================== READINGS ====================

  /**
   * Crea una nueva lectura (offline)
   */
  async createReading(data: {
    meter_id: number;
    meter_code: string;
    value: number;
    operator_id: number;
    operator_name: string;
    latitude?: number;
    longitude?: number;
    photo_base64?: string;
    photo_filename?: string;
    notes?: string;
  }): Promise<Reading> {
    const now = new Date().toISOString();

    // Validar datos básicos
    if (!data.meter_id || !data.value || !data.operator_id) {
      throw new Error('Datos incompletos para crear lectura');
    }

    // Crear lectura
    const reading: Reading = {
      local_id: uuidv4(),
      meter_id: data.meter_id,
      meter_code: data.meter_code,
      value: data.value,
      reading_date: now,
      operator_id: data.operator_id,
      operator_name: data.operator_name,
      latitude: data.latitude,
      longitude: data.longitude,
      photo_base64: data.photo_base64,
      photo_filename: data.photo_filename,
      notes: data.notes,
      device_info: {
        platform: typeof window !== 'undefined' ? navigator.platform : 'unknown',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
        appVersion: '1.0.0'
      },
      synced: false,
      sync_attempts: 0,
      validation_status: 'pending',
      validation_messages: [],
      created_at: now,
      updated_at: now
    };

    // Validar consumo
    const validation = await this.validateReading(reading);
    reading.validation_status = validation.is_valid ? 'valid' : 'anomaly';
    reading.validation_messages = validation.messages;
    reading.consumption = validation.anomalies.find(a => a.type)?.message.match(/\d+\.?\d*/)?.[0] 
      ? parseFloat(validation.anomalies[0].message.match(/\d+\.?\d*/)?.[0] || '0') 
      : undefined;

    // Guardar en IndexedDB
    await db.saveReading(reading);

    console.log(`✅ Lectura creada localmente - ID: ${reading.local_id}, Medidor: ${reading.meter_code}`);

    // Verificar si debe sincronizar por cantidad (estrategia 2)
    await this.syncManager.checkBatchSync();

    return reading;
  }

  /**
   * Valida una lectura antes de guardarla
   */
  async validateReading(reading: Reading): Promise<ValidationResult> {
    try {
      // Obtener medidor desde cache
      const meter = await db.getMeterByQR(reading.meter_code);

      if (!meter) {
        return {
          is_valid: false,
          level: 'requires_deep_review',
          messages: ['Medidor no encontrado en cache local'],
          anomalies: [{
            type: 'high_consumption',
            severity: 'error',
            message: 'Medidor no encontrado. Sincroniza lista de medidores.',
            suggested_action: 'Descargar lista de medidores actualizada'
          }]
        };
      }

      // Verificar si hay última lectura
      if (!meter.last_reading) {
        return {
          is_valid: true,
          level: 'auto_approved',
          messages: ['Primera lectura del medidor'],
          anomalies: []
        };
      }

      const previous_value = meter.last_reading.value;
      const consumption = reading.value - previous_value;
      const avg_consumption = meter.average_consumption || 0;

      const anomalies: ValidationResult['anomalies'] = [];

      // Validación 1: Consumo negativo
      if (consumption < 0) {
        anomalies.push({
          type: 'negative_consumption',
          severity: 'critical',
          message: `Consumo negativo: ${consumption.toFixed(1)}. Valor actual (${reading.value}) < anterior (${previous_value})`,
          suggested_action: '⚠️ CRÍTICO: Verificar medidor. ¿Fue reemplazado? Tomar foto del medidor completo.'
        });
      }

      // Validación 2: Consumo cero
      if (consumption === 0) {
        anomalies.push({
          type: 'zero_consumption',
          severity: 'warning',
          message: 'Consumo cero detectado',
          suggested_action: 'Verificar si medidor está dañado o cliente ausente prolongado'
        });
      }

      // Validación 3: Consumo vs promedio (solo si hay promedio)
      if (avg_consumption > 0 && consumption > 0) {
        const percentage = (consumption / avg_consumption) * 100;

        if (percentage > 300) {
          anomalies.push({
            type: 'high_consumption',
            severity: 'critical',
            message: `Consumo 3x mayor al promedio: ${consumption.toFixed(1)} vs ${avg_consumption.toFixed(1)} (${percentage.toFixed(0)}%)`,
            suggested_action: '⚠️ RE-TOMAR LECTURA. Verificar valor y tomar foto obligatoria.'
          });
        } else if (percentage > 150) {
          anomalies.push({
            type: 'high_consumption',
            severity: 'warning',
            message: `Consumo 50% mayor al promedio: ${consumption.toFixed(1)} vs ${avg_consumption.toFixed(1)} (${percentage.toFixed(0)}%)`,
            suggested_action: 'Verificar lectura y tomar foto'
          });
        } else if (percentage < 30) {
          anomalies.push({
            type: 'low_consumption',
            severity: 'warning',
            message: `Consumo 70% menor al promedio: ${consumption.toFixed(1)} vs ${avg_consumption.toFixed(1)} (${percentage.toFixed(0)}%)`,
            suggested_action: 'Verificar si cliente está de viaje o medidor con problema'
          });
        }
      }

      // Validación 4: GPS (si está disponible)
      if (reading.latitude && reading.longitude && meter.location) {
        const distance = this.calculateDistance(
          reading.latitude,
          reading.longitude,
          meter.location.latitude,
          meter.location.longitude
        );

        if (distance > 50) {
          anomalies.push({
            type: 'gps_mismatch',
            severity: 'error',
            message: `GPS a ${distance.toFixed(0)}m del medidor registrado`,
            suggested_action: 'Verificar que estás en la ubicación correcta'
          });
        }
      }

      // Determinar nivel de validación
      let level: ValidationResult['level'] = 'auto_approved';
      const messages: string[] = [];

      if (anomalies.some(a => a.severity === 'critical')) {
        level = 'requires_deep_review';
        messages.push('Requiere revisión profunda por supervisor');
      } else if (anomalies.some(a => a.severity === 'error')) {
        level = 'requires_deep_review';
        messages.push('Requiere revisión profunda');
      } else if (anomalies.some(a => a.severity === 'warning')) {
        level = 'requires_light_review';
        messages.push('Requiere revisión ligera');
      } else {
        messages.push('Lectura validada automáticamente');
      }

      return {
        is_valid: anomalies.length === 0,
        level,
        messages,
        anomalies
      };

    } catch (error) {
      console.error('Error validando lectura:', error);
      return {
        is_valid: false,
        level: 'requires_light_review',
        messages: [`Error en validación: ${error}`],
        anomalies: []
      };
    }
  }

  /**
   * Calcula distancia entre dos coordenadas (en metros)
   * Fórmula de Haversine
   */
  private calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Obtiene lecturas del día
   */
  async getTodayReadings(operatorId: number): Promise<Reading[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.getReadingsByOperatorAndDate(operatorId, today);
  }

  // ==================== EXCEPTIONS ====================

  /**
   * Reporta una excepción (medidor inaccesible, etc.)
   */
  async reportException(data: {
    meter_id: number;
    meter_code: string;
    exception_type: ReadingException['exception_type'];
    description: string;
    operator_id: number;
    latitude?: number;
    longitude?: number;
    photo_base64?: string;
    photo_filename?: string;
  }): Promise<ReadingException> {
    const now = new Date().toISOString();

    const exception: ReadingException = {
      local_id: uuidv4(),
      meter_id: data.meter_id,
      meter_code: data.meter_code,
      operator_id: data.operator_id,
      exception_type: data.exception_type,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      photo_base64: data.photo_base64,
      photo_filename: data.photo_filename,
      synced: false,
      created_at: now,
      requires_followup: ['meter_damaged', 'meter_not_found'].includes(data.exception_type)
    };

    await db.saveException(exception);

    console.log(`✅ Excepción reportada - Tipo: ${exception.exception_type}, Medidor: ${exception.meter_code}`);

    return exception;
  }

  // ==================== METERS (CACHE) ====================

  /**
   * Descarga y cachea lista de medidores
   */
  async downloadMeters(operatorId?: number): Promise<number> {
    try {
      // TODO: Llamar API para obtener medidores
      // Por ahora, mock
      console.log('📥 Descargando lista de medidores...');

      // const response = await fetch(`/api/portal/meters/list?operator_id=${operatorId}`);
      // const meters = await response.json();

      // await db.cacheMeters(meters);

      console.log('✅ Medidores descargados y cacheados');
      return 0; // Retornar cantidad
    } catch (error) {
      console.error('Error descargando medidores:', error);
      throw error;
    }
  }

  /**
   * Obtiene medidor por QR code
   */
  async getMeterByQR(qrCode: string): Promise<Meter | null> {
    return await db.getMeterByQR(qrCode);
  }

  /**
   * Obtiene todos los medidores en cache
   */
  async getAllCachedMeters(): Promise<Meter[]> {
    return await db.getAllMeters();
  }

  // ==================== ROUTES ====================

  /**
   * Obtiene ruta activa del operario
   */
  async getMyRoute(operatorId: number, date?: string): Promise<ReadingRoute | null> {
    const routeDate = date || new Date().toISOString().split('T')[0];
    return await db.getActiveRoute(operatorId, routeDate);
  }

  /**
   * Guarda ruta del día
   */
  async saveRoute(route: ReadingRoute): Promise<void> {
    await db.saveRoute(route);
  }

  // ==================== SYNC ====================

  /**
   * Sincroniza manualmente
   */
  async syncNow(): Promise<{
    success: boolean;
    message: string;
    syncedCount?: number;
  }> {
    return await this.syncManager.manualSync();
  }

  /**
   * Sincroniza al finalizar jornada (obligatorio)
   */
  async endShift(): Promise<{
    success: boolean;
    message: string;
    syncedCount?: number;
    pendingCount?: number;
  }> {
    return await this.syncManager.forceSyncOnEndShift();
  }

  /**
   * Obtiene estado de sincronización
   */
  async getSyncStatus(): Promise<SyncStatus> {
    return await this.syncManager.getStatus();
  }

  /**
   * Registra listener para eventos de sync
   */
  onSyncEvent(callback: (event: any) => void): () => void {
    return this.syncManager.on(callback);
  }

  // ==================== STATISTICS ====================

  /**
   * Obtiene estadísticas de almacenamiento
   */
  async getStorageStats(): Promise<{
    readings: { total: number; pending: number; synced: number };
    exceptions: { total: number; pending: number };
    meters: number;
  }> {
    return await db.getStorageStats();
  }

  /**
   * Obtiene progreso del día
   */
  async getTodayProgress(operatorId: number): Promise<{
    assigned: number;
    completed: number;
    exceptions: number;
    percentage: number;
  }> {
    const route = await this.getMyRoute(operatorId);
    const readings = await this.getTodayReadings(operatorId);
    const stats = await db.getStorageStats();

    const assigned = route?.total_meters || 0;
    const completed = readings.length;
    const exceptions = stats.exceptions.total;
    const percentage = assigned > 0 ? (completed / assigned) * 100 : 0;

    return {
      assigned,
      completed,
      exceptions,
      percentage: Math.round(percentage)
    };
  }

  // ==================== UTILITIES ====================

  /**
   * Limpia datos antiguos
   */
  async cleanup(): Promise<void> {
    await db.cleanupOldSyncedReadings();
    console.log('🗑️ Limpieza de datos antiguos completada');
  }

  /**
   * Obtiene las lecturas pendientes de sincronización
   */
  async getPendingReadings(): Promise<Reading[]> {
    return db.getPendingReadings();
  }

  /**
   * Elimina una lectura por su local_id
   */
  async deleteReading(localId: string): Promise<void> {
    return db.deleteReading(localId);
  }

  /**
   * Limpia todo (usar con cuidado)
   */
  async clearAllData(): Promise<void> {
    if (confirm('⚠️ ¿Estás seguro? Esto eliminará TODOS los datos offline.')) {
      await db.clearAllData();
      console.log('🗑️ Todos los datos offline eliminados');
    }
  }
}

// Singleton instance
let readingsServiceInstance: ReadingsService | null = null;

export function getReadingsService(): ReadingsService {
  if (!readingsServiceInstance) {
    readingsServiceInstance = new ReadingsService();
  }
  return readingsServiceInstance;
}

export function resetReadingsService(): void {
  if (readingsServiceInstance) {
    readingsServiceInstance.stop();
    readingsServiceInstance = null;
  }
}

// Export default instance
export const readingsService = getReadingsService();
