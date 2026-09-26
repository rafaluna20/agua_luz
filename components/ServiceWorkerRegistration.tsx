"use client";

import { useEffect } from "react";
import {
  registerServiceWorker,
  listenToServiceWorker,
  requestBackgroundSync,
} from "@/lib/utils/serviceWorker";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Registrar Service Worker solo en producción o cuando se necesite
    const shouldRegister = process.env.NODE_ENV === 'production' || 
                          process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

    if (!shouldRegister) {
      console.log('Service Worker deshabilitado en desarrollo');
      return;
    }

    // Registrar el Service Worker
    registerServiceWorker().then((registration) => {
      if (registration) {
        console.log('✅ Service Worker registrado correctamente');
      }
    });

    // Escuchar mensajes del Service Worker
    const unsubscribe = listenToServiceWorker((message) => {
      console.log('📩 Mensaje del Service Worker:', message);

      switch (message.type) {
        case 'SYNC_SUCCESS':
          console.log(`✅ Sincronizadas ${message.syncedCount} lecturas en background`);
          // Aquí podrías mostrar una notificación al usuario
          break;

        case 'SYNC_ERROR':
          console.error('❌ Error en sincronización background:', message.error);
          break;

        default:
          console.log('Mensaje no manejado:', message);
      }
    });

    // Solicitar sincronización en background cuando se cierre la ventana
    const handleBeforeUnload = () => {
      if (navigator.onLine) {
        requestBackgroundSync();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Este componente no renderiza nada
  return null;
}
