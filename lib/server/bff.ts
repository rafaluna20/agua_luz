/**
 * Lógica pura del servidor intermedio (BFF) entre el navegador y Odoo.
 *
 * El navegador NUNCA ve los tokens: viven en cookies httpOnly que solo lee este servidor, que los agrega a cada
 * llamada a Odoo. Así, un fallo de XSS ya no puede robar la sesión.
 */

export const COOKIE_ACCESO = "access_token";
export const COOKIE_REFRESCO = "refresh_token";

/** Duración por defecto si Odoo no informa `expires_in`. */
export const SEGUNDOS_ACCESO_POR_DEFECTO = 15 * 60;
export const SEGUNDOS_REFRESCO = 7 * 24 * 60 * 60;

/** Tamaño máximo de un cuerpo que se reenvía a Odoo (las fotos de lecturas van en base64). */
export const MAX_BYTES_CUERPO = 12 * 1024 * 1024;

/**
 * Base de Odoo, solo del servidor. En producción ODOO_URL es obligatoria: antes caía a un host fijo (el Odoo de otra
 * empresa), así que olvidar la variable habría enviado los inicios de sesión al servidor equivocado. En desarrollo,
 * sin variable, se usa el Odoo local.
 */
export function urlOdoo(): string {
  const url = process.env.ODOO_URL?.trim();
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      console.error("BFF: falta la variable de entorno ODOO_URL (URL del Odoo al que apunta este portal).");
      throw new Error("ODOO_URL no está configurada");
    }
    return "http://localhost:8069";
  }
  return url.replace(/\/+$/, "");
}

/**
 * Ruta de Odoo a la que se puede llegar. Solo la API del portal (`/api/portal/...`): el BFF no es un proxy abierto.
 * Acepta `portal/x` (forma corta de los endpoints de auth) y `api/portal/x`. Devuelve `null` si no es válida.
 */
export function rutaDeOdoo(segmentos: string[]): string | null {
  if (!segmentos.length) return null;
  const partes = segmentos.flatMap((s) => {
    try {
      return decodeURIComponent(s).split("/");
    } catch {
      return ["%invalido"];
    }
  });
  if (partes.some((p) => p === "" || p === "." || p === ".." || p.includes("\\") || p.includes("%") || p.includes("\0"))) {
    return null;
  }
  const completa = partes[0] === "portal" ? ["api", ...partes] : partes;
  if (completa[0] !== "api" || completa[1] !== "portal" || completa.length < 3) return null;
  return "/" + completa.join("/");
}

export type TipoAuth = "login" | "admin-login" | "refresh" | "logout";

export function tipoAuth(ruta: string): TipoAuth | null {
  switch (ruta) {
    case "/api/portal/auth/login":
      return "login";
    case "/api/portal/auth/admin-login":
      return "admin-login";
    case "/api/portal/auth/refresh":
      return "refresh";
    case "/api/portal/auth/logout":
      return "logout";
    default:
      return null;
  }
}

export interface OpcionesCookie {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

export function opcionesCookie(maxAge: number): OpcionesCookie {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge };
}

/**
 * Protección contra CSRF para peticiones que cambian datos: deben venir de la propia web (mismo origen).
 * Además las cookies son SameSite=Lax, así que un formulario de otro sitio ni siquiera las enviaría.
 */
export function origenPermitido(metodo: string, cabeceras: { get(nombre: string): string | null }): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(metodo.toUpperCase())) return true;
  const sitio = cabeceras.get("sec-fetch-site");
  if (sitio) return sitio === "same-origin";
  const origen = cabeceras.get("origin");
  const host = cabeceras.get("x-forwarded-host") || cabeceras.get("host");
  if (!origen || !host) return false;
  try {
    return new URL(origen).host === host;
  } catch {
    return false;
  }
}

export interface SesionExtraida {
  /** Cuerpo sin los tokens: es lo único que llega al navegador. */
  cuerpo: unknown;
  acceso?: string;
  refresco?: string;
  expiraEn?: number;
}

/** Saca los tokens de la respuesta de login/refresh de Odoo (`{ success, data: { access_token, ... } }`). */
export function extraerSesion(respuesta: unknown): SesionExtraida {
  if (!respuesta || typeof respuesta !== "object") return { cuerpo: respuesta };
  const copia = JSON.parse(JSON.stringify(respuesta)) as Record<string, unknown>;
  const contenedor = (copia.data && typeof copia.data === "object" ? copia.data : copia) as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const acceso = texto(contenedor.access_token);
  const refresco = texto(contenedor.refresh_token);
  const expira = typeof contenedor.expires_in === "number" && contenedor.expires_in > 0 ? contenedor.expires_in : undefined;
  delete contenedor.access_token;
  delete contenedor.refresh_token;
  delete contenedor.token_type;
  return { cuerpo: copia, acceso, refresco, expiraEn: expira };
}

const CABECERAS_DE_ENTRADA = ["content-type", "accept", "accept-language"];
const CABECERAS_DE_SALIDA = ["content-type", "content-disposition", "content-length", "cache-control"];

/** Solo estas cabeceras del navegador llegan a Odoo (nunca cookies ni Authorization del cliente). */
export function cabecerasParaOdoo(entrada: { get(nombre: string): string | null }, token?: string): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const nombre of CABECERAS_DE_ENTRADA) {
    const valor = entrada.get(nombre);
    if (valor) salida[nombre] = valor;
  }
  if (token) salida.authorization = `Bearer ${token}`;
  return salida;
}

/** Solo estas cabeceras de Odoo vuelven al navegador (nada de Set-Cookie ni de CORS de Odoo). */
export function cabecerasParaNavegador(entrada: { get(nombre: string): string | null }): Record<string, string> {
  const salida: Record<string, string> = { "cache-control": "no-store" };
  for (const nombre of CABECERAS_DE_SALIDA) {
    const valor = entrada.get(nombre);
    if (valor && nombre !== "cache-control") salida[nombre] = valor;
  }
  return salida;
}
