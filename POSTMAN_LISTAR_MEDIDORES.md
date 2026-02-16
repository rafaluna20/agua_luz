# Request Postman - Listar Medidores

## 🔑 Token Admin (Ya obtenido)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo3LCJlbWFpbCI6InJhZmFAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzcxMjIwODc5LCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzcxMjE3Mjc5fQ.Bb4aDVmcpeEVd3PsQgsdMG2KKJvGXFnj1DpN2ikGIwE
```

---

## 📋 Request 1: Listar Todos los Medidores

### Configuración Básica
- **Método**: `GET`
- **URL**: `https://bot-odoo.2fsywk.easypanel.host/api/portal/meters`

### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo3LCJlbWFpbCI6InJhZmFAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzcxMjIwODc5LCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzcxMjE3Mjc5fQ.Bb4aDVmcpeEVd3PsQgsdMG2KKJvGXFnj1DpN2ikGIwE
```

### Respuesta Esperada
```json
{
  "success": true,
  "data": {
    "meters": [
      {
        "id": 1,
        "code": "MED-001",
        "qr_code": "QR-001",
        "service_type": "electricity",
        "service_type_label": "Electricidad",
        "state": "active",
        "customer_name": "Juan Pérez",
        "customer_id": 10,
        "location": "Av. Principal 123",
        "latitude": -12.0464,
        "longitude": -77.0428,
        "last_reading_value": 1500.5,
        "last_reading_date": "2024-02-10"
      },
      {
        "id": 2,
        "code": "MED-002",
        "qr_code": "QR-002",
        "service_type": "water",
        "service_type_label": "Agua",
        "state": "active",
        "customer_name": "María López",
        "customer_id": 11,
        "location": "Jr. Los Olivos 456",
        "latitude": -12.0465,
        "longitude": -77.0429,
        "last_reading_value": 450.3,
        "last_reading_date": "2024-02-11"
      }
    ],
    "total": 150,
    "limit": 100,
    "offset": 0
  }
}
```

---

## 📋 Request 2: Listar Primeros 10 Medidores

### URL con Parámetros
```
https://bot-odoo.2fsywk.easypanel.host/api/portal/meters?limit=10&offset=0
```

### Headers
```
Authorization: Bearer [tu_token]
```

---

## 📋 Request 3: Filtrar por Tipo de Servicio (Solo Electricidad)

### URL con Parámetros
```
https://bot-odoo.2fsywk.easypanel.host/api/portal/meters?service_type=electricity&limit=50
```

### Headers
```
Authorization: Bearer [tu_token]
```

---

## 📋 Request 4: Filtrar por Tipo de Servicio (Solo Agua)

### URL con Parámetros
```
https://bot-odoo.2fsywk.easypanel.host/api/portal/meters?service_type=water&limit=50
```

---

## 📋 Request 5: Buscar Medidores por Código o Cliente

### Buscar "MED-001"
```
https://bot-odoo.2fsywk.easypanel.host/api/portal/meters?search=MED-001
```

### Buscar por nombre de cliente "Juan"
```
https://bot-odoo.2fsywk.easypanel.host/api/portal/meters?search=Juan
```

---

## 📋 Request 6: Paginación - Página 2 (registros 11-20)

### URL con Parámetros
```
https://bot-odoo.2fsywk.easypanel.host/api/portal/meters?limit=10&offset=10
```

---

## 🎯 Cómo Configurar en Postman

### Paso 1: Crear Nueva Request
1. Click en **"New"** → **"HTTP Request"**
2. Nombre: `Listar Medidores`

### Paso 2: Configurar URL
1. Método: **GET**
2. URL: `https://bot-odoo.2fsywk.easypanel.host/api/portal/meters`

### Paso 3: Agregar Header de Autorización
1. Tab **"Headers"**
2. Agregar:
   - Key: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Paso 4: Agregar Parámetros (Opcional)
1. Tab **"Params"**
2. Agregar los que necesites:
   - `limit`: 10
   - `offset`: 0
   - `service_type`: electricity o water
   - `search`: texto a buscar
   - `state`: active o inactive

### Paso 5: Enviar Request
1. Click en **"Send"**
2. Ver respuesta en el panel inferior

---

## 📊 Parámetros Disponibles

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | int | 100 | Cantidad máxima de registros (máx: 500) |
| `offset` | int | 0 | Número de registros a saltar (paginación) |
| `service_type` | string | - | Filtrar por tipo: `electricity` o `water` |
| `search` | string | - | Buscar en código, QR o nombre de cliente |
| `state` | string | active | Estado del medidor: `active` o `inactive` |

---

## 🔍 Ejemplo Completo en Postman

### Request
```
GET https://bot-odoo.2fsywk.easypanel.host/api/portal/meters?limit=5&service_type=electricity

Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response
```json
{
  "success": true,
  "data": {
    "meters": [
      {
        "id": 1,
        "code": "MED-001",
        "qr_code": "QR-001",
        "service_type": "electricity",
        "service_type_label": "Electricidad",
        "state": "active",
        "customer_name": "Juan Pérez",
        "customer_id": 10,
        "location": "Av. Principal 123",
        "latitude": -12.0464,
        "longitude": -77.0428,
        "last_reading_value": 1500.5,
        "last_reading_date": "2024-02-10"
      }
    ],
    "total": 45,
    "limit": 5,
    "offset": 0
  }
}
```

---

## ⚠️ Posibles Errores

### Error 1: Token Expirado
```json
{
  "success": false,
  "error": {
    "code": "unauthorized",
    "message": "No autenticado"
  }
}
```
**Solución**: Hacer login admin nuevamente para obtener un nuevo token.

### Error 2: Sin Permisos
```json
{
  "success": false,
  "error": {
    "code": "forbidden",
    "message": "Solo administradores pueden listar medidores"
  }
}
```
**Solución**: Asegúrate de usar el token de admin, no de cliente.

### Error 3: Parámetro Inválido
```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "service_type debe ser 'electricity' o 'water'"
  }
}
```
**Solución**: Verifica que los parámetros sean válidos.

---

## 💡 Uso Práctico

### 1. Obtener IDs de Medidores para Pruebas
```
GET /api/portal/meters?limit=10
```
Copia los IDs de los medidores para usar en tus pruebas de lecturas.

### 2. Verificar Última Lectura de un Medidor
```
GET /api/portal/meters?search=MED-001
```
Ve el campo `last_reading_value` y `last_reading_date`.

### 3. Listar Medidores de un Cliente Específico
```
GET /api/portal/meters?search=Juan
```
Filtra por nombre del cliente.

### 4. Paginación para Muchos Registros
```
Página 1: GET /api/portal/meters?limit=20&offset=0
Página 2: GET /api/portal/meters?limit=20&offset=20
Página 3: GET /api/portal/meters?limit=20&offset=40
```

---

## 📝 Datos Útiles para Request de Lecturas

Una vez que obtengas la lista de medidores, guarda estos datos:

| Campo | Uso en Request de Lecturas |
|-------|---------------------------|
| `id` | Campo `meter_id` requerido |
| `code` | Referencia visual (opcional) |
| `service_type` | Para saber si es agua o luz |
| `customer_name` | Identificar al cliente |
| `last_reading_value` | Para calcular consumo esperado |
| `latitude`, `longitude` | GPS esperado del medidor |

---

## ✅ Siguiente Paso

Una vez que tengas los IDs de los medidores:

1. ✅ Guarda al menos 3 IDs de medidores
2. 🚀 Usa esos IDs en el request de lecturas bulk
3. 📊 Continúa con [`POSTMAN_REQUEST_BULK_READINGS.md`](POSTMAN_REQUEST_BULK_READINGS.md)

---

## 🔄 Request Completo en cURL (Alternativo)

Si prefieres usar cURL en terminal:

```bash
curl -X GET "https://bot-odoo.2fsywk.easypanel.host/api/portal/meters?limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Con filtros:
```bash
curl -X GET "https://bot-odoo.2fsywk.easypanel.host/api/portal/meters?service_type=electricity&limit=5" \
  -H "Authorization: Bearer [tu_token]"
```
