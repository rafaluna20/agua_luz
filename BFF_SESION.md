# Sesión segura: el navegador ya no toca los tokens

Antes el navegador guardaba el access/refresh token en cookies que JavaScript podía leer y los mandaba a Odoo. Un solo
fallo de XSS bastaba para robar sesiones. Desde 2026-09-26:

* El navegador **solo habla con este mismo dominio**: `/api/odoo/...` (`app/api/odoo/[...ruta]/route.ts`).
* Ese servidor intermedio (BFF) guarda los tokens en cookies **httpOnly** (JavaScript no las ve), agrega
  `Authorization` en cada llamada a Odoo y, si Odoo responde 401, **refresca la sesión solo** y reintenta una vez.
* Al iniciar sesión, la respuesta que llega al navegador **no lleva tokens**: solo el perfil (nombre, correo, rol).
* Solo se puede llegar a `/api/portal/**` de Odoo (no es un proxy abierto). Peticiones que cambian datos solo se aceptan
  del propio sitio (CSRF). Cuerpo máximo 12 MB. Errores hacia el navegador, siempre genéricos.
* El service worker ya no guarda respuestas de la API en caché (llevaban facturas y datos de clientes) y sincroniza las
  lecturas sin conexión por el BFF con la cookie de sesión.

## Configuración
* Variable de entorno **`ODOO_URL`** (solo servidor, p. ej. en Vercel). Si falta usa el host que estaba fijo antes.
* `NEXT_PUBLIC_API_URL` ya no se usa.

## Pruebas
`npm test` (33 pruebas: rutas permitidas, CSRF, cookies, refresco compartido, cierre de sesión, PDF, errores).

## Lo que NO cubre
* El perfil (nombre/correo/rol) sigue en `localStorage` solo para dibujar la pantalla: no es una credencial.
* El middleware decodifica el JWT sin verificar la firma: sirve para mostrar la pantalla correcta, no como barrera; la
  autorización real la aplica Odoo en cada llamada.
* Next 14.1.0 tiene avisos de seguridad conocidos: conviene actualizar a la última 14.2.x.
