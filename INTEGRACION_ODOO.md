# Integración con Backend Odoo - Portal de Servicios

## ✅ Problema de Estilos Resuelto

### Problema
Los estilos de Tailwind CSS no se estaban aplicando en el navegador. El archivo CSS generado contenía las directivas sin procesar (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).

### Solución
Cambié la configuración de PostCSS de formato ESM a CommonJS:
- ❌ Eliminado: `postcss.config.mjs`
- ✅ Creado: `postcss.config.js` con sintaxis `module.exports`

### Resultado
✅ Los estilos de Tailwind ahora se cargan correctamente
✅ Todos los gradientes, colores, botones y layouts responsive funcionan

---

## 🔗 Integración con Odoo Backend

### Backend URL
```
https://bot-odoo-odoo.2fsywk.easypanel.host
```

### Módulo de Odoo
El módulo `utility_api_portal` en la carpeta `extra-addons/utility_api_portal` proporciona los endpoints REST API.

### Endpoints Configurados

#### 1. Login de Cliente
```http
POST /api/portal/auth/login
Content-Type: application/json

{
  "email": "cliente@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 3600,
    "customer": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "cliente@example.com",
      "phone": "987654321",
      "meter_count": 2
    }
  }
}
```

#### 2. Refresh Token
```http
POST /api/portal/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

#### 3. Datos del Cliente
```http
GET /api/portal/customer/me
Authorization: Bearer eyJ...
```

#### 4. Historial de Consumo
```http
GET /api/portal/consumption/history?months=12&service_type=water
Authorization: Bearer eyJ...
```

#### 5. Facturas
```http
GET /api/portal/invoices?limit=12
Authorization: Bearer eyJ...
```

---

## 📝 Cambios Realizados

### 1. Variables de Entorno (`.env.local`)
```env
NEXT_PUBLIC_API_URL=https://bot-odoo-odoo.2fsywk.easypanel.host
NODE_ENV=development
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_APP_NAME=Portal de Servicios - Agua y Luz
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 2. Cliente API Actualizado (`lib/services/api.ts`)
- ✅ Manejo de respuestas de Odoo con formato `{ success: true, data: {...} }`
- ✅ Manejo de errores de Odoo con formato `{ success: false, error: { code, message } }`
- ✅ Interceptor para refresh automático de tokens
- ✅ CORS configurado para EasyPanel

### 3. Servicio de Autenticación Actualizado (`lib/services/auth.service.ts`)
- ✅ Transformación de respuesta de Odoo a formato de la aplicación
- ✅ Mapeo de `customer` de Odoo a `user` de Next.js
- ✅ Gestión de tokens JWT (access_token y refresh_token)

---

## 🔐 Seguridad Implementada en Odoo

El backend de Odoo incluye:

### Rate Limiting
- **Login**: 5 intentos cada 5 minutos por IP
- **API endpoints**: 60-100 requests por minuto por usuario

### Protecciones
- Tokens JWT con expiración
- Refresh tokens persistidos en base de datos
- Bloqueo de cuenta tras múltiples intentos fallidos
- Audit log de todas las acciones
- CORS configurado para dominios específicos

### Validaciones
- Password hashing seguro
- Validación de formato de email
- Protección contra SQL injection
- Sanitización de inputs

---

## 🧪 Pruebas Pendientes

### Paso 1: Verificar Backend de Odoo
Asegúrate de que el backend esté corriendo y accesible:
```bash
curl https://bot-odoo-odoo.2fsywk.easypanel.host/api/portal/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Paso 2: Crear Usuario de Prueba en Odoo
En Odoo, ir a:
1. **Contactos** → Crear nuevo contacto
2. Marcar como "Portal de Cliente Activo"
3. Configurar email y contraseña
4. Asignar medidores si es necesario

### Paso 3: Probar Login en la Aplicación
1. Abrir http://localhost:3000/login
2. Ingresar credenciales del cliente creado
3. Verificar que se generen los tokens correctamente
4. Verificar redirección al dashboard

---

## 🐛 Debugging

### Ver requests en consola del navegador
1. Abrir DevTools (F12)
2. Ir a la pestaña Network
3. Filtrar por "login"
4. Verificar request y response

### Errores Comunes

#### Error de CORS
**Síntoma**: `Access to XMLHttpRequest blocked by CORS policy`

**Solución**: En Odoo, verificar configuración de CORS en `extra-addons/utility_api_portal/controllers/api_portal.py`:
```python
ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    # Agregar dominio de producción aquí
]
```

#### Error 401 Unauthorized
**Síntoma**: `Credenciales inválidas`

**Posibles causas**:
1. Email o contraseña incorrectos
2. Cliente no tiene `portal_active = True` en Odoo
3. Contraseña no configurada correctamente en Odoo

#### Error de conexión
**Síntoma**: `Error de conexión. Por favor, verifica tu conexión a internet`

**Posibles causas**:
1. Backend de Odoo no está corriendo
2. URL incorrecta en `.env.local`
3. Firewall bloqueando la conexión

---

## 📋 Checklist de Producción

Antes de llevar a producción:

### Backend (Odoo)
- [ ] Configurar JWT_SECRET_KEY seguro en Odoo
- [ ] Configurar CORS con dominio de producción
- [ ] Habilitar HTTPS/SSL
- [ ] Configurar rate limiting apropiado
- [ ] Revisar logs de auditoría
- [ ] Configurar backup de base de datos

### Frontend (Next.js)
- [ ] Actualizar `NEXT_PUBLIC_API_URL` con URL de producción
- [ ] Habilitar `NODE_ENV=production`
- [ ] Configurar analytics si es necesario
- [ ] Configurar Sentry/error tracking
- [ ] Optimizar imágenes
- [ ] Configurar CI/CD

### Seguridad
- [ ] Revisar políticas de CORS
- [ ] Configurar Content Security Policy (CSP)
- [ ] Habilitar HTTPS
- [ ] Configurar headers de seguridad
- [ ] Revisar permisos de usuarios en Odoo

---

## 🚀 Próximos Pasos

1. **Probar autenticación** con credenciales reales de Odoo
2. **Implementar dashboard** con datos del cliente
3. **Integrar consumo** con gráficos de lecturas
4. **Implementar facturas** con descarga de PDF
5. **Integrar pagos** con Culqi/Niubiz (configurar en `.env.local`)
6. **Panel de administración** para gestión de clientes

---

## 📚 Documentación Adicional

- **API de Odoo**: `extra-addons/utility_api_portal/controllers/api_portal.py`
- **Modelos de Odoo**: `extra-addons/utility_api_portal/models/`
- **Tests de Odoo**: `extra-addons/utility_api_portal/tests/`
- **Configuración de Next.js**: `app_agua_luz/lib/config.ts`

---

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs de Odoo en EasyPanel
2. Revisar consola del navegador (F12)
3. Verificar que el módulo `utility_api_portal` esté instalado y actualizado en Odoo
4. Verificar que las variables de entorno estén correctamente configuradas

---

**Fecha de Actualización**: 2026-02-12  
**Estado**: ✅ Integración configurada - Pendiente de pruebas con backend real
