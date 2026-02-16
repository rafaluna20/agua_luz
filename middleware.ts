import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de autenticación y autorización
 * Protege rutas basadas en roles (cliente/admin)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Obtener tokens de las cookies
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Rutas públicas (no requieren autenticación)
  const publicRoutes = ["/login", "/login-admin", "/"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Si no hay token y la ruta no es pública, redirigir al login
  if (!accessToken && !isPublicRoute) {
    // Determinar a qué login redirigir basado en la ruta
    const loginUrl = pathname.startsWith("/admin") ? "/login-admin" : "/login";
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // Si hay token, decodificarlo para obtener el rol
  if (accessToken) {
    try {
      const payload = decodeToken(accessToken);
      
      if (!payload) {
        // Token inválido, limpiar cookies y redirigir
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        return response;
      }

      const userRole = payload.role;

      // Proteger rutas de admin
      if (pathname.startsWith("/admin")) {
        if (userRole !== "admin") {
          // Usuario no es admin, redirigir al dashboard de cliente
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }

      // Proteger rutas de cliente
      if (
        (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/recibos") ||
        pathname.startsWith("/pagos") ||
        pathname.startsWith("/consumo") ||
        pathname.startsWith("/perfil")) &&
        !pathname.startsWith("/admin")
      ) {
        if (userRole !== "cliente") {
          // Usuario no es cliente, redirigir al dashboard de admin
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
      }

      // Si está autenticado y visita una ruta de login, redirigir al dashboard correspondiente
      if (isPublicRoute && pathname !== "/") {
        const dashboardUrl = userRole === "admin" ? "/admin/dashboard" : "/dashboard";
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }
    } catch (error) {
      console.error("Error al procesar token en middleware:", error);
      
      // Si hay error procesando el token, limpiar cookies
      if (!isPublicRoute) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        return response;
      }
    }
  }

  return NextResponse.next();
}

/**
 * Decodifica un JWT token (sin verificación de firma)
 * Solo para leer el payload en el middleware
 */
function decodeToken(token: string): { role: string; user_id: number; email: string } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    
    // Reemplazar caracteres de base64url con base64 estándar
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    
    // Agregar padding si es necesario
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new Error("InvalidLengthError: Input base64url string is the wrong length to determine padding");
      }
      base64 += new Array(5 - pad).join("=");
    }
    
    // Decodificar base64 usando atob (disponible en edge runtime)
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    
    const payload = JSON.parse(jsonPayload);
    
    // Verificar que no haya expirado
    const currentTime = Date.now() / 1000;
    if (payload.exp && payload.exp < currentTime) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return null;
  }
}

/**
 * Configuración del matcher
 * Define qué rutas serán procesadas por el middleware
 */
export const config = {
  matcher: [
    /*
     * Match todas las rutas excepto:
     * - api (API routes)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - public (archivos públicos)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
