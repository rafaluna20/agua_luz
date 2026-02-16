# Solución al Loop de Redirección - Dashboard

## 🎯 Problema Identificado

El sistema de login funcionaba correctamente (todos los tokens y datos se guardaban), pero había un **loop infinito de redirección** entre `/login` y `/dashboard` debido a una **competencia entre dos sistemas de navegación**.

## 🔧 Cambios Realizados

### 1. **app/login/page.tsx** - Página de Login
**Cambios clave:**
- ✅ **Reactivado** el `useEffect` para redirección automática
- ✅ Agregado `!isSubmitting` a las dependencias para evitar redirect durante el login
- ✅ Cambiado a `router.replace()` en lugar de `router.push()`
- ✅ **Eliminado** el redirect manual `window.location.href` del `onSubmit`
- ✅ Dejado que el `useEffect` maneje toda la lógica de navegación

```typescript
// ✅ CORRECTO: useEffect maneja la redirección basado en el estado
useEffect(() => {
  if (isAuthenticated && !isSubmitting) {
    console.log('✅ Usuario autenticado, redirigiendo a dashboard...');
    router.replace("/dashboard");  // replace en lugar de push
  }
}, [isAuthenticated, isSubmitting, router]);

const onSubmit = async (data: LoginFormData) => {
  try {
    await login(data);  // Solo hacer login
    notifySuccess("Bienvenido", "Inicio de sesión exitoso");
    // NO hacer redirect manual aquí - el useEffect lo maneja
  } catch (error: any) {
    console.error("❌ Error en login:", error);
  }
};
```

### 2. **components/layouts/ClienteLayoutWrapper.tsx** - Layout del Dashboard
**Cambios clave:**
- ✅ Agregado flag `hasChecked` para evitar verificaciones múltiples
- ✅ Aumentado timeout a 200ms para dar tiempo al estado
- ✅ Cambiado a `router.replace()` en lugar de `router.push()`
- ✅ Mejorado mensajes de loading con texto explicativo
- ✅ Verificación del estado directamente desde Zustand

```typescript
const [hasChecked, setHasChecked] = useState(false);

useEffect(() => {
  if (hasChecked) return;  // Solo verificar una vez
  
  checkAuth();
  setHasChecked(true);
  
  setTimeout(() => {
    setIsLoading(false);
    const authenticated = useAuthStore.getState().isAuthenticated;
    
    if (!authenticated) {
      router.replace("/login");  // replace en lugar de push
    }
  }, 200);  // 200ms de delay
}, [hasChecked, checkAuth, router]);
```

### 3. **lib/stores/authStore.ts** - Store de Autenticación
**Cambios clave:**
- ✅ Agregados logs detallados en método `login()`
- ✅ Agregados logs detallados en método `checkAuth()`
- ✅ Verificación del estado después de actualizar
- ✅ Mejor rastreo de errores

```typescript
login: async (credentials: LoginCredentials) => {
  console.log('🔐 AuthStore: Iniciando login...');
  // ... lógica de login
  
  if (response.success && response.user) {
    console.log('✅ AuthStore: Login exitoso, actualizando estado...');
    set({
      user: response.user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    
    // Verificación inmediata
    const currentState = get();
    console.log('🔍 AuthStore: Verificación final - isAuthenticated:', currentState.isAuthenticated);
  }
}
```

## 📋 Instrucciones para Probar

### Paso 1: Limpiar Estado Anterior
```bash
# En DevTools (F12) -> Consola
localStorage.clear();
document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"));
```

### Paso 2: Recargar la Página
Presiona `Ctrl + F5` para recargar completamente la aplicación.

### Paso 3: Intentar Login
1. Ve a `http://localhost:3000/login`
2. Ingresa las credenciales:
   - **Email:** `cliente@test.com`
   - **Password:** `ieX8WJi4&fBC`
3. Haz clic en "Iniciar Sesión"

### Paso 4: Observar los Logs en Consola
Deberías ver esta secuencia de logs:

```
🔐 AuthStore: Iniciando login...
🔍 Respuesta del servidor: {success: true, data: {...}}
📦 AuthStore: Respuesta del servicio: {success: true, hasUser: true}
✅ AuthStore: Login exitoso, actualizando estado...
✅ AuthStore: Estado actualizado, isAuthenticated=true, user: cliente@test.com
💾 Tokens guardados en cookies
💾 Usuario guardado en localStorage
✔️ Verificación inmediata - guardado: SÍ
🔍 AuthStore: Verificación final - isAuthenticated: true
✅ Usuario autenticado, redirigiendo a dashboard...
🔍 ClienteLayoutWrapper - verificando autenticación...
📊 AuthStore: checkAuth resultado - isAuth: true, user: cliente@test.com
⏰ Verificación completa, isAuthenticated: true
✅ Usuario autenticado, mostrando dashboard
```

## 🎯 Diferencias Clave vs Versión Anterior

| Aspecto | ❌ Anterior (con loop) | ✅ Actual (sin loop) |
|---------|----------------------|----------------------|
| Redirect en login | `window.location.href` + useEffect | Solo useEffect |
| Método de navegación | `router.push()` | `router.replace()` |
| Dependencias useEffect | `[isAuthenticated]` | `[isAuthenticated, isSubmitting]` |
| Verificación en Layout | Múltiples veces | Solo una vez con flag |
| Tiempo de espera | 100ms | 200ms |

## 🔑 Conceptos Clave

### 1. **router.replace() vs router.push()**
- `push()`: Agrega entrada al historial → botón "atrás" causa loops
- `replace()`: Reemplaza entrada actual → botón "atrás" funciona correctamente

### 2. **Control de Ejecución única**
- Flag `hasChecked` previene múltiples verificaciones
- Dependencia `isSubmitting` previene redirect durante login

### 3. **Timing y Sincronización**
- localStorage/cookies necesitan tiempo para persistir
- 200ms es suficiente para sincronización de estado en Zustand

## 🐛 Si el Problema Persiste

### Verificar que el servidor Next.js esté actualizado:
```bash
# Detener el servidor (Ctrl+C en la terminal)
# Limpiar cache de Next.js
cd app_agua_luz
rm -rf .next

# Reinstalar dependencias (opcional)
npm install

# Reiniciar servidor
npm run dev
```

### Verificar configuración del proxy en `next.config.mjs`:
```javascript
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/odoo/portal/:path*',
        destination: 'https://bot-odoo.2fsywk.easypanel.host/api/portal/:path*',
      },
    ];
  },
};
```

### Verificar que los tokens se están guardando:
```javascript
// En DevTools Console
console.log('Cookies:', document.cookie);
console.log('LocalStorage:', localStorage.getItem('app_agua_luz_user'));
```

## ✅ Resultado Esperado

Después de hacer login exitosamente:
1. ✅ Los tokens se guardan en cookies
2. ✅ El usuario se guarda en localStorage
3. ✅ El estado de Zustand se actualiza (`isAuthenticated = true`)
4. ✅ El useEffect detecta el cambio y redirige a `/dashboard`
5. ✅ El `ClienteLayoutWrapper` verifica autenticación una sola vez
6. ✅ Se muestra el dashboard correctamente
7. ✅ NO hay loop de redirección

---

## 📝 Notas Adicionales

- Los logs de depuración se pueden eliminar una vez confirmado que funciona
- El sistema ahora es más robusto ante cambios de estado rápidos
- La autenticación persiste correctamente en refrescos de página
