# 🚀 GUÍA DE DESPLIEGUE A VERCEL

## ❓ ¿El problema de CORS seguirá en Vercel?

**Respuesta corta**: **NO** si usas el proxy de Next.js (configurado en [`next.config.mjs`](next.config.mjs:1))

**Respuesta larga**: Depende de cómo configures la aplicación.

---

## 🔄 OPCIONES DE ARQUITECTURA

### Opción 1: Con Proxy de Next.js (Recomendado) ✅

**Cómo funciona**:
```
Usuario → tu-app.vercel.app/api/odoo → Vercel → Odoo Backend
```

**Ventajas**:
- ✅ Sin problemas de CORS
- ✅ Configuración simple
- ✅ Headers de seguridad controlados

**Desventajas**:
- ⚠️ Timeout de 10 segundos (Vercel Hobby)
- ⚠️ Timeout de 60 segundos (Vercel Pro)
- ⚠️ Requests pasan por Vercel Edge

**Configuración actual** (Ya está en [`next.config.mjs`](next.config.mjs:1)):
```javascript
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/odoo/:path*',
        destination: 'https://bot-odoo.2fsywk.easypanel.host/api/:path*',
      },
    ];
  },
};
```

### Opción 2: Llamadas Directas al Backend (Requiere CORS) ⚠️

**Cómo funciona**:
```
Usuario → Odoo Backend (directo desde el browser)
```

**Ventajas**:
- ✅ Sin límites de timeout de Vercel
- ✅ Requests directos, más rápidos

**Desventajas**:
- ❌ Requiere configurar CORS en Odoo
- ❌ Expone URL del backend al público
- ⚠️ Más complejo de configurar

---

## 📋 CHECKLIST PARA DESPLEGAR A VERCEL

### Paso 1: Preparar Variables de Entorno

#### En Local (`.env.local`):
```env
# Para desarrollo con proxy
NEXT_PUBLIC_API_URL=http://localhost:3000/api/odoo
```

#### En Vercel (Environment Variables):

**Opción A: Con Proxy** (Recomendado)
```env
NEXT_PUBLIC_API_URL=https://tu-app.vercel.app/api/odoo
```

**Opción B: Sin Proxy** (Llamadas directas)
```env
NEXT_PUBLIC_API_URL=https://bot-odoo.2fsywk.easypanel.host
```

### Paso 2: Configurar CORS en Odoo (Solo si usas Opción B)

Si decides NO usar el proxy, debes agregar el dominio de Vercel a ALLOWED_ORIGINS en Odoo:

#### En Easypanel (bot-odoo → Environment):
```env
ALLOWED_ORIGINS=https://tu-app.vercel.app,https://tu-app-staging.vercel.app
```

#### O en código Python:
```python
# extra-addons/utility_api_portal/controllers/api_portal.py
ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://tu-app.vercel.app',
    'https://tu-app-staging.vercel.app'
]
```

### Paso 3: Crear `.vercelignore`

```bash
# Crear archivo .vercelignore en app_agua_luz/
cat > app_agua_luz/.vercelignore << 'EOF'
# Node modules
node_modules

# Next.js build output
.next
out

# Environment files
.env
.env.local
.env.*.local

# Testing
coverage
.nyc_output

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
.DS_Store
*.pem

# IDE
.vscode
.idea
EOF
```

### Paso 4: Configurar `vercel.json` (Opcional)

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://tu-app.vercel.app/api/odoo"
  }
}
```

---

## 🚀 PASOS PARA DESPLEGAR

### 1. Subir a GitHub

```bash
# Inicializar git (si no está)
cd app_agua_luz
git init

# Agregar archivos
git add .
git commit -m "Initial commit - Portal Agua y Luz"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/app-agua-luz.git
git branch -M main
git push -u origin main
```

### 2. Conectar con Vercel

1. Ir a [vercel.com](https://vercel.com)
2. **Import Git Repository**
3. Seleccionar tu repositorio `app-agua-luz`
4. **Framework Preset**: Next.js (auto-detectado)
5. **Root Directory**: `./` (o `app_agua_luz` si el repo incluye más carpetas)

### 3. Configurar Variables de Entorno en Vercel

En **Settings → Environment Variables**:

```
NEXT_PUBLIC_API_URL = https://tu-app.vercel.app/api/odoo
```

O si prefieres llamadas directas:

```
NEXT_PUBLIC_API_URL = https://bot-odoo.2fsywk.easypanel.host
```

### 4. Deploy

Click **Deploy** y espera 2-3 minutos.

---

## 🧪 PROBAR DESPUÉS DEL DEPLOY

### Test 1: Verificar Proxy

```bash
# Hacer request al proxy
curl https://tu-app.vercel.app/api/odoo/portal/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Test 2: Login desde el Browser

1. Abrir: `https://tu-app.vercel.app/login`
2. Ingresar credenciales
3. Verificar en DevTools → Network:
   - Request URL debería ser: `https://tu-app.vercel.app/api/odoo/portal/auth/login`
   - Status: 200 (si credenciales correctas) o 401 (si incorrectas)

---

## ⚠️ PROBLEMAS COMUNES EN VERCEL

### 1. Error 504 Gateway Timeout

**Causa**: Request a Odoo tarda más de 10 segundos (Hobby) o 60 segundos (Pro)

**Solución**:
- Optimizar queries en Odoo
- Upgrade a Vercel Pro ($20/mes)
- Usar llamadas directas sin proxy

### 2. Error CORS (si usas llamadas directas)

**Causa**: Odoo no tiene configurado el dominio de Vercel en ALLOWED_ORIGINS

**Solución**:
```bash
# En Easypanel bot-odoo
ALLOWED_ORIGINS=https://tu-app.vercel.app
```

### 3. Variables de Entorno No Funcionan

**Causa**: Olvidaste agregar `NEXT_PUBLIC_` al nombre

**Solución**:
```env
# ❌ Incorrecto
API_URL=https://...

# ✅ Correcto
NEXT_PUBLIC_API_URL=https://...
```

### 4. Build Falla

**Error Común**:
```
Type error: ... is not assignable to type ...
```

**Solución**:
```bash
# Verificar que compile localmente
npm run build

# Si hay errores de TypeScript, corregirlos antes de deploy
```

---

## 📊 COMPARACIÓN DE OPCIONES

| Característica | Con Proxy | Sin Proxy (Directo) |
|----------------|-----------|---------------------|
| **CORS** | ✅ No necesita | ❌ Requiere config |
| **Timeout** | ⚠️ 10-60 seg | ✅ Sin límite |
| **Velocidad** | ⚠️ +50ms latencia | ✅ Directo |
| **Seguridad** | ✅ URL oculta | ⚠️ URL expuesta |
| **Configuración** | ✅ Simple | ⚠️ Compleja |
| **Recomendado para** | MVP, desarrollo | Producción high-traffic |

---

## 🎯 RECOMENDACIÓN FINAL

### Para tu caso (Portal de Servicios):

**Fase 1: MVP/Testing** (Ahora)
- ✅ Usar **Proxy de Next.js**
- ✅ Vercel Hobby (gratis)
- ✅ Sin configurar CORS

**Fase 2: Producción** (Después de validar)
- 🔄 Evaluar si necesitas llamadas directas
- 🔄 Si >1000 usuarios: Vercel Pro + Llamadas directas
- 🔄 Si <1000 usuarios: Proxy es suficiente

---

## 📝 EJEMPLO DE FLUJO COMPLETO

### Desarrollo Local
```
Browser (localhost:3000)
  ↓
Next.js Dev Server
  ↓ Proxy
Odoo (bot-odoo.2fsywk.easypanel.host)
```

### Producción Vercel (Con Proxy)
```
Browser (cualquier ubicación)
  ↓
Vercel Edge (tu-app.vercel.app)
  ↓ Proxy Next.js
Odoo (bot-odoo.2fsywk.easypanel.host)
```

### Producción Vercel (Sin Proxy)
```
Browser (cualquier ubicación)
  ↓ Directo
Odoo (bot-odoo.2fsywk.easypanel.host)
  ← CORS configurado con tu-app.vercel.app
```

---

## ✅ CONCLUSIÓN

**¿El problema de CORS seguirá en Vercel?**

**NO**, si usas el proxy de Next.js (que ya está configurado en [`next.config.mjs`](next.config.mjs:1)).

El proxy funciona igual en:
- ✅ Desarrollo local (`localhost:3000`)
- ✅ Producción Vercel (`tu-app.vercel.app`)
- ✅ Preview deploys (`tu-app-git-branch.vercel.app`)

**Pasos para deploy sin CORS**:
1. Subir código a GitHub
2. Conectar con Vercel
3. Configurar `NEXT_PUBLIC_API_URL=https://tu-app.vercel.app/api/odoo`
4. Deploy ✅

**Cuando SÍ necesitarías configurar CORS**:
- Si decides hacer llamadas directas al backend (sin proxy)
- Si tienes una app móvil que llama directamente a Odoo
- Si tienes un dashboard en otro dominio

---

## 🔗 RECURSOS

- [Vercel Deployment Docs](https://nextjs.org/docs/deployment)
- [Next.js Rewrites](https://nextjs.org/docs/api-reference/next.config.js/rewrites)
- [Vercel Limits](https://vercel.com/docs/concepts/limits/overview)

---

**Última actualización**: 2026-02-15  
**Próximo paso**: Terminar de configurar proxy local y probar login, luego deploy a Vercel
