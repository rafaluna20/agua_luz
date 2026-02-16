// Service Worker para sincronización en background
// Versión: 1.0.0

const CACHE_NAME = 'utility-readings-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Archivos a cachear para funcionamiento offline
const STATIC_ASSETS = [
  '/',
  '/login-admin',
  '/admin/lecturas/registrar',
  '/offline.html',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando archivos estáticos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Forzar activación inmediata
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Tomar control inmediatamente
  return self.clients.claim();
});

// Estrategia de caché: Network First con fallback a Cache
self.addEventListener('fetch', (event) => {
  // Ignorar requests que no sean GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorar requests a APIs externas
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear respuestas exitosas
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Si no hay en caché, mostrar página offline
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Background Sync para sincronizar lecturas
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-readings') {
    event.waitUntil(syncReadings());
  }
});

/**
 * Sincroniza lecturas pendientes con el servidor
 */
async function syncReadings() {
  console.log('[SW] Iniciando sincronización de lecturas...');
  
  try {
    // Obtener lecturas pendientes de IndexedDB
    const db = await openDatabase();
    const readings = await getPendingReadings(db);
    
    if (readings.length === 0) {
      console.log('[SW] No hay lecturas pendientes para sincronizar');
      return;
    }
    
    console.log(`[SW] Sincronizando ${readings.length} lecturas...`);
    
    // Obtener token de autenticación
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      console.error('[SW] No hay token de autenticación disponible');
      return;
    }
    
    // Enviar lecturas al servidor
    const response = await fetch('/api/portal/readings/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        readings: readings.map((r) => ({
          local_id: r.local_id,
          meter_id: r.meter_id,
          value: r.value,
          reading_date: r.reading_date,
          operator_id: r.operator_id,
          operator_name: r.operator_name,
          latitude: r.latitude,
          longitude: r.longitude,
          notes: r.notes,
          photo_base64: r.photo_base64,
          photo_filename: r.photo_filename,
        })),
        exceptions: [],
        metadata: {
          app_version: '1.0.0',
          device_id: 'sw-background',
          sync_timestamp: new Date().toISOString(),
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[SW] Sincronización exitosa:', result);
    
    // Marcar lecturas como sincronizadas
    await markReadingsAsSynced(db, readings.map((r) => r.local_id));
    
    // Notificar al cliente
    await notifyClients({
      type: 'SYNC_SUCCESS',
      syncedCount: readings.length,
    });
    
  } catch (error) {
    console.error('[SW] Error en sincronización:', error);
    
    // Notificar error al cliente
    await notifyClients({
      type: 'SYNC_ERROR',
      error: error.message,
    });
    
    throw error;
  }
}

/**
 * Abre la base de datos IndexedDB
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UtilityReadingsDB', 1);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Obtiene lecturas pendientes de IndexedDB
 */
function getPendingReadings(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['readings'], 'readonly');
    const store = transaction.objectStore('readings');
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Marca lecturas como sincronizadas
 */
async function markReadingsAsSynced(db, localIds) {
  const transaction = db.transaction(['readings'], 'readwrite');
  const store = transaction.objectStore('readings');
  
  for (const localId of localIds) {
    const getRequest = store.get(localId);
    
    await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const reading = getRequest.result;
        if (reading) {
          reading.synced = true;
          reading.updated_at = new Date().toISOString();
          store.put(reading);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Obtiene el token de acceso almacenado
 */
async function getAccessToken() {
  const cookies = await self.cookieStore?.getAll();
  
  if (cookies) {
    const accessTokenCookie = cookies.find((c) => c.name === 'access_token');
    if (accessTokenCookie) {
      return accessTokenCookie.value;
    }
  }
  
  // Fallback: buscar en localStorage a través de mensajes
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.accessToken);
      };
      
      clients[0].postMessage(
        { type: 'GET_ACCESS_TOKEN' },
        [messageChannel.port2]
      );
    });
  }
  
  return null;
}

/**
 * Notifica a todos los clientes activos
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage(message);
  });
}

// Periodic Background Sync (si está soportado)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic Sync event:', event.tag);
  
  if (event.tag === 'sync-readings-periodic') {
    event.waitUntil(syncReadings());
  }
});

// Notificaciones Push (para futuras mejoras)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
  };
  
  event.waitUntil(
    self.registration.showNotification('Lecturas de Medidores', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click');
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow('/admin/lecturas/registrar')
  );
});

console.log('[SW] Service Worker cargado correctamente');
