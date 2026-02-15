# Portal de Clientes - Servicios Públicos

Portal web Next.js para que los clientes consulten su consumo, facturas y perfil.

## Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utility-first
- **Recharts** - Gráficos de consumo
- **Axios** - Cliente HTTP para API

## Instalación

### Opción 1: Con Docker (Recomendado)

Ya está configurado en `docker-compose.yml` del proyecto principal.

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

El portal estará disponible en: http://localhost:3000

### Opción 2: Local (Desarrollo)

```bash
cd app_agua_luz

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con la URL de tu backend Odoo

# Ejecutar en modo desarrollo
npm run dev
```

## Configuración

### Variables de Entorno

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8069
NEXT_PUBLIC_APP_NAME=Portal de Servicios
```

## Estructura del Proyecto

```
app_agua_luz/
├── app/                    # App Router de Next.js 14
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx    # Página de login
│   ├── dashboard/
│   │   ├── page.tsx        # Dashboard principal
│   │   ├── consumption/    # Historial de consumo
│   │   ├── invoices/       # Facturas
│   │   └── profile/        # Perfil del cliente
│   ├── layout.tsx          # Layout principal
│   └── page.tsx            # Página de inicio
├── components/             # Componentes reutilizables
│   ├── ui/                 # Componentes UI base
│   ├── charts/             # Gráficos con Recharts
│   └── layout/             # Layout components
├── lib/                    # Utilidades y servicios
│   ├── api.ts              # Cliente API (Axios)
│   ├── auth.ts             # Gestión de autenticación
│   └── utils.ts            # Funciones auxiliares
├── types/                  # TypeScript types
│   └── index.ts
├── public/                 # Archivos estáticos
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Funcionalidades

### 1. Autenticación
- Login con email y contraseña
- JWT con refresh token
- Sesión persistente en localStorage
- Logout automático al expirar

### 2. Dashboard
- Resumen de consumo actual
- Últimas facturas
- Medidores activos
- Alertas de deuda

### 3. Historial de Consumo
- Gráfico de barras mensual
- Gráfico de línea de tendencia
- Tabla detallada
- Filtros por medidor y periodo
- Comparación año anterior

### 4. Facturas
- Lista de facturas (pagadas/pendientes)
- Descarga de PDF
- Estado de pago
- Historial completo

### 5. Perfil
- Datos personales
- Medidores asociados
- Cambio de contraseña
- Datos de contacto

## Flujo de Autenticación

```
1. Usuario ingresa email y contraseña
   ↓
2. POST /api/portal/auth/login
   ↓
3. Backend valida y retorna access_token + refresh_token
   ↓
4. Tokens se guardan en localStorage
   ↓
5. Access token se envía en header Authorization
   ↓
6. Si expira, se usa refresh_token automáticamente
   ↓
7. Si refresh falla, redirect a login
```

## API Endpoints Utilizados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/portal/auth/login` | Login |
| POST | `/api/portal/auth/refresh` | Renovar token |
| GET | `/api/portal/customer/me` | Datos del cliente |
| GET | `/api/portal/consumption/history` | Historial consumo |
| GET | `/api/portal/invoices` | Lista de facturas |
| GET | `/api/portal/invoice/{id}/pdf` | Descargar factura |

## Desarrollo

### Agregar nueva página

```bash
# Crear nueva ruta
mkdir -p app/dashboard/nueva-pagina
touch app/dashboard/nueva-pagina/page.tsx
```

### Ejemplo de componente con API

```typescript
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ConsumoPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/consumption/history?months=12');
        setData(response.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      {/* Render data */}
    </div>
  );
}
```

## Estilos con Tailwind

El proyecto usa Tailwind CSS para estilos. Ejemplo:

```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">
    Consumo Mensual
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Content */}
  </div>
</div>
```

## Gráficos con Recharts

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function ConsumptionChart({ data }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="consumption" stroke="#8884d8" />
    </LineChart>
  );
}
```

## Deploy en Producción

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

Ya incluido en `docker-compose.yml`:

```yaml
inversiones:
  build: ./app_agua_luz
  ports:
    - "3000:3000"
  environment:
    - NEXT_PUBLIC_API_URL=http://odoo:8069
```

## Troubleshooting

### Error de CORS

Si hay problemas de CORS, verificar que Odoo tenga configurado:

```python
headers={
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

### Token expirado

El sistema maneja automáticamente la renovación con refresh token. Si persiste el error, el usuario debe hacer login nuevamente.

### API no responde

Verificar que Odoo esté corriendo:

```bash
docker-compose logs -f odoo
```

## Próximas Mejoras

- [ ] Notificaciones push
- [ ] Chat de soporte
- [ ] Historial de pagos
- [ ] Configuración de alertas personalizadas
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)
- [ ] Multiidioma (español/inglés)

## Soporte

Para problemas técnicos:
- Backend API: Ver `extra-addons/utility_api_portal/README.md`
- Frontend: Revisar logs en consola del navegador
- Docker: `docker-compose logs -f inversiones`

---

**Portal listo para uso con las 3 fases del sistema completadas** 🎉
