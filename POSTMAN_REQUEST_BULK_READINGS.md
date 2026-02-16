# Request Postman - Prueba Endpoint Bulk Readings

## 🔑 Token Obtenido
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo3LCJlbWFpbCI6InJhZmFAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzcxMjIwODc5LCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzcxMjE3Mjc5fQ.Bb4aDVmcpeEVd3PsQgsdMG2KKJvGXFnj1DpN2ikGIwE
```

---

## 📋 Configuración del Request en Postman

### 1. Información Básica
- **Método**: `POST`
- **URL**: `https://bot-odoo.2fsywk.easypanel.host/api/portal/readings/bulk`

### 2. Headers
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo3LCJlbWFpbCI6InJhZmFAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzcxMjIwODc5LCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzcxMjE3Mjc5fQ.Bb4aDVmcpeEVd3PsQgsdMG2KKJvGXFnj1DpN2ikGIwE
```

### 3. Body (raw - JSON)

#### Opción A: Lectura Simple (Sin fotos)
```json
{
  "readings": [
    {
      "local_id": "123e4567-e89b-12d3-a456-426614174000",
      "meter_id": 1,
      "value": 150.5,
      "timestamp": "2024-02-16T10:30:00Z",
      "latitude": -12.0464,
      "longitude": -77.0428,
      "accuracy": 10.5,
      "operator_id": 7,
      "operator_name": "rafa",
      "route_id": 1,
      "notes": "Lectura normal, medidor en buen estado"
    }
  ],
  "exceptions": [],
  "metadata": {
    "app_version": "1.0.0",
    "device_id": "test-device-001",
    "sync_timestamp": "2024-02-16T10:35:00Z"
  }
}
```

#### Opción B: Múltiples Lecturas
```json
{
  "readings": [
    {
      "local_id": "123e4567-e89b-12d3-a456-426614174001",
      "meter_id": 1,
      "value": 150.5,
      "timestamp": "2024-02-16T08:30:00Z",
      "latitude": -12.0464,
      "longitude": -77.0428,
      "accuracy": 10.5,
      "operator_id": 7,
      "operator_name": "rafa",
      "route_id": 1,
      "notes": "Primera lectura del día"
    },
    {
      "local_id": "123e4567-e89b-12d3-a456-426614174002",
      "meter_id": 2,
      "value": 200.3,
      "timestamp": "2024-02-16T08:45:00Z",
      "latitude": -12.0465,
      "longitude": -77.0429,
      "accuracy": 8.2,
      "operator_id": 7,
      "operator_name": "rafa",
      "route_id": 1,
      "notes": "Segunda lectura"
    },
    {
      "local_id": "123e4567-e89b-12d3-a456-426614174003",
      "meter_id": 3,
      "value": 75.8,
      "timestamp": "2024-02-16T09:00:00Z",
      "latitude": -12.0466,
      "longitude": -77.0430,
      "accuracy": 12.0,
      "operator_id": 7,
      "operator_name": "rafa",
      "route_id": 1,
      "notes": "Tercera lectura"
    }
  ],
  "exceptions": [],
  "metadata": {
    "app_version": "1.0.0",
    "device_id": "test-device-001",
    "sync_timestamp": "2024-02-16T09:05:00Z"
  }
}
```

#### Opción C: Lectura con Foto
```json
{
  "readings": [
    {
      "local_id": "123e4567-e89b-12d3-a456-426614174004",
      "meter_id": 1,
      "value": 150.5,
      "timestamp": "2024-02-16T10:30:00Z",
      "latitude": -12.0464,
      "longitude": -77.0428,
      "accuracy": 10.5,
      "operator_id": 7,
      "operator_name": "rafa",
      "route_id": 1,
      "photo_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "photo_filename": "medidor_1_20240216.jpg",
      "notes": "Lectura con foto del medidor"
    }
  ],
  "exceptions": [],
  "metadata": {
    "app_version": "1.0.0",
    "device_id": "test-device-001",
    "sync_timestamp": "2024-02-16T10:35:00Z"
  }
}
```

#### Opción D: Excepción (Medidor Inaccesible)
```json
{
  "readings": [],
  "exceptions": [
    {
      "local_id": "exception-001",
      "meter_id": 4,
      "type": "inaccessible",
      "description": "Medidor bloqueado por construcción",
      "timestamp": "2024-02-16T11:00:00Z",
      "latitude": -12.0467,
      "longitude": -77.0431,
      "accuracy": 15.0,
      "operator_id": 7,
      "operator_name": "rafa",
      "route_id": 1,
      "requires_supervisor": true,
      "photo_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "photo_filename": "excepcion_medidor_4.jpg"
    }
  ],
  "metadata": {
    "app_version": "1.0.0",
    "device_id": "test-device-001",
    "sync_timestamp": "2024-02-16T11:05:00Z"
  }
}
```

#### Opción E: Lectura con Consumo Anómalo (Requiere Revisión)
```json
{
  "readings": [
    {
      "local_id": "123e4567-e89b-12d3-a456-426614174005",
      "meter_id": 1,
      "value": 500.0,
      "timestamp": "2024-02-16T12:00:00Z",
      "latitude": -12.0464,
      "longitude": -77.0428,
      "accuracy": 10.5,
      "operator_id": 7,
      "operator_name": "rafa",
      "route_id": 1,
      "notes": "Lectura alta - posible fuga detectada",
      "anomaly_detected": true
    }
  ],
  "exceptions": [],
  "metadata": {
    "app_version": "1.0.0",
    "device_id": "test-device-001",
    "sync_timestamp": "2024-02-16T12:05:00Z"
  }
}
```

---

## 📊 Respuesta Esperada (Success)

```json
{
  "success": true,
  "data": {
    "synced_readings": [
      {
        "local_id": "123e4567-e89b-12d3-a456-426614174000",
        "odoo_id": 1234,
        "validation_status": "auto_approved",
        "validation_messages": ["Consumo dentro del rango normal (variación: +15%)"]
      }
    ],
    "synced_exceptions": [],
    "failed_readings": [],
    "failed_exceptions": [],
    "summary": {
      "total_readings": 1,
      "successful_readings": 1,
      "failed_readings": 0,
      "auto_approved": 1,
      "requires_review": 0,
      "total_exceptions": 0,
      "successful_exceptions": 0,
      "failed_exceptions": 0
    }
  }
}
```

---

## ⚠️ IMPORTANTE: Obtener IDs Reales de Medidores

Antes de probar con datos reales, necesitas obtener los IDs de los medidores de tu base de datos:

### Método 1: SQL Directo en Odoo
```sql
SELECT id, name, code, partner_id 
FROM utility_meter 
WHERE active = true 
LIMIT 10;
```

### Método 2: Interfaz de Odoo
1. Ir a: **Servicios Públicos → Medidores**
2. Abrir un medidor
3. Ver el ID en la URL: `/web#id=123&model=utility.meter`
4. Usar ese ID en el campo `meter_id` del request

### Método 3: Crear API para Obtener Medidores (Opcional)
Si necesitas una API para obtener la lista de medidores disponibles, puedo crear un endpoint adicional.

---

## 🔍 Verificación de Resultados

Después de enviar el request exitoso:

### 1. En Postman
- Verifica que el response tenga `"success": true`
- Guarda el `odoo_id` retornado
- Revisa el `validation_status` de cada lectura

### 2. En Odoo - Lecturas
1. Ir a: **Servicios Públicos → Lecturas de Medidores**
2. Buscar por el `odoo_id` retornado
3. Verificar:
   - ✅ Valor de lectura correcto
   - ✅ Coordenadas GPS guardadas
   - ✅ Estado de validación (draft/validated)
   - ✅ Notas guardadas
   - ✅ Foto adjunta (si aplica)

### 3. En Odoo - Excepciones
1. Ir a: **Servicios Públicos → Excepciones de Lectura**
2. Verificar:
   - ✅ Tipo de excepción correcto
   - ✅ Descripción guardada
   - ✅ Estado (pendiente/resuelta)
   - ✅ Foto adjunta (si aplica)

---

## 🐛 Posibles Errores

### Error 1: Meter not found
```json
{
  "success": false,
  "error": {
    "failed_readings": [
      {
        "local_id": "123...",
        "error": "Meter with ID 1 not found"
      }
    ]
  }
}
```
**Solución**: Usa un `meter_id` válido de tu base de datos.

### Error 2: Invalid token
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```
**Solución**: El token expiró (1 hora), haz login admin nuevamente.

### Error 3: Missing required fields
```json
{
  "success": false,
  "message": "Missing required fields: meter_id, value"
}
```
**Solución**: Verifica que todos los campos requeridos estén en el JSON.

---

## 📝 Notas Adicionales

1. **Timestamps**: Deben estar en formato ISO 8601 con timezone UTC (Z)
2. **Coordenadas**: Lima, Perú está aproximadamente en `-12.0464, -77.0428`
3. **Photo Base64**: El ejemplo es un pixel transparente de 1x1, reemplaza con una imagen real
4. **local_id**: Debe ser único (UUID v4), puedes generar en: https://www.uuidgenerator.net/

---

## ✅ Siguiente Paso

Una vez que confirmes que el endpoint funciona correctamente:
1. ✅ Verifica los datos en Odoo
2. ✅ Prueba diferentes escenarios (lecturas normales, anómalas, excepciones)
3. ✅ Confirma la validación automática por niveles
4. 🚀 Continuamos con la implementación de la UI (Fase 3)
