# Guía de Testing con Postman - Sistema de Lecturas

## 📋 Preparación

### 1. Asegurar que Odoo esté corriendo

```bash
# Verificar que Odoo esté activo
# El endpoint debe responder en: http://localhost:8069

# O verificar con curl:
curl http://localhost:8069/web/database/selector
```

### 2. Reiniciar Odoo para cargar el nuevo endpoint

```bash
# Detener Odoo (Ctrl+C en la terminal donde corre)
# Volver a iniciar Odoo

# El nuevo endpoint /api/portal/readings/bulk estará disponible
```

---

## 🔐 PASO 1: Autenticación (Obtener Token JWT)

### Request 1.1: Login como Admin

```http
POST http://localhost:8069/api/portal/auth/admin-login
Content-Type: application/json

{
  "email": "rafa@gmail.com",
  "password": "tu_password_aqui"
}
```

### Response esperada:

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo3LCJlbWFpbCI6InJhZmFAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzA4MTIzNDU2fQ.abcdef123456",
    "refresh_token": "...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": 7,
      "name": "Rafael",
      "email": "rafa@gmail.com",
      "role": "admin"
    }
  }
}
```

### ⚠️ IMPORTANTE: Copiar el `access_token`

```
access_token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Lo usaremos en todos los requests siguientes.

---

## 📊 PASO 2: Verificar Medidores Disponibles

Antes de crear lecturas, necesitamos IDs de medidores reales.

### Request 2.1: Listar Medidores

```http
GET http://localhost:8069/web#action=utility_suite.action_utility_meter
```

O directamente en Odoo:
1. Ir a **Utility → Medidores**
2. Anotar algunos IDs de medidores (ej: 1, 2, 3)

**Datos necesarios para pruebas:**
- `meter_id`: 1, 2, 3 (IDs reales de tu BD)
- `meter_code`: Códigos de medidores (ej: "MED-001", "MED-002")

---

## 🧪 PASO 3: Probar Endpoint de Sincronización en Lote

### Test 3.1: Caso Exitoso - 1 Lectura Simple

```http
POST http://localhost:8069/api/portal/readings/bulk
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (TU TOKEN AQUÍ)

{
  "operator_id": 7,
  "date": "2026-02-16",
  "readings": [
    {
      "local_id": "550e8400-e29b-41d4-a716-446655440000",
      "meter_id": 1,
      "meter_code": "MED-001",
      "value": 1523.5,
      "reading_date": "2026-02-16T10:30:00",
      "operator_id": 7,
      "operator_name": "Juan Pérez",
      "latitude": -12.0464,
      "longitude": -77.0428,
      "notes": "Lectura de prueba normal",
      "device_info": {
        "platform": "Postman Test",
        "userAgent": "Postman",
        "appVersion": "1.0.0"
      },
      "validation_status": "valid",
      "validation_messages": [],
      "created_at": "2026-02-16T10:30:00",
      "updated_at": "2026-02-16T10:30:00"
    }
  ],
  "exceptions": [],
  "device_info": {
    "platform": "Postman",
    "app_version": "1.0.0",
    "sync_timestamp": "2026-02-16T17:00:00"
  }
}
```

### Response esperada:

```json
{
  "success": true,
  "data": {
    "synced_readings": 1,
    "synced_exceptions": 0,
    "failed_readings": [],
    "validation_summary": {
      "auto_approved": 1,
      "requires_review": 0,
      "rejected": 0
    },
    "server_timestamp": "2026-02-16T17:01:23"
  }
}
```

### ✅ Verificar en Odoo:

1. Ir a **Utility → Lecturas** (utility.reading)
2. Buscar la lectura recién creada
3. Verificar:
   - Estado: `validated` (auto-aprobada)
   - Valor: 1523.5
   - Operador: Juan Pérez
   - GPS: -12.0464, -77.0428

---

### Test 3.2: Múltiples Lecturas

```http
POST http://localhost:8069/api/portal/readings/bulk
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "operator_id": 7,
  "date": "2026-02-16",
  "readings": [
    {
      "local_id": "550e8400-e29b-41d4-a716-446655440001",
      "meter_id": 1,
      "meter_code": "MED-001",
      "value": 1530.0,
      "reading_date": "2026-02-16T11:00:00",
      "operator_id": 7,
      "operator_name": "Juan Pérez",
      "notes": "Lectura 1"
    },
    {
      "local_id": "550e8400-e29b-41d4-a716-446655440002",
      "meter_id": 2,
      "meter_code": "MED-002",
      "value": 2345.8,
      "reading_date": "2026-02-16T11:15:00",
      "operator_id": 7,
      "operator_name": "Juan Pérez",
      "notes": "Lectura 2"
    },
    {
      "local_id": "550e8400-e29b-41d4-a716-446655440003",
      "meter_id": 3,
      "meter_code": "MED-003",
      "value": 987.3,
      "reading_date": "2026-02-16T11:30:00",
      "operator_id": 7,
      "operator_name": "Juan Pérez",
      "notes": "Lectura 3"
    }
  ],
  "exceptions": [],
  "device_info": {
    "platform": "Postman",
    "app_version": "1.0.0",
    "sync_timestamp": "2026-02-16T17:00:00"
  }
}
```

### Response esperada:

```json
{
  "success": true,
  "data": {
    "synced_readings": 3,
    "synced_exceptions": 0,
    "failed_readings": [],
    "validation_summary": {
      "auto_approved": 3,
      "requires_review": 0,
      "rejected": 0
    },
    "server_timestamp": "2026-02-16T17:01:45"
  }
}
```

---

### Test 3.3: Lectura con Consumo Anormal (Alta)

Esta lectura debe ser marcada para revisión.

```http
POST http://localhost:8069/api/portal/readings/bulk
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "operator_id": 7,
  "date": "2026-02-16",
  "readings": [
    {
      "local_id": "550e8400-e29b-41d4-a716-446655440010",
      "meter_id": 1,
      "meter_code": "MED-001",
      "value": 5000.0,
      "reading_date": "2026-02-16T12:00:00",
      "operator_id": 7,
      "operator_name": "Juan Pérez",
      "notes": "ALERTA: Consumo muy alto, verificar"
    }
  ],
  "exceptions": [],
  "device_info": {
    "platform": "Postman",
    "app_version": "1.0.0",
    "sync_timestamp": "2026-02-16T17:00:00"
  }
}
```

### Response esperada:

```json
{
  "success": true,
  "data": {
    "synced_readings": 1,
    "synced_exceptions": 0,
    "failed_readings": [],
    "validation_summary": {
      "auto_approved": 0,
      "requires_review": 1,  // ← Marcada para revisión
      "rejected": 0
    },
    "server_timestamp": "2026-02-16T17:02:10"
  }
}
```

### ✅ Verificar en Odoo:

1. La lectura debe tener:
   - Estado: `draft`
   - Campo `requires_review`: True
   - Campo `review_priority`: `high` o `low`
   - Notas con mensaje de alerta

---

### Test 3.4: Excepción (Medidor Inaccesible)

```http
POST http://localhost:8069/api/portal/readings/bulk
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "operator_id": 7,
  "date": "2026-02-16",
  "readings": [],
  "exceptions": [
    {
      "local_id": "660e8400-e29b-41d4-a716-446655440001",
      "meter_id": 4,
      "meter_code": "MED-004",
      "operator_id": 7,
      "exception_type": "no_access",
      "description": "Cliente ausente, puerta cerrada",
      "latitude": -12.0465,
      "longitude": -77.0429,
      "created_at": "2026-02-16T12:30:00",
      "requires_followup": false
    }
  ],
  "device_info": {
    "platform": "Postman",
    "app_version": "1.0.0",
    "sync_timestamp": "2026-02-16T17:00:00"
  }
}
```

### Response esperada:

```json
{
  "success": true,
  "data": {
    "synced_readings": 0,
    "synced_exceptions": 1,
    "failed_readings": [],
    "validation_summary": {
      "auto_approved": 0,
      "requires_review": 0,
      "rejected": 0
    },
    "server_timestamp": "2026-02-16T17:02:45"
  }
}
```

### ✅ Verificar en Odoo:

1. Ir a **Utility → Excepciones** (utility.reading.exception)
2. Debe existir la excepción con:
   - Tipo: `no_access`
   - Descripción: "Cliente ausente..."
   - Medidor: MED-004

---

### Test 3.5: Lectura con Foto (Base64)

```http
POST http://localhost:8069/api/portal/readings/bulk
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "operator_id": 7,
  "date": "2026-02-16",
  "readings": [
    {
      "local_id": "550e8400-e29b-41d4-a716-446655440020",
      "meter_id": 1,
      "meter_code": "MED-001",
      "value": 1540.0,
      "reading_date": "2026-02-16T13:00:00",
      "operator_id": 7,
      "operator_name": "Juan Pérez",
      "notes": "Lectura con foto",
      "photo_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "photo_filename": "test_lectura_med001.jpg"
    }
  ],
  "exceptions": [],
  "device_info": {
    "platform": "Postman",
    "app_version": "1.0.0",
    "sync_timestamp": "2026-02-16T17:00:00"
  }
}
```

**Nota:** El `photo_base64` del ejemplo es una imagen 1x1 pixel roja. Para pruebas reales, usa: https://www.base64-image.de/

### ✅ Verificar en Odoo:

1. Ir a la lectura creada
2. Debe tener un adjunto (ir.attachment) asociado
3. Verificar que se puede descargar la imagen

---

### Test 3.6: Error - Medidor No Encontrado

```http
POST http://localhost:8069/api/portal/readings/bulk
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "operator_id": 7,
  "date": "2026-02-16",
  "readings": [
    {
      "local_id": "550e8400-e29b-41d4-a716-446655440030",
      "meter_id": 99999,
      "meter_code": "MED-NOEXISTE",
      "value": 100.0,
      "reading_date": "2026-02-16T14:00:00",
      "operator_id": 7,
      "operator_name": "Juan Pérez"
    }
  ],
  "exceptions": [],
  "device_info": {
    "platform": "Postman",
    "app_version": "1.0.0",
    "sync_timestamp": "2026-02-16T17:00:00"
  }
}
```

### Response esperada:

```json
{
  "success": true,
  "data": {
    "synced_readings": 0,
    "synced_exceptions": 0,
    "failed_readings": [
      {
        "local_id": "550e8400-e29b-41d4-a716-446655440030",
        "error": "Medidor 99999 no encontrado"
      }
    ],
    "validation_summary": {
      "auto_approved": 0,
      "requires_review": 0,
      "rejected": 1
    },
    "server_timestamp": "2026-02-16T17:03:20"
  }
}
```

---

### Test 3.7: Error - Sin Autenticación

```http
POST http://localhost:8069/api/portal/readings/bulk
Content-Type: application/json
# SIN Authorization header

{
  "operator_id": 7,
  "date": "2026-02-16",
  "readings": [...]
}
```

### Response esperada:

```json
{
  "success": false,
  "error": {
    "code": "unauthorized",
    "message": "No autenticado"
  }
}
```

**HTTP Status:** 401 Unauthorized

---

### Test 3.8: Error - JSON Inválido

```http
POST http://localhost:8069/api/portal/readings/bulk
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI

{
  "operator_id": 7,
  "readings": [
    {
      "meter_id": 1,
      "value": "invalid_number"  // ← Error: no es número
    }
  ]
}
```

### Response esperada:

```json
{
  "success": false,
  "error": {
    "code": "invalid_json",
    "message": "JSON inválido: ..."
  }
}
```

**HTTP Status:** 400 Bad Request

---

## 📋 CHECKLIST DE PRUEBAS

### ✅ Autenticación
- [ ] Login exitoso con admin
- [ ] Token JWT recibido
- [ ] Token válido por 1 hora

### ✅ Lecturas Normales
- [ ] 1 lectura simple se crea correctamente
- [ ] Múltiples lecturas (3+) se crean en lote
- [ ] Lecturas tienen estado `validated` (auto-aprobadas)
- [ ] GPS se guarda correctamente

### ✅ Validación Automática
- [ ] Consumo normal → `auto_approved`
- [ ] Consumo alto → `requires_review` (low o high)
- [ ] Consumo muy alto → `requires_deep_review`
- [ ] Estado en Odoo refleja validación

### ✅ Excepciones
- [ ] Excepción `no_access` se crea
- [ ] Excepción `meter_damaged` requiere followup
- [ ] Descripción se guarda correctamente

### ✅ Fotos
- [ ] Foto en base64 se procesa
- [ ] Attachment se crea en Odoo
- [ ] Foto se puede descargar

### ✅ Errores
- [ ] Medidor inexistente → `failed_readings`
- [ ] Sin auth → 401
- [ ] JSON inválido → 400
- [ ] Datos incompletos → error claro

---

## 🔍 LOGS EN ODOO

Para ver los logs en tiempo real:

```bash
# En la terminal donde corre Odoo, verás logs como:

INFO db_akapallv1 odoo.addons.utility_api_portal.controllers.api_portal: 
📱 Bulk sync - Usuario: Rafael, Lecturas: 3, Excepciones: 1

INFO db_akapallv1 odoo.addons.utility_api_portal.controllers.api_portal: 
✅ Lectura creada - ID: 123, Medidor: MED-001, Valor: 1523.5, 
Estado: validated, Nivel: auto_approved

INFO db_akapallv1 odoo.addons.utility_api_portal.controllers.api_portal: 
✅ Excepción creada - ID: 45, Tipo: no_access

INFO db_akapallv1 odoo.addons.utility_api_portal.controllers.api_portal: 
📊 Bulk sync completado - Éxito: 3/3 lecturas, 1/1 excepciones
```

---

## 🐛 TROUBLESHOOTING

### Problema 1: 404 Not Found

**Causa:** Odoo no tiene el nuevo endpoint

**Solución:**
1. Verificar que el archivo `api_portal.py` tiene el método `bulk_sync_readings`
2. Reiniciar Odoo completamente
3. Verificar logs de Odoo al iniciar

---

### Problema 2: 500 Internal Server Error

**Causa:** Error en el código Python

**Solución:**
1. Ver logs de Odoo (terminal)
2. Buscar el traceback del error
3. Verificar que los modelos existen:
   - `utility.reading`
   - `utility.reading.exception`
   - `utility.meter`

---

### Problema 3: Token Expirado

**Síntoma:** 401 Unauthorized después de 1 hora

**Solución:**
1. Hacer login nuevamente
2. Obtener nuevo token
3. Actualizar en Postman

---

## 📊 VERIFICACIÓN FINAL

Después de todas las pruebas, verificar en Odoo:

```sql
-- Total de lecturas creadas
SELECT COUNT(*) FROM utility_reading;

-- Lecturas auto-aprobadas
SELECT COUNT(*) FROM utility_reading WHERE state = 'validated';

-- Lecturas que requieren revisión
SELECT COUNT(*) FROM utility_reading WHERE requires_review = true;

-- Excepciones creadas
SELECT COUNT(*) FROM utility_reading_exception;
```

O en la interfaz web:
1. **Utility → Lecturas**: Ver todas las lecturas
2. **Utility → Excepciones**: Ver todas las excepciones
3. Filtrar por fecha: "2026-02-16"
4. Verificar que los datos coinciden con lo enviado

---

## ✅ ÉXITO

Si todos los tests pasan, el backend está **100% funcional** y listo para:
- Integración con frontend
- Pruebas de carga
- Deploy a producción

---

**Versión:** 1.0.0  
**Fecha:** 2026-02-16
