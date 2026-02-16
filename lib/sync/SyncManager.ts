/**
 * SyncManager - Sincronización Híbrida Inteligente
 * Enterprise-grade con 5 estrategias de sync
 */

import { db } from '@/lib/db/indexedDB';
import { Reading, ReadingException, BulkSyncRequest, BulkSyncResponse, SyncStatus } from '@/types/readings';

// Configuración del SyncManager
export interface SyncConfig {
  // 1. Sync periódico automático (ms)
  autoSyncInterval: number; // Default: 3600000 (1 hora)
  
  // 2. Sync por cantidad (número de lecturas)
  autoSyncBatchSize: number; // Default: 50
  
  // 3. Sync oportunista en WiFi
  syncOnWiFi: boolean; // Default: true
  
  // 4. Sync manual habilitado
  manualSyncEnabled: boolean; // Default: true
  
  // 5. Sync obligatorio al finalizar
  forceSyncOnEndShift: boolean; // Default: true
  
  // Retry configuration
  maxRetryAttempts: number; // Default: 3
  retryDelay: number; // Default: 2000 ms
  retryBackoffMultiplier: number; // Default: 2 (exponential)
  
  // Network
  minBandwidthMbps: number; // Default: 1 (mínimo para sync)
  
  // Debugging
  enableLogs: boolean; // Default: true
}

const DEFAULT_CONFIG: SyncConfig = {
  autoSyncInterval: 60 * 60 * 1000, // 1 hora
  autoSyncBatchSize: 50,
  syncOnWiFi: true,
  manualSyncEnabled: true,
  forceSyncOnEndShift: true,
  maxRetryAttempts: 3,
  retryDelay: 2000,
  retryBackoffMultiplier: 2,
  minBandwidthMbps: 1,
  enableLogs: true,
};

export type SyncEventType = 
  | 'sync_started'
  | 'sync_progress'
  | 'sync_completed'
  | 'sync_failed'
  | 'sync_partial'
  | 'network_change';

export interface SyncEvent {
  type: SyncEventType;
  timestamp: string;
  data?: any;
}

type SyncEventListener = (event: SyncEvent) => void;

export class SyncManager {
  private config: SyncConfig;
  private autoSyncTimer: NodeJS.Timeout | null = null;
  private networkChangeListener: (() => void) | null = null;
  private isSyncing: boolean = false;
  private lastSyncTime: Date | null = null;
  private pendingCount: number = 0;
  private listeners: SyncEventListener[] = [];

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.log('📱 SyncManager inicializado', this.config);
  }

  // ==================== LIFECYCLE ====================

  /**
   * Inicia el SyncManager
   */
  async start(): Promise<void> {
    this.log('🚀 Iniciando SyncManager...');

    // Actualizar conteo de pendientes
    await this.updatePendingCount();

    // 1. Setup auto-sync periódico
    if (this.config.autoSyncInterval > 0) {
      this.setupAutoSync();
    }

    // 2. Setup listener de cambios de red
    if (this.config.syncOnWiFi && typeof window !== 'undefined' && 'connection' in navigator) {
      this.setupNetworkListener();
    }

    this.log('✅ SyncManager iniciado correctamente');
  }

  /**
   * Detiene el SyncManager
   */
  stop(): void {
    this.log('🛑 Deteniendo SyncManager...');

    // Limpiar timer
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }

    // Limpiar listener de red
    if (this.networkChangeListener && typeof window !== 'undefined' && 'connection' in navigator) {
      (navigator as any).connection.removeEventListener('change', this.networkChangeListener);
      this.networkChangeListener = null;
    }

    this.log('✅ SyncManager detenido');
  }

  // ==================== SYNC STRATEGIES ====================

  /**
   * Estrategia 1: Sync automático periódico
   */
  private setupAutoSync(): void {
    this.log(`⏰ Setup auto-sync cada ${this.config.autoSyncInterval / 1000}s`);

    this.autoSyncTimer = setInterval(async () => {
      await this.updatePendingCount();

      if (this.pendingCount > 0 && !this.isSyncing) {
        this.log(`🔄 Auto-sync periódico iniciado (${this.pendingCount} pendientes)`);
        await this.syncIfPending();
      }
    }, this.config.autoSyncInterval);
  }

  /**
   * Estrategia 2: Sync por cantidad
   * Llamar este método después de cada lectura
   */
  async checkBatchSync(): Promise<boolean> {
    await this.updatePendingCount();

    if (this.pendingCount >= this.config.autoSyncBatchSize && !this.isSyncing) {
      this.log(`📦 Batch sync activado (${this.pendingCount} >= ${this.config.autoSyncBatchSize})`);
      return await this.syncIfPending();
    }

    return false;
  }

  /**
   * Estrategia 3: Sync oportunista (WiFi detectado)
   */
  private setupNetworkListener(): void {
    this.log('📡 Setup listener de cambios de red');

    this.networkChangeListener = async () => {
      const connection = (navigator as any).connection;
      const connectionType = connection?.type || connection?.effectiveType;

      this.emitEvent({
        type: 'network_change',
        timestamp: new Date().toISOString(),
        data: { connectionType, downlink: connection?.downlink }
      });

      if (connectionType === 'wifi' && this.config.syncOnWiFi && !this.isSyncing) {
        await this.updatePendingCount();

        if (this.pendingCount > 0) {
          this.log('📶 WiFi detectado, sincronizando...');
          await this.syncAll();
        }
      }
    };

    (navigator as any).connection?.addEventListener('change', this.networkChangeListener);
  }

  /**
   * Estrategia 4: Sync manual
   */
  async manualSync(): Promise<{ success: boolean; message: string; syncedCount?: number }> {
    if (!this.config.manualSyncEnabled) {
      return { success: false, message: 'Sync manual deshabilitado' };
    }

    await this.updatePendingCount();

    if (this.pendingCount === 0) {
      return { success: true, message: 'No hay lecturas pendientes de sincronizar' };
    }

    if (this.isSyncing) {
      return { success: false, message: 'Ya hay una sincronización en progreso' };
    }

    this.log(`🖐️ Sync manual iniciado (${this.pendingCount} pendientes)`);

    const result = await this.syncAll();

    if (result.success) {
      return {
        success: true,
        message: `✅ ${result.syncedReadings + result.syncedExceptions} elementos sincronizados`,
        syncedCount: result.syncedReadings + result.syncedExceptions
      };
    } else {
      return {
        success: false,
        message: `❌ Error en sincronización: ${result.error || 'Desconocido'}`
      };
    }
  }

  /**
   * Estrategia 5: Sync obligatorio al finalizar jornada
   */
  async forceSyncOnEndShift(): Promise<{
    success: boolean;
    message: string;
    syncedCount?: number;
    pendingCount?: number;
  }> {
    if (!this.config.forceSyncOnEndShift) {
      return { success: false, message: 'Sync obligatorio deshabilitado' };
    }

    await this.updatePendingCount();

    if (this.pendingCount === 0) {
      return { success: true, message: 'Sin lecturas pendientes', syncedCount: 0 };
    }

    this.log(`🏁 Sync obligatorio de fin de jornada (${this.pendingCount} pendientes)`);

    // Intentar hasta 3 veces con backoff
    for (let attempt = 1; attempt <= this.config.maxRetryAttempts; attempt++) {
      this.log(`Intento ${attempt}/${this.config.maxRetryAttempts}...`);

      const result = await this.syncAll();

      if (result.success) {
        return {
          success: true,
          message: `✅ ${result.syncedReadings + result.syncedExceptions} elementos sincronizados`,
          syncedCount: result.syncedReadings + result.syncedExceptions,
          pendingCount: 0
        };
      }

      // Si no es el último intento, esperar antes de reintentar
      if (attempt < this.config.maxRetryAttempts) {
        const delay = this.config.retryDelay * Math.pow(this.config.retryBackoffMultiplier, attempt - 1);
        this.log(`⏳ Esperando ${delay}ms antes de reintentar...`);
        await this.sleep(delay);
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    await this.updatePendingCount();

    return {
      success: false,
      message: 'No se pudo sincronizar después de 3 intentos. Los datos están guardados localmente. Por favor, sincroniza mañana antes de iniciar nueva jornada.',
      pendingCount: this.pendingCount
    };
  }

  // ==================== SYNC EXECUTION ====================

  /**
   * Sincroniza solo si hay pendientes
   */
  private async syncIfPending(): Promise<boolean> {
    await this.updatePendingCount();

    if (this.pendingCount > 0 && !this.isSyncing) {
      const result = await this.syncAll();
      return result.success;
    }

    return false;
  }

  /**
   * Sincroniza todas las lecturas y excepciones pendientes
   */
  async syncAll(): Promise<{
    success: boolean;
    syncedReadings: number;
    syncedExceptions: number;
    failedReadings: number;
    error?: string;
  }> {
    if (this.isSyncing) {
      this.log('⚠️ Ya hay un sync en progreso');
      return { success: false, syncedReadings: 0, syncedExceptions: 0, failedReadings: 0, error: 'Sync en progreso' };
    }

    // Verificar conectividad
    if (!navigator.onLine) {
      this.log('❌ Sin conexión a internet');
      return { success: false, syncedReadings: 0, syncedExceptions: 0, failedReadings: 0, error: 'Sin conexión' };
    }

    this.isSyncing = true;

    this.emitEvent({
      type: 'sync_started',
      timestamp: new Date().toISOString(),
      data: { pendingCount: this.pendingCount }
    });

    try {
      // Obtener datos pendientes
      const [pendingReadings, pendingExceptions] = await Promise.all([
        db.getPendingReadings(),
        db.getPendingExceptions()
      ]);

      this.log(`📤 Sincronizando ${pendingReadings.length} lecturas y ${pendingExceptions.length} excepciones`);

      if (pendingReadings.length === 0 && pendingExceptions.length === 0) {
        this.isSyncing = false;
        return { success: true, syncedReadings: 0, syncedExceptions: 0, failedReadings: 0 };
      }

      // Preparar request
      const syncRequest: BulkSyncRequest = {
        operator_id: pendingReadings[0]?.operator_id || 0,
        date: new Date().toISOString().split('T')[0],
        readings: pendingReadings.map(r => {
          // Remover campos que no se envían
          const { id, synced, ...rest } = r;
          return rest;
        }),
        exceptions: pendingExceptions.map(e => {
          const { id, synced, ...rest } = e;
          return rest;
        }),
        device_info: {
          platform: typeof window !== 'undefined' ? navigator.platform : 'unknown',
          app_version: '1.0.0',
          sync_timestamp: new Date().toISOString()
        }
      };

      // Enviar al backend
      const response = await this.sendToBackend(syncRequest);

      if (!response.success) {
        throw new Error('Error en respuesta del servidor');
      }

      // Marcar como sincronizadas
      const syncedReadingIds = pendingReadings
        .filter(r => !response.failed_readings?.some(f => f.local_id === r.local_id))
        .map(r => r.local_id);

      const syncedExceptionIds = pendingExceptions.map(e => e.local_id);

      await Promise.all([
        db.markReadingsAsSynced(syncedReadingIds),
        db.markExceptionsAsSynced(syncedExceptionIds)
      ]);

      this.lastSyncTime = new Date();
      await this.updatePendingCount();

      const result = {
        success: true,
        syncedReadings: syncedReadingIds.length,
        syncedExceptions: syncedExceptionIds.length,
        failedReadings: response.failed_readings?.length || 0
      };

      this.log(`✅ Sync completado: ${result.syncedReadings} lecturas, ${result.syncedExceptions} excepciones`);

      this.emitEvent({
        type: 'sync_completed',
        timestamp: new Date().toISOString(),
        data: result
      });

      return result;

    } catch (error) {
      this.log(`❌ Error en sync: ${error}`);

      this.emitEvent({
        type: 'sync_failed',
        timestamp: new Date().toISOString(),
        data: { error: String(error) }
      });

      return {
        success: false,
        syncedReadings: 0,
        syncedExceptions: 0,
        failedReadings: 0,
        error: String(error)
      };

    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Envía datos al backend
   */
  private async sendToBackend(request: BulkSyncRequest): Promise<BulkSyncResponse> {
    // TODO: Implementar llamada real al API
    // Por ahora, simulamos la respuesta
    
    const endpoint = '/api/portal/readings/bulk';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Incluir token JWT aquí
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private getAuthToken(): string {
    // TODO: Obtener token del authStore
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token') || '';
    }
    return '';
  }

  // ==================== STATUS & MONITORING ====================

  /**
   * Obtiene el estado actual de sincronización
   */
  async getStatus(): Promise<SyncStatus> {
    await this.updatePendingCount();

    const [stats] = await Promise.all([
      db.getStorageStats()
    ]);

    const connectionType = this.getConnectionType();

    return {
      pending_readings: stats.readings.pending,
      pending_exceptions: stats.exceptions.pending,
      last_sync: this.lastSyncTime?.toISOString() || null,
      sync_in_progress: this.isSyncing,
      next_auto_sync: this.autoSyncTimer ? 
        new Date(Date.now() + this.config.autoSyncInterval).toISOString() : 
        undefined,
      connection_type: connectionType,
      can_sync: navigator.onLine && !this.isSyncing
    };
  }

  /**
   * Actualiza el conteo de pendientes
   */
  private async updatePendingCount(): Promise<void> {
    const [readings, exceptions] = await Promise.all([
      db.getPendingReadings(),
      db.getPendingExceptions()
    ]);

    this.pendingCount = readings.length + exceptions.length;
  }

  /**
   * Obtiene el tipo de conexión
   */
  private getConnectionType(): 'wifi' | '4g' | '3g' | 'offline' {
    if (!navigator.onLine) return 'offline';

    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      const type = connection?.type || connection?.effectiveType;

      if (type === 'wifi') return 'wifi';
      if (type === '4g' || type === 'lte') return '4g';
      if (type === '3g') return '3g';
    }

    return '4g'; // Default
  }

  // ==================== EVENT SYSTEM ====================

  /**
   * Registra un listener para eventos de sync
   */
  on(listener: SyncEventListener): () => void {
    this.listeners.push(listener);

    // Retorna función para desregistrar
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emite un evento a todos los listeners
   */
  private emitEvent(event: SyncEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error en listener de SyncManager:', error);
      }
    });
  }

  // ==================== UTILITIES ====================

  /**
   * Logging condicional
   */
  private log(message: string, data?: any): void {
    if (this.config.enableLogs) {
      if (data) {
        console.log(`[SyncManager] ${message}`, data);
      } else {
        console.log(`[SyncManager] ${message}`);
      }
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== DIAGNOSTICS ====================

  /**
   * Obtiene información de diagnóstico
   */
  async getDiagnostics(): Promise<{
    config: SyncConfig;
    status: SyncStatus;
    storage: Awaited<ReturnType<typeof db.getStorageStats>>;
    lastSync: string | null;
    isRunning: boolean;
  }> {
    const [status, storage] = await Promise.all([
      this.getStatus(),
      db.getStorageStats()
    ]);

    return {
      config: this.config,
      status,
      storage,
      lastSync: this.lastSyncTime?.toISOString() || null,
      isRunning: this.autoSyncTimer !== null
    };
  }
}

// Singleton instance
let syncManagerInstance: SyncManager | null = null;

export function getSyncManager(config?: Partial<SyncConfig>): SyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new SyncManager(config);
  }
  return syncManagerInstance;
}

export function resetSyncManager(): void {
  if (syncManagerInstance) {
    syncManagerInstance.stop();
    syncManagerInstance = null;
  }
}
