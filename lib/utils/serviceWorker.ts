/**
 * Utilidades para registrar y gestionar el Service Worker
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker no soportado en este navegador');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('✅ Service Worker registrado:', registration);

    // Escuchar actualizaciones
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('🔄 Nueva versión del Service Worker encontrada');

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('✨ Nueva versión disponible. Recarga la página para actualizar.');
          
          // Notificar al usuario (opcional)
          if (confirm('Hay una nueva versión disponible. ¿Recargar ahora?')) {
            window.location.reload();
          }
        }
      });
    });

    // Registrar Background Sync si está soportado
    if ('sync' in registration) {
      try {
        // @ts-ignore - Background Sync API
        await registration.sync.register('sync-readings');
        console.log('✅ Background Sync registrado');
      } catch (error) {
        console.error('❌ Error registrando Background Sync:', error);
      }
    }

    // Registrar Periodic Background Sync si está soportado (experimental)
    if ('periodicSync' in registration) {
      try {
        // @ts-ignore - API experimental
        await registration.periodicSync.register('sync-readings-periodic', {
          minInterval: 60 * 60 * 1000, // 1 hora
        });
        console.log('✅ Periodic Background Sync registrado');
      } catch (error) {
        console.error('❌ Error registrando Periodic Background Sync:', error);
      }
    }

    return registration;
  } catch (error) {
    console.error('❌ Error registrando Service Worker:', error);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    
    if (success) {
      console.log('✅ Service Worker desregistrado');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error desregistrando Service Worker:', error);
    return false;
  }
}

/**
 * Solicita sincronización en background
 */
export async function requestBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.log('Background Sync no soportado');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-ignore - Background Sync API
    await registration.sync.register('sync-readings');
    console.log('✅ Background Sync solicitado');
  } catch (error) {
    console.error('❌ Error solicitando Background Sync:', error);
  }
}

/**
 * Escucha mensajes del Service Worker
 */
export function listenToServiceWorker(
  callback: (message: any) => void
): () => void {
  if (!('serviceWorker' in navigator)) {
    return () => {};
  }

  const messageHandler = (event: MessageEvent) => {
    callback(event.data);
  };

  navigator.serviceWorker.addEventListener('message', messageHandler);

  // Retornar función para limpiar el listener
  return () => {
    navigator.serviceWorker.removeEventListener('message', messageHandler);
  };
}

/**
 * Envia mensaje al Service Worker
 */
export async function sendMessageToServiceWorker(message: any): Promise<any> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker no soportado');
  }

  const registration = await navigator.serviceWorker.ready;
  
  if (!registration.active) {
    throw new Error('Service Worker no activo');
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    
    // Verificar que active no sea null antes de enviar
    if (registration.active) {
      registration.active.postMessage(message, [messageChannel.port2]);
    }
  });
}

/**
 * Verifica si el Service Worker está activo
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return !!registration.active;
  } catch {
    return false;
  }
}
