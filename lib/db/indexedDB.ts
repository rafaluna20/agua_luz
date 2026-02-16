/**
 * IndexedDB Wrapper - Enterprise Grade
 * Maneja almacenamiento offline de lecturas, medidores y excepciones
 */

import { Reading, ReadingException, Meter, ReadingRoute } from '@/types/readings';

const DB_NAME = 'UtilityReadingsDB';
const DB_VERSION = 1;

// Nombres de los stores
export const STORES = {
  READINGS: 'readings',
  EXCEPTIONS: 'exceptions',
  METERS: 'meters',
  ROUTES: 'routes',
  SYNC_QUEUE: 'sync_queue',
} as const;

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Inicializa la base de datos IndexedDB
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Error abriendo IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB inicializado correctamente');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('🔄 Actualizando esquema de IndexedDB...');

        // Store: Lecturas
        if (!db.objectStoreNames.contains(STORES.READINGS)) {
          const readingsStore = db.createObjectStore(STORES.READINGS, {
            keyPath: 'local_id',
          });
          readingsStore.createIndex('meter_id', 'meter_id', { unique: false });
          readingsStore.createIndex('synced', 'synced', { unique: false });
          readingsStore.createIndex('reading_date', 'reading_date', { unique: false });
          readingsStore.createIndex('operator_id', 'operator_id', { unique: false });
          readingsStore.createIndex('validation_status', 'validation_status', { unique: false });
          console.log('✅ Store "readings" creado');
        }

        // Store: Excepciones
        if (!db.objectStoreNames.contains(STORES.EXCEPTIONS)) {
          const exceptionsStore = db.createObjectStore(STORES.EXCEPTIONS, {
            keyPath: 'local_id',
          });
          exceptionsStore.createIndex('meter_id', 'meter_id', { unique: false });
          exceptionsStore.createIndex('synced', 'synced', { unique: false });
          exceptionsStore.createIndex('exception_type', 'exception_type', { unique: false });
          console.log('✅ Store "exceptions" creado');
        }

        // Store: Medidores (cache)
        if (!db.objectStoreNames.contains(STORES.METERS)) {
          const metersStore = db.createObjectStore(STORES.METERS, {
            keyPath: 'id',
          });
          metersStore.createIndex('qr_code', 'qr_code', { unique: true });
          metersStore.createIndex('customer_id', 'customer_id', { unique: false });
          metersStore.createIndex('state', 'state', { unique: false });
          console.log('✅ Store "meters" creado');
        }

        // Store: Rutas
        if (!db.objectStoreNames.contains(STORES.ROUTES)) {
          const routesStore = db.createObjectStore(STORES.ROUTES, {
            keyPath: 'id',
          });
          routesStore.createIndex('operator_id', 'operator_id', { unique: false });
          routesStore.createIndex('date', 'date', { unique: false });
          routesStore.createIndex('status', 'status', { unique: false });
          console.log('✅ Store "routes" creado');
        }

        // Store: Cola de sincronización
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncQueueStore.createIndex('priority', 'priority', { unique: false });
          console.log('✅ Store "sync_queue" creado');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Obtiene una transacción de lectura/escritura
   */
  private async getTransaction(
    storeNames: string | string[],
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBTransaction> {
    const db = await this.init();
    return db.transaction(storeNames, mode);
  }

  /**
   * Obtiene un object store
   */
  private async getStore(
    storeName: string,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    const transaction = await this.getTransaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // ==================== READINGS ====================

  /**
   * Guarda una lectura en IndexedDB
   */
  async saveReading(reading: Reading): Promise<void> {
    const store = await this.getStore(STORES.READINGS, 'readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...reading,
        updated_at: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene todas las lecturas no sincronizadas
   */
  async getPendingReadings(): Promise<Reading[]> {
    const store = await this.getStore(STORES.READINGS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        // Filtrar lecturas no sincronizadas
        const readings = request.result.filter((r: Reading) => !r.synced);
        resolve(readings);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene lecturas por operador y fecha
   */
  async getReadingsByOperatorAndDate(operatorId: number, date: string): Promise<Reading[]> {
    const store = await this.getStore(STORES.READINGS);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const readings = request.result.filter(
          (r: Reading) =>
            r.operator_id === operatorId &&
            r.reading_date.startsWith(date)
        );
        resolve(readings);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Marca lecturas como sincronizadas
   */
  async markReadingsAsSynced(localIds: string[]): Promise<void> {
    const store = await this.getStore(STORES.READINGS, 'readwrite');

    const promises = localIds.map(
      (localId) =>
        new Promise<void>((resolve, reject) => {
          const getRequest = store.get(localId);

          getRequest.onsuccess = () => {
            const reading = getRequest.result;
            if (reading) {
              reading.synced = true;
              reading.updated_at = new Date().toISOString();

              const putRequest = store.put(reading);
              putRequest.onsuccess = () => resolve();
              putRequest.onerror = () => reject(putRequest.error);
            } else {
              resolve();
            }
          };

          getRequest.onerror = () => reject(getRequest.error);
        })
    );

    await Promise.all(promises);
  }

  /**
   * Elimina una lectura por su local_id
   */
  async deleteReading(localId: string): Promise<void> {
    const store = await this.getStore(STORES.READINGS, 'readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(localId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Elimina lecturas sincronizadas antiguas (> 7 días)
   */
  async cleanupOldSyncedReadings(): Promise<number> {
    const store = await this.getStore(STORES.READINGS, 'readwrite');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const readings = request.result;
        let deleted = 0;

        const promises = readings
          .filter(
            (r: Reading) =>
              r.synced && new Date(r.updated_at) < sevenDaysAgo
          )
          .map(
            (r: Reading) =>
              new Promise<void>((res, rej) => {
                const delRequest = store.delete(r.local_id);
                delRequest.onsuccess = () => {
                  deleted++;
                  res();
                };
                delRequest.onerror = () => rej(delRequest.error);
              })
          );

        Promise.all(promises)
          .then(() => resolve(deleted))
          .catch(reject);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ==================== EXCEPTIONS ====================

  /**
   * Guarda una excepción
   */
  async saveException(exception: ReadingException): Promise<void> {
    const store = await this.getStore(STORES.EXCEPTIONS, 'readwrite');

    return new Promise((resolve, reject) => {
      const request = store.put(exception);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene excepciones no sincronizadas
   */
  async getPendingExceptions(): Promise<ReadingException[]> {
    const store = await this.getStore(STORES.EXCEPTIONS);
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Marca excepciones como sincronizadas
   */
  async markExceptionsAsSynced(localIds: string[]): Promise<void> {
    const store = await this.getStore(STORES.EXCEPTIONS, 'readwrite');

    const promises = localIds.map(
      (localId) =>
        new Promise<void>((resolve, reject) => {
          const getRequest = store.get(localId);

          getRequest.onsuccess = () => {
            const exception = getRequest.result;
            if (exception) {
              exception.synced = true;

              const putRequest = store.put(exception);
              putRequest.onsuccess = () => resolve();
              putRequest.onerror = () => reject(putRequest.error);
            } else {
              resolve();
            }
          };

          getRequest.onerror = () => reject(getRequest.error);
        })
    );

    await Promise.all(promises);
  }

  // ==================== METERS (Cache) ====================

  /**
   * Guarda medidores en cache
   */
  async cacheMeters(meters: Meter[]): Promise<void> {
    const store = await this.getStore(STORES.METERS, 'readwrite');

    const promises = meters.map(
      (meter) =>
        new Promise<void>((resolve, reject) => {
          const request = store.put(meter);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
    );

    await Promise.all(promises);
  }

  /**
   * Obtiene medidor por QR code
   */
  async getMeterByQR(qrCode: string): Promise<Meter | null> {
    const store = await this.getStore(STORES.METERS);
    const index = store.index('qr_code');

    return new Promise((resolve, reject) => {
      const request = index.get(qrCode);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene todos los medidores en cache
   */
  async getAllMeters(): Promise<Meter[]> {
    const store = await this.getStore(STORES.METERS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpia cache de medidores
   */
  async clearMetersCache(): Promise<void> {
    const store = await this.getStore(STORES.METERS, 'readwrite');

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== ROUTES ====================

  /**
   * Guarda ruta del día
   */
  async saveRoute(route: ReadingRoute): Promise<void> {
    const store = await this.getStore(STORES.ROUTES, 'readwrite');

    return new Promise((resolve, reject) => {
      const request = store.put(route);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene ruta activa del operario
   */
  async getActiveRoute(operatorId: number, date: string): Promise<ReadingRoute | null> {
    const store = await this.getStore(STORES.ROUTES);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const routes = request.result.filter(
          (r: ReadingRoute) =>
            r.operator_id === operatorId &&
            r.date === date &&
            (r.status === 'pending' || r.status === 'in_progress')
        );

        resolve(routes[0] || null);
      };
      request.onerror = () => reject(request.error);
    });
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
    const [allReadings, allExceptions, allMeters] = await Promise.all([
      this.getStore(STORES.READINGS).then(
        (store) =>
          new Promise<Reading[]>((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          })
      ),
      this.getStore(STORES.EXCEPTIONS).then(
        (store) =>
          new Promise<ReadingException[]>((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          })
      ),
      this.getAllMeters(),
    ]);

    return {
      readings: {
        total: allReadings.length,
        pending: allReadings.filter((r) => !r.synced).length,
        synced: allReadings.filter((r) => r.synced).length,
      },
      exceptions: {
        total: allExceptions.length,
        pending: allExceptions.filter((e) => !e.synced).length,
      },
      meters: allMeters.length,
    };
  }

  /**
   * Limpia toda la base de datos (usar con cuidado)
   */
  async clearAllData(): Promise<void> {
    const storeNames = [
      STORES.READINGS,
      STORES.EXCEPTIONS,
      STORES.METERS,
      STORES.ROUTES,
      STORES.SYNC_QUEUE,
    ];

    const promises = storeNames.map((storeName) =>
      this.getStore(storeName, 'readwrite').then(
        (store) =>
          new Promise<void>((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          })
      )
    );

    await Promise.all(promises);
    console.log('🗑️ Toda la data offline ha sido eliminada');
  }
}

// Singleton instance
export const db = new IndexedDBManager();
