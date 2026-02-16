# Configuración de Login para Administradores

## 📋 Estado Actual

Actualmente tienes configurado:
- ✅ **Login de Clientes**: `/api/portal/auth/login` → autentica clientes del portal (`res.partner` con `portal_active=True`)
- ❌ **Login de Admin**: Necesita implementarse

## 🎯 Opciones para Login de Administradores

### Opción 1: Endpoint Separado para Admins (Recomendado)

Crear `/api/portal/auth/admin-login` que autentique usuarios de Odoo (`res.users`) en lugar de partners.

**Ventajas:**
- Separación clara entre clientes y administradores
- Usa el sistema de autenticación nativo de Odoo
- Más seguro (solo usuarios con permisos específicos)

**Ubicación del código:**
`extra-addons/utility_api_portal/controllers/api_portal.py`

**Nuevo endpoint a agregar después del login actual:**

```python
@http.route('/api/portal/auth/admin-login', type='http', auth='none', methods=['POST'], csrf=False)
@ip_rate_limit(max_requests=5, window=300)
def admin_login(self, **kwargs):
    """
    Login de administrador con email y contraseña
    Autentica usuarios de Odoo (res.users) con permisos de utility
    """
    try:
        import json
        params = json.loads(request.httprequest.data.decode('utf-8'))
        login = params.get('email')
        password = params.get('password')
        
        if not login or not password:
            return self._error_response('Email y contraseña son obligatorios', 'missing_credentials')
        
        # Autenticar con el sistema nativo de Odoo
        try:
            uid = request.session.authenticate(request.session.db, login, password)
        except Exception as e:
            self._log_audit(
                'admin_login_failed',
                f'Intento fallido de login admin',
                success=False
            )
            return self._error_response('Credenciales inválidas', 'invalid_credentials', 401)
        
        if not uid:
            return self._error_response('Credenciales inválidas', 'invalid_credentials', 401)
        
        # Obtener usuario autenticado
        user = request.env['res.users'].sudo().browse(uid)
        
        # Verificar que tenga permisos de utility (puedes personalizar esto)
        # Opción 1: Verificar grupo específico
        utility_group = request.env.ref('utility_suite.group_utility_manager', raise_if_not_found=False)
        if utility_group and utility_group not in user.groups_id:
            return self._error_response('No tiene permisos de administrador', 'unauthorized', 403)
        
        # Generar tokens con rol de admin
        token_data = {
            'user_id': user.id,
            'email': user.login,
            'role': 'admin'  # Rol de administrador
        }
        access_token = self._create_access_token(token_data)
        refresh_token = self._create_refresh_token(token_data)
        
        # Persistir refresh token
        device_info = {
            'ip_address': self._get_client_ip(),
            'user_agent': request.httprequest.headers.get('User-Agent')
        }
        request.env['utility.jwt.refresh_token'].sudo().create_token(
            refresh_token=refresh_token,
            partner_id=user.partner_id.id,  # Usar el partner asociado al usuario
            expires_days=REFRESH_TOKEN_EXPIRE_DAYS,
            device_info=device_info
        )
        
        # Log exitoso
        self._log_audit(
            'admin_login_success',
            f'Login admin exitoso',
            customer_id=user.partner_id.id,
            success=True
        )
        
        return self._success_response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer',
            'expires_in': ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.login,
                'role': 'admin'
            }
        })
        
    except Exception as e:
        return self._handle_exception(e, "admin_login")
```

### Opción 2: Detectar Admin en el Endpoint Actual

Modificar el endpoint `/api/portal/auth/login` para detectar si el email corresponde a un usuario de Odoo con permisos de admin.

**Ventajas:**
- Un solo endpoint para todo
- Más simple en el frontend

**Desventajas:**
- Mezcla lógica de clientes y administradores
- Menos seguro (misma ruta para ambos)

## 🔧 Implementación Recomendada (Opción 1)

### Paso 1: Agregar el Endpoint de Admin en Odoo

1. Abre `extra-addons/utility_api_portal/controllers/api_portal.py`
2. Después de la función `login()` (alrededor de la línea 450), agrega el código del endpoint `admin_login()` mostrado arriba
3. Reinicia Odoo

### Paso 2: Configurar el Frontend

El frontend ya tiene preparado [`/login-admin`](app_agua_luz/app/login-admin/page.tsx:30), solo necesitas actualizar el endpoint:

**En `app_agua_luz/lib/config.ts`**, el endpoint ya existe:
```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/portal/auth/login",        // Para clientes
    LOGIN_ADMIN: "/portal/auth/admin-login",  // ✅ Ya configurado para admin
    REFRESH: "/portal/auth/refresh",
  },
  // ...
};
```

**En `app_agua_luz/lib/services/auth.service.ts`**, ya existe el método:
```typescript
async loginAdmin(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<any>(
    API_ENDPOINTS.AUTH.LOGIN_ADMIN,  // Usa el endpoint de admin
    credentials
  );
  // ... resto del código igual que login()
}
```

### Paso 3: Crear Grupo de Permisos en Odoo (Opcional pero Recomendado)

Si quieres controlar quién puede ser admin:

1. En Odoo, ve a **Configuración → Usuarios y Compañías → Grupos**
2. Busca o crea el grupo `utility_suite.group_utility_manager`
3. Asigna usuarios a este grupo

O simplemente permite que cualquier usuario de Odoo con acceso pueda ser admin (comenta las líneas de verificación de grupo en el código).

## 🧪 Cómo Probar

### Para Admin:
1. Ve a `http://localhost:3000/login-admin`
2. Ingresa credenciales de un usuario de Odoo:
   - Email: `admin@ejemplo.com` (el login del usuario de Odoo)
   - Password: contraseña del usuario de Odoo
3. Deberías ser redirigido a `/admin/dashboard`

### Para Cliente:
1. Ve a `http://localhost:3000/login`
2. Ingresa credenciales del cliente del portal:
   - Email: `cliente@test.com`
   - Password: `ieX8WJi4&fBC`
3. Deberías ser redirigido a `/dashboard`

## 📊 Diferencias Clave

| Aspecto | Cliente | Admin |
|---------|---------|-------|
| **Endpoint** | `/api/portal/auth/login` | `/api/portal/auth/admin-login` |
| **Modelo Odoo** | `res.partner` | `res.users` |
| **Campo de autenticación** | `email` + `portal_password` | `login` + password de Odoo |
| **Rol en token** | `"cliente"` | `"admin"` |
| **Dashboard** | `/dashboard` | `/admin/dashboard` |
| **Permisos** | Solo sus propios datos | Acceso completo a datos |

## ⚠️ Importante

- Los **clientes** usan un password específico del portal (`portal_password`) que se genera/cambia en Odoo
- Los **admins** usan el password normal de su usuario de Odoo
- Son sistemas de autenticación completamente separados por seguridad

## 🔐 Seguridad Adicional

Para mayor seguridad en el endpoint de admin:

1. **Verificar permisos específicos**:
```python
# Verificar que tenga acceso a la app utility
if not user.has_group('utility_suite.group_utility_user'):
    return self._error_response('No autorizado', 'unauthorized', 403)
```

2. **Limitar IPs permitidas** (si los admins siempre acceden desde la misma red):
```python
allowed_ips = ['192.168.1.0/24', '10.0.0.0/8']
client_ip = self._get_client_ip()
if client_ip not in allowed_ips:
    return self._error_response('IP no autorizada', 'unauthorized', 403)
```

3. **Require 2FA** (autenticación de dos factores) si Odoo lo tiene configurado

## 📝 Próximos Pasos

1. ✅ Agrega el endpoint `admin_login()` en `api_portal.py`
2. ✅ Reinicia Odoo
3. ✅ Crea un usuario de Odoo para probar
4. ✅ Prueba el login en `http://localhost:3000/login-admin`
5. ✅ Verifica que te redirija a `/admin/dashboard`

¿Necesitas ayuda para implementar alguno de estos pasos?
