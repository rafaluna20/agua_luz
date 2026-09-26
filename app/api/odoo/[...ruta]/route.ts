import { NextRequest, NextResponse } from "next/server";

import {
  cabecerasParaNavegador,
  cabecerasParaOdoo,
  COOKIE_ACCESO,
  COOKIE_REFRESCO,
  extraerSesion,
  MAX_BYTES_CUERPO,
  opcionesCookie,
  origenPermitido,
  rutaDeOdoo,
  SEGUNDOS_REFRESCO,
  tipoAuth,
  urlOdoo,
} from "@/lib/server/bff";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Contexto {
  params: { ruta: string[] };
}

const json = (cuerpo: unknown, status: number) => NextResponse.json(cuerpo, { status, headers: { "cache-control": "no-store" } });
const error = (status: number, mensaje: string) => json({ success: false, error: { code: status, message: mensaje } }, status);

/**
 * La cookie de acceso dura lo mismo que la de refresco: el JWT ya lleva su propio vencimiento (~15 min) y, cuando vence,
 * Odoo responde 401 y este servidor lo refresca solo. Si la cookie desapareciera a los 15 min, el middleware sacaría
 * al usuario al login aunque su refresco siga vigente.
 */
function ponerSesion(respuesta: NextResponse, acceso?: string, refresco?: string) {
  if (acceso) respuesta.cookies.set(COOKIE_ACCESO, acceso, opcionesCookie(SEGUNDOS_REFRESCO));
  if (refresco) respuesta.cookies.set(COOKIE_REFRESCO, refresco, opcionesCookie(SEGUNDOS_REFRESCO));
}

function borrarSesion(respuesta: NextResponse) {
  respuesta.cookies.set(COOKIE_ACCESO, "", { ...opcionesCookie(0), maxAge: 0 });
  respuesta.cookies.set(COOKIE_REFRESCO, "", { ...opcionesCookie(0), maxAge: 0 });
}

async function llamarOdoo(ruta: string, busqueda: string, metodo: string, cabeceras: Record<string, string>, cuerpo: ArrayBuffer | null) {
  return fetch(`${urlOdoo()}${ruta}${busqueda}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo && cuerpo.byteLength ? cuerpo : undefined,
    redirect: "manual",
    cache: "no-store",
  });
}

/** Un solo refresco a la vez por token: si varias peticiones vencen juntas comparten el mismo refresco. */
const refrescosEnCurso = new Map<string, Promise<{ acceso: string; refresco?: string; expiraEn?: number } | null>>();

async function refrescar(refresco: string) {
  const pendiente = refrescosEnCurso.get(refresco);
  if (pendiente) return pendiente;
  const trabajo = (async () => {
    try {
      const r = await llamarOdoo(
        "/api/portal/auth/refresh", "", "POST", { "content-type": "application/json" }, new TextEncoder().encode(JSON.stringify({ refresh_token: refresco })).buffer as ArrayBuffer
      );
      if (!r.ok) return null;
      const s = extraerSesion(await r.json());
      return s.acceso ? { acceso: s.acceso, refresco: s.refresco, expiraEn: s.expiraEn } : null;
    } catch {
      return null;
    } finally {
      setTimeout(() => refrescosEnCurso.delete(refresco), 5000);
    }
  })();
  refrescosEnCurso.set(refresco, trabajo);
  return trabajo;
}

async function manejar(request: NextRequest, { params }: Contexto): Promise<NextResponse> {
  const ruta = rutaDeOdoo(params.ruta);
  if (!ruta) return error(404, "No encontrado");
  if (!origenPermitido(request.method, request.headers)) return error(403, "Origen no permitido");

  const declarado = Number(request.headers.get("content-length") || 0);
  if (declarado > MAX_BYTES_CUERPO) return error(413, "Solicitud demasiado grande");
  const cuerpo = ["GET", "HEAD"].includes(request.method) ? null : await request.arrayBuffer();
  if (cuerpo && cuerpo.byteLength > MAX_BYTES_CUERPO) return error(413, "Solicitud demasiado grande");

  const acceso = request.cookies.get(COOKIE_ACCESO)?.value;
  const refresco = request.cookies.get(COOKIE_REFRESCO)?.value;
  const auth = tipoAuth(ruta);

  try {
    // ── inicio de sesión: los tokens quedan en cookies y NO se devuelven al navegador ──
    if (auth === "login" || auth === "admin-login") {
      const r = await llamarOdoo(ruta, "", "POST", cabecerasParaOdoo(request.headers), cuerpo);
      const datos = await r.json().catch(() => null);
      const sesion = extraerSesion(datos);
      const respuesta = json(sesion.cuerpo ?? { success: false }, r.status);
      if (r.ok && sesion.acceso && sesion.refresco) ponerSesion(respuesta, sesion.acceso, sesion.refresco);
      return respuesta;
    }

    // ── refresco explícito (sin cuerpo: el token de refresco sale de la cookie) ──
    if (auth === "refresh") {
      if (!refresco) return error(401, "Sesión no iniciada");
      const nuevo = await refrescar(refresco);
      if (!nuevo) {
        const respuesta = error(401, "Sesión vencida");
        borrarSesion(respuesta);
        return respuesta;
      }
      const respuesta = json({ success: true }, 200);
      ponerSesion(respuesta, nuevo.acceso, nuevo.refresco);
      return respuesta;
    }

    // ── cierre de sesión: se avisa a Odoo (mejor esfuerzo) y siempre se borran las cookies ──
    if (auth === "logout") {
      if (acceso) {
        await llamarOdoo(ruta, "", "POST", cabecerasParaOdoo(request.headers, acceso), cuerpo).catch(() => undefined);
      }
      const respuesta = json({ success: true }, 200);
      borrarSesion(respuesta);
      return respuesta;
    }

    // ── cualquier otra llamada: se agrega el token y, si venció, se refresca una vez y se reintenta ──
    let token = acceso;
    let renovado: { acceso: string; refresco?: string; expiraEn?: number } | null = null;
    let r = await llamarOdoo(ruta, request.nextUrl.search, request.method, cabecerasParaOdoo(request.headers, token), cuerpo);
    if (r.status === 401 && refresco) {
      renovado = await refrescar(refresco);
      if (renovado) {
        token = renovado.acceso;
        r = await llamarOdoo(ruta, request.nextUrl.search, request.method, cabecerasParaOdoo(request.headers, token), cuerpo);
      }
    }
    const respuesta = new NextResponse(r.status === 204 ? null : r.body, { status: r.status, headers: cabecerasParaNavegador(r.headers) });
    if (renovado) ponerSesion(respuesta, renovado.acceso, renovado.refresco);
    else if (r.status === 401 && refresco) borrarSesion(respuesta);
    return respuesta;
  } catch {
    // Sin detalles al navegador: el error real queda en el log del servidor.
    console.error(`BFF: no se pudo llamar a Odoo (${ruta})`);
    return error(502, "No se pudo conectar con el servidor");
  }
}

export const GET = manejar;
export const POST = manejar;
export const PUT = manejar;
export const PATCH = manejar;
export const DELETE = manejar;
