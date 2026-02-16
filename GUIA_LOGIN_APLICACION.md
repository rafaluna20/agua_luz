# 🔐 GUÍA DE LOGIN - Portal App Agua y Luz

## 📋 Sistema de Autenticación Dual

La aplicación tiene **DOS portales de ingreso separados** según el tipo de usuario:

### 1️⃣ Portal de Cliente (Usuario Final)
**URL**: `http://localhost:3000/login`

**Para**: Clientes que pagan servicios de agua y luz

**Funcionalidades**:
- ✅ Ver recibos y facturas
- ✅ Consultar historial de consumo
- ✅ Realizar pagos online
- ✅ Descargar PDFs de facturas
- ✅ Ver perfil y datos de medidores

### 2️⃣ Portal de Administrador (Gestión)
**URL**: `http://localhost:3000/login-admin`

**Para**: Personal administrativo de la empresa

**Funcionalidades**:
- ✅ Gestionar clientes
- ✅ Registrar lecturas de medidores
- ✅ Generar facturas masivas
- ✅ Ver reportes y dashboard
- ✅ Configurar sistema

---

## 🚀 CÓMO INICIAR LA APLICACIÓN

### Paso 1: Levantar el servidor Next.js

```bash
# Ir al directorio de la app
cd app_agua_luz

# Instalar dependencias (solo primera vez)
npm install

# Levantar servidor de desarrollo
npm run dev
```

**Resultado esperado**:
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.100:3000

✓ Ready in 2.3s
```

### Paso 2: Abrir en el navegador

Abre tu navegador en: **http://localhost:3000**

---

## 🏠 PÁGINA DE INICIO

Al abrir `http://localhost:3000` verás la página de inicio con:

```
┌─────────────────────────────────────────────┐
│         Portal de Servicios                  │
│         Agua y Luz                           │
│                                              │
│   [Soy Cliente] [Soy Administrador]         │
│                                              │
│   • Ver recibos                              │
│   • Pagar facturas                           │
│   • Consultar consumo                        │
└─────────────────────────────────────────────┘
```

**Opciones**:
- Click en **"Soy Cliente"** → Redirige a `/login`
- Click en **"Soy Administrador"** → Redirige a `/login-admin`

---

## 👤 LOGIN DE CLIENTE

### URL: `http://localhost:3000/login`

### Formulario de Login

```
┌─────────────────────────────────────┐
│   Inicio de Sesión - Cliente       │
│                                     │
│   Email:                            │
│   [___________________________]     │
│                                     │
│   Contraseña:                       │
│   [___________________________]     │
│                                     │
│   [🔒 Iniciar Sesión]              │
│                                     │
│   ¿Olvidaste tu contraseña?        │
└─────────────────────────────────────┘
```

### Credenciales de Prueba (Crear en Odoo)

**⚠️ IMPORTANTE**: Necesitas crear el cliente primero en Odoo.

#### Crear Cliente en Odoo:

1. Ir a Odoo → **Contactos**
2. Click **Crear**
3. Llenar datos:
   ```
   Nombre: Juan Pérez Cliente
   Email: cliente@test.com
   Tipo: Individuo
   ☑️ Portal de Cliente Activo
   ```
4. **Guardar**
5. Click botón **"Generar Contraseña Portal"**
6. **COPIAR LA CONTRASEÑA** que aparece (no se vuelve a mostrar)

#### Ejemplo de credenciales generadas:

```
Email: cliente@test.com
Contraseña: Abc123!@#XyZ  (ejemplo generado)
```

### Flujo de Login Cliente

```
1. Usuario ingresa email + contraseña
   ↓
2. Next.js envía POST a /api/portal/auth/login
   ↓
3. Odoo valida credenciales con bcrypt
   ↓
4. Si válido: Retorna access_token + refresh_token
   ↓
5. Next.js guarda tokens en cookies
   ↓
6. Redirige a /dashboard (vista cliente)
```

### Después del Login Exitoso

Redirige a: **`/dashboard`**

```
┌─────────────────────────────────────────────┐
│  Dashboard Cliente                           │
│  👤 Juan Pérez Cliente                       │
│                                              │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ Factura Pdte │  │  Último      │         │
│  │   S/ 85.50   │  │  Consumo     │         │
│  └──────────────┘  └──────────────┘         │
│                                              │
│  Mis Medidores:                              │
│  • MED-001 (Luz) - Activo                    │
│  • MED-002 (Agua) - Activo                   │
│                                              │
│  [Ver Recibos] [Pagar Ahora] [Consumo]      │
└─────────────────────────────────────────────┘
```

### Menú Cliente (Sidebar)

- 🏠 Dashboard
- 📄 Mis Recibos
- 💳 Realizar Pago
- 📊 Historial Consumo
- 👤 Mi Perfil

---

## 👨‍💼 LOGIN DE ADMINISTRADOR

### URL: `http://localhost:3000/login-admin`

### Formulario de Login

```
┌─────────────────────────────────────┐
│   Inicio de Sesión - Admin         │
│                                     │
│   Email:                            │
│   [___________________________]     │
│                                     │
│   Contraseña:                       │
│   [___________________________]     │
│                                     │
│   [🔑 Acceso Administrativo]       │
│                                     │
└─────────────────────────────────────┘
```

### Credenciales de Administrador

**⚠️ IMPORTANTE**: El admin debe ser un usuario de Odoo con permisos especiales.

#### Opción 1: Usar usuario admin de Odoo

```
Email: admin@tuempresa.com
Contraseña: (contraseña de Odoo admin)
```

#### Opción 2: Crear usuario admin específico

1. Ir a Odoo → **Usuarios**
2. Click **Crear**
3. Llenar datos:
   ```
   Nombre: Administrador Portal
   Email: admin-portal@test.com
   
   Grupos de acceso:
   ☑️ Utility Management / Admin
   ☑️ Portal Management / Admin
   ```
4. **Guardar**
5. Configurar contraseña

### Flujo de Login Admin

```
1. Admin ingresa email + contraseña
   ↓
2. Next.js envía POST a /api/portal/auth/login
   ↓
3. Odoo valida y verifica rol = "admin"
   ↓
4. Si válido: Retorna tokens + role: "admin"
   ↓
5. Middleware verifica role antes de acceder rutas /admin/*
   ↓
6. Redirige a /admin/dashboard
```

### Después del Login Admin

Redirige a: **`/admin/dashboard`**

```
┌─────────────────────────────────────────────┐
│  Dashboard Administrativo                    │
│  👨‍💼 Admin Portal                            │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Clientes │ │ Medidores│ │ Lecturas │    │
│  │   142    │ │   284    │ │   1,245  │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
│  Facturas del mes: S/ 12,450.00             │
│  Pendientes de pago: S/ 3,200.00            │
│                                              │
│  [Gestionar Clientes] [Lecturas] [Reportes] │
└─────────────────────────────────────────────┘
```

### Menú Admin (Sidebar)

- 📊 Dashboard
- 👥 Clientes
- 📟 Medidores
- 📖 Lecturas
- 📄 Facturas
- 📈 Reportes
- ⚙️ Configuración

---

## 🔐 DIFERENCIAS ENTRE CLIENTE Y ADMIN

| Característica | Cliente | Admin |
|----------------|---------|-------|
| **URL Login** | `/login` | `/login-admin` |
| **Dashboard** | `/dashboard` | `/admin/dashboard` |
| **Permisos** | Solo sus datos | Todos los datos |
| **Puede ver** | Sus facturas | Todas las facturas |
| **Puede hacer** | Pagar, descargar | Gestionar, configurar |
| **Rol en token** | `role: "cliente"` | `role: "admin"` |
| **Middleware** | Rutas `/dashboard/*`, `/recibos/*` | Rutas `/admin/*` |

---

## 🔒 SEGURIDAD IMPLEMENTADA

### Middleware de Protección

El archivo [`middleware.ts`](middleware.ts:1) protege las rutas:

```typescript
// Rutas públicas (sin autenticación)
const publicRoutes = ["/login", "/login-admin", "/"];

// Si no hay token y no es ruta pública → redirect /login
if (!accessToken && !isPublicRoute) {
  const loginUrl = pathname.startsWith("/admin") 
    ? "/login-admin" 
    : "/login";
  return NextResponse.redirect(new URL(loginUrl, request.url));
}

// Verificar rol en el token
const payload = decodeToken(accessToken);

// Admin intentando acceder rutas cliente → redirect /admin/dashboard
if (pathname.startsWith("/admin") && userRole !== "admin") {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

// Cliente intentando acceder rutas admin → redirect /dashboard
if (isClientRoute && userRole !== "cliente") {
  return NextResponse.redirect(new URL("/admin/dashboard", request.url));
}
```

### Tokens JWT

**Access Token**:
- Duración: 15 minutos
- Guardado en: Cookie `access_token`
- Uso: Autorización en cada request

**Refresh Token**:
- Duración: 30 días
- Guardado en: Cookie `refresh_token`
- Uso: Renovar access token cuando expira

---

## 🧪 CÓMO PROBAR EL SISTEMA

### Test 1: Login Cliente

```bash
# Paso 1: Levantar app
cd app_agua_luz
npm run dev

# Paso 2: Abrir navegador
# http://localhost:3000

# Paso 3: Click "Soy Cliente"
# Redirige a /login

# Paso 4: Ingresar credenciales (crear primero en Odoo)
Email: cliente@test.com
Contraseña: (generada en Odoo)

# Paso 5: Click "Iniciar Sesión"
# Debe redirigir a /dashboard
```

### Test 2: Login Admin

```bash
# Paso 1: En http://localhost:3000
# Click "Soy Administrador"

# Paso 2: Redirige a /login-admin

# Paso 3: Ingresar credenciales admin de Odoo
Email: admin@tuempresa.com
Contraseña: (contraseña de Odoo)

# Paso 4: Click "Acceso Administrativo"
# Debe redirigir a /admin/dashboard
```

### Test 3: Protección de Rutas

```bash
# Sin login, intentar acceder dashboard
# http://localhost:3000/dashboard
# → Debe redirigir a /login ✅

# Login como cliente, intentar acceder admin
# http://localhost:3000/admin/dashboard
# → Debe redirigir a /dashboard ✅

# Login como admin, intentar acceder rutas cliente
# http://localhost:3000/dashboard
# → Debe redirigir a /admin/dashboard ✅
```

---

## 🐛 TROUBLESHOOTING

### Problema 1: "Credenciales inválidas"

**Posibles causas**:
1. Email no existe en Odoo
2. Contraseña incorrecta
3. Cliente no tiene `portal_active = True`
4. Backend Odoo no está corriendo

**Solución**:
```bash
# Verificar que Odoo esté corriendo
curl https://bot-odoo-odoo.2fsywk.easypanel.host/web/health

# Verificar en Odoo que el cliente existe:
# Contactos → Buscar email → Verificar "Portal Activo"
```

### Problema 2: "Error de conexión"

**Causa**: Frontend no puede conectar con backend Odoo

**Solución**:
```bash
# Verificar variable de entorno
cat app_agua_luz/.env.local

# Debe tener:
NEXT_PUBLIC_API_URL=https://bot-odoo-odoo.2fsywk.easypanel.host
```

### Problema 3: Redirige inmediatamente a login después de ingresar

**Causa**: Token no se guarda correctamente en cookies

**Solución**:
```bash
# Verificar en DevTools (F12) → Application → Cookies
# Debe aparecer:
# - access_token
# - refresh_token

# Si no aparecen, verificar configuración CORS en Odoo
```

### Problema 4: "Cannot read properties of undefined"

**Causa**: Estructura de respuesta de Odoo diferente a la esperada

**Solución**:
```bash
# Ver consola del navegador (F12) → Network
# Click en request "login"
# Ver respuesta del servidor

# Debe ser formato:
{
  "success": true,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "customer": { ... }
  }
}
```

---

## 📝 CREAR USUARIOS DE PRUEBA

### Script para crear cliente de prueba

En Odoo, ir a **Settings → Technical → Python Code** y ejecutar:

```python
# Crear cliente de prueba
partner = env['res.partner'].create({
    'name': 'Juan Pérez Test',
    'email': 'cliente@test.com',
    'phone': '+51987654321',
    'street': 'Av. Test 123',
    'city': 'Lima',
    'country_id': env.ref('base.pe').id,
    'portal_active': True,
})

# Generar contraseña
partner.action_generate_portal_password()

# La contraseña aparecerá en la notificación
# COPIARLA antes de cerrar
```

### Asignar medidores al cliente

```python
# Crear medidor de luz
meter_luz = env['utility.meter'].create({
    'name': 'MED-TEST-001',
    'service_type': 'electricity',
    'customer_id': partner.id,
    'state': 'active',
    'location_description': 'Departamento 101',
})

# Crear medidor de agua
meter_agua = env['utility.meter'].create({
    'name': 'MED-TEST-002',
    'service_type': 'water',
    'customer_id': partner.id,
    'state': 'active',
    'location_description': 'Departamento 101',
})
```

---

## 🎯 PRÓXIMOS PASOS

Ahora que entiendes el sistema de login:

1. **Levantar la aplicación**:
   ```bash
   cd app_agua_luz
   npm run dev
   ```

2. **Crear usuarios de prueba en Odoo**

3. **Probar login de cliente** en `/login`

4. **Probar login de admin** en `/login-admin`

5. **Explorar funcionalidades**:
   - Cliente: Ver recibos, pagos, consumo
   - Admin: Gestionar clientes, lecturas, reportes

---

## 📚 ARCHIVOS RELEVANTES

| Archivo | Descripción |
|---------|-------------|
| [`app/login/page.tsx`](app/login/page.tsx:1) | Página login cliente |
| [`app/login-admin/page.tsx`](app/login-admin/page.tsx:1) | Página login admin |
| [`app/page.tsx`](app/page.tsx:1) | Página de inicio |
| [`middleware.ts`](middleware.ts:1) | Protección de rutas |
| [`lib/services/auth.service.ts`](lib/services/auth.service.ts:1) | Servicio autenticación |
| [`lib/services/api.ts`](lib/services/api.ts:1) | Cliente HTTP |

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de usar la aplicación, verifica:

- [ ] Backend Odoo corriendo en Easypanel
- [ ] Variable `NEXT_PUBLIC_API_URL` configurada
- [ ] Frontend Next.js corriendo (`npm run dev`)
- [ ] Al menos 1 cliente creado en Odoo con `portal_active = True`
- [ ] Contraseña generada para el cliente
- [ ] Usuario admin de Odoo con permisos

---

**Última actualización**: 2026-02-15  
**Versión**: 1.0  
**Próximo paso**: Levantar `npm run dev` y probar login
