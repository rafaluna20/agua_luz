# Solución al Problema de Loop de Redirección

## Diagnóstico del Problema

✅ **LO QUE FUNCIONA**:
- Login backend exitoso (Odoo responde correctamente)
- Tokens JWT se guardan en cookies
- Usuario se guarda en localStorage
- Toda la lógica de autenticación funciona

❌ **EL PROBLEMA**:
Loop infinito de redirección entre `/login` y `/dashboard` causado por:

1. **Login Page** (línea 46-50): `useEffect` que redirige a dashboard si `isAuthenticated = true`
2. **Dashboard** (`ClienteLayoutWrapper`): Verifica auth y redirige a login si `isAuthenticated = false`
3. **Race condition**: El estado de Zustand no se sincroniza a tiempo

## Causa Raíz

El problema NO es que los datos no se guarden, sino un **problema de arquitectura**:

```typescript
// En login/page.tsx línea 46-50
useEffect(() => {
  if (isAuthenticated) {
    router.push("/dashboard");  // ← PROBLEMA: Compite con la redirección manual
  }
}, [isAuthenticated, router]);

// En onSubmit línea 68
router.push("/dashboard");  // ← Se ejecuta DESPUÉS del await login()
```

**Lo que sucede**:
1. Usuario hace login → `onSubmit` se ejecuta
2. `await login(data)` guarda tokens y usuario
3. Zustand actualiza `isAuthenticated = true`
4. `router.push("/dashboard")` intenta navegar
5. PERO el `useEffect` también detecta `isAuthenticated = true` 
6. Ambos intentan navegar simultáneamente
7. Next.js entra en loop al intentar cargar `/dashboard` múltiples veces

## Solución Definitiva

Eliminar el `useEffect` problemático y usar solo redirección manual con `window.location.href`:

```typescript
// login/page.tsx - ELIMINAR ESTE useEffect
useEffect(() => {
  if (isAuthenticated) {
    router.push("/dashboard");
  }
}, [isAuthenticated, router]);

// Y en onSubmit usar window.location.href
const onSubmit = async (data: LoginFormData) => {
  try {
    await login(data);
    notifySuccess("Bienvenido", "Inicio de sesión exitoso");
    
    // Forzar recarga completa para evitar race conditions
    window.location.href = "/dashboard";
  } catch (error: any) {
    console.error("Error en login:", error);
  }
};
```

## Implementación

**Archivo a modificar**: `app_agua_luz/app/login/page.tsx`

**Paso 1**: Comentar/eliminar el useEffect de las líneas 46-50
**Paso 2**: Ya está implementado el window.location.href en onSubmit

## Por Qué window.location.href Funciona

- `router.push()`: Navegación SPA de Next.js (mantiene estado en memoria)
- `window.location.href`: Recarga COMPLETA de la página (reinicia todo)

Al hacer recarga completa:
1. Se destruye todo el estado en memoria
2. `/dashboard` carga desde cero
3. `ClienteLayoutWrapper` lee cookies/localStorage frescos
4. No hay race conditions ni loops

## Alternativa: Middleware

Otra opción es mover toda la lógica de protección al middleware de Next.js en lugar de componentes individuales, pero requiere refactorización mayor.
