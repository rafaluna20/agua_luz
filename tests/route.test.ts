import http from "node:http"
import type { AddressInfo } from "node:net"
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest"
import { NextRequest } from "next/server"

import { DELETE, GET, POST } from "@/app/api/odoo/[...ruta]/route"

// ── Un Odoo falso: guarda lo que recibe y responde según el token ───────────────────────────────
interface Recibida { metodo: string; ruta: string; autorizacion: string | undefined; cookie: string | undefined; cuerpo: string }
let servidor: http.Server
let recibidas: Recibida[] = []
let tokenVigente = "ACCESO-VIGENTE"
let refrescosPedidos = 0
let refrescoValido = true
let odooCaido = false

function leer(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const trozos: Buffer[] = []
    req.on("data", (t) => trozos.push(t))
    req.on("end", () => resolve(Buffer.concat(trozos).toString()))
  })
}

beforeAll(async () => {
  servidor = http.createServer(async (req, res) => {
    const cuerpo = await leer(req)
    recibidas.push({ metodo: req.method || "", ruta: req.url || "", autorizacion: req.headers.authorization, cookie: req.headers.cookie, cuerpo })
    if (odooCaido) return void req.socket.destroy()
    const enviar = (status: number, datos: unknown, cabeceras: Record<string, string> = {}) => {
      res.writeHead(status, { "content-type": "application/json", "set-cookie": "session_id=de-odoo", "access-control-allow-origin": "*", ...cabeceras })
      res.end(JSON.stringify(datos))
    }
    if (req.url === "/api/portal/auth/login") {
      return JSON.parse(cuerpo).password === "buena"
        ? enviar(200, { success: true, data: { access_token: "ACCESO-NUEVO", refresh_token: "REFRESCO-NUEVO", expires_in: 900, customer: { id: 7, name: "Ana", email: "ana@example.com" } } })
        : enviar(401, { success: false, error: { message: "Credenciales inválidas" } })
    }
    if (req.url === "/api/portal/auth/refresh") {
      refrescosPedidos++
      return refrescoValido && String(JSON.parse(cuerpo).refresh_token).startsWith("REFRESCO-VIGENTE")
        ? enviar(200, { success: true, data: { access_token: "ACCESO-RENOVADO", refresh_token: "REFRESCO-ROTADO" } })
        : enviar(401, { success: false })
    }
    if (req.url === "/api/portal/auth/logout") return enviar(200, { success: true })
    if (req.url?.startsWith("/api/portal/invoice/1/pdf")) {
      return void (res.writeHead(200, { "content-type": "application/pdf", "content-disposition": "attachment; filename=recibo.pdf" }), res.end(Buffer.from("%PDF-1.4 falso")))
    }
    if (req.headers.authorization !== `Bearer ${tokenVigente}`) return enviar(401, { success: false, error: { message: "Token inválido" } })
    return enviar(200, { success: true, eco: cuerpo ? JSON.parse(cuerpo) : null })
  })
  await new Promise<void>((r) => servidor.listen(0, "127.0.0.1", r))
  process.env.ODOO_URL = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`
})

afterAll(() => new Promise<void>((r) => servidor.close(() => r())))

beforeEach(() => {
  recibidas = []
  tokenVigente = "ACCESO-VIGENTE"
  refrescosPedidos = 0
  refrescoValido = true
  odooCaido = false
})

// ── Ayudas ──────────────────────────────────────────────────────────────────────────────────────
const MISMO_ORIGEN = { "sec-fetch-site": "same-origin" }
function pedir(metodo: string, ruta: string, opciones: { cookies?: string; cuerpo?: unknown; cabeceras?: Record<string, string>; crudo?: string } = {}) {
  const cabeceras: Record<string, string> = { "content-type": "application/json", ...opciones.cabeceras }
  if (opciones.cookies) cabeceras.cookie = opciones.cookies
  const body = opciones.crudo ?? (opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo))
  return new NextRequest(`http://localhost:3000/api/odoo/${ruta}`, { method: metodo, headers: cabeceras, body })
}
const params = (ruta: string) => ({ params: { ruta: ruta.split("?")[0].split("/") } })
const cookiesDe = (r: Response) => r.headers.getSetCookie()
const CON_SESION = "access_token=ACCESO-VIGENTE; refresh_token=REFRESCO-VIGENTE"

describe("inicio de sesión", () => {
  test("los tokens quedan en cookies httpOnly y NO llegan al navegador", async () => {
    const ruta = "portal/auth/login"
    const r = await POST(pedir("POST", ruta, { cuerpo: { email: "ana@example.com", password: "buena" }, cabeceras: MISMO_ORIGEN }), params(ruta))
    expect(r.status).toBe(200)
    const texto = await r.text()
    expect(texto).not.toMatch(/ACCESO-NUEVO|REFRESCO-NUEVO|access_token|refresh_token/)
    expect(JSON.parse(texto).data.customer).toEqual({ id: 7, name: "Ana", email: "ana@example.com" })
    const cookies = cookiesDe(r).join("\n")
    expect(cookies).toMatch(/access_token=ACCESO-NUEVO;.*HttpOnly/i)
    expect(cookies).toMatch(/refresh_token=REFRESCO-NUEVO;.*HttpOnly/i)
    expect(cookies).toMatch(/SameSite=lax/i)
    expect(cookies).not.toMatch(/session_id/)
  })

  test("un login fallido no deja cookies y pasa el mensaje de Odoo", async () => {
    const ruta = "portal/auth/login"
    const r = await POST(pedir("POST", ruta, { cuerpo: { email: "ana@example.com", password: "mala" }, cabeceras: MISMO_ORIGEN }), params(ruta))
    expect(r.status).toBe(401)
    expect(cookiesDe(r)).toEqual([])
    expect((await r.json()).error.message).toBe("Credenciales inválidas")
  })

  test("un login desde otro sitio se rechaza sin llamar a Odoo", async () => {
    const ruta = "portal/auth/login"
    const r = await POST(pedir("POST", ruta, { cuerpo: { password: "buena" }, cabeceras: { "sec-fetch-site": "cross-site" } }), params(ruta))
    expect(r.status).toBe(403)
    expect(recibidas).toHaveLength(0)
  })
})

describe("llamadas autenticadas", () => {
  test("agrega el token de la cookie y descarta el Authorization y las cookies del cliente", async () => {
    const ruta = "api/portal/customer/me"
    const r = await GET(pedir("GET", ruta, { cookies: CON_SESION, cabeceras: { authorization: "Bearer ROBADO" } }), params(ruta))
    expect(r.status).toBe(200)
    expect(recibidas[0].autorizacion).toBe("Bearer ACCESO-VIGENTE")
    expect(recibidas[0].cookie).toBeUndefined()
    expect(cookiesDe(r)).toEqual([])
    expect(r.headers.get("access-control-allow-origin")).toBeNull()
    expect(r.headers.get("cache-control")).toBe("no-store")
  })

  test("reenvía la consulta y el cuerpo de un POST del mismo origen", async () => {
    const ruta = "api/portal/meters"
    const r = await POST(pedir("POST", `${ruta}?limit=5&search=A1`, { cookies: CON_SESION, cuerpo: { name: "M-1" }, cabeceras: MISMO_ORIGEN }), params(ruta))
    expect(r.status).toBe(200)
    expect(recibidas[0].ruta).toBe("/api/portal/meters?limit=5&search=A1")
    expect((await r.json()).eco).toEqual({ name: "M-1" })
  })

  test("un POST o DELETE de otro origen se rechaza y no llega a Odoo", async () => {
    const ruta = "api/portal/customers"
    for (const f of [POST, DELETE]) {
      const r = await f(pedir(f === POST ? "POST" : "DELETE", ruta, { cookies: CON_SESION, cabeceras: { origin: "https://malo.example.com", host: "localhost:3000" } }), params(ruta))
      expect(r.status).toBe(403)
    }
    expect(recibidas).toHaveLength(0)
  })

  test("los PDF pasan intactos con su tipo y nombre de archivo", async () => {
    const ruta = "api/portal/invoice/1/pdf"
    const r = await GET(pedir("GET", ruta, { cookies: CON_SESION }), params(ruta))
    expect(r.headers.get("content-type")).toBe("application/pdf")
    expect(r.headers.get("content-disposition")).toContain("recibo.pdf")
    expect(await r.text()).toContain("%PDF-1.4")
  })
})

describe("sesión vencida", () => {
  test("con el acceso vencido se refresca una vez, se reintenta y se actualizan las cookies", async () => {
    tokenVigente = "ACCESO-RENOVADO"
    const ruta = "api/portal/invoices"
    const r = await GET(pedir("GET", ruta, { cookies: "access_token=ACCESO-VENCIDO; refresh_token=REFRESCO-VIGENTE" }), params(ruta))
    expect(r.status).toBe(200)
    expect(refrescosPedidos).toBe(1)
    const cookies = cookiesDe(r).join("\n")
    expect(cookies).toMatch(/access_token=ACCESO-RENOVADO/)
    expect(cookies).toMatch(/refresh_token=REFRESCO-ROTADO/)
    const usadas = recibidas.filter((x) => x.ruta === "/api/portal/invoices").map((x) => x.autorizacion)
    expect(usadas).toEqual(["Bearer ACCESO-VENCIDO", "Bearer ACCESO-RENOVADO"])
  })

  test("varias llamadas que vencen juntas comparten UN solo refresco", async () => {
    tokenVigente = "ACCESO-RENOVADO"
    const ruta = "api/portal/invoices"
    // Refresco propio de esta prueba: el BFF recuerda unos segundos el resultado de cada refresco.
    const cookies = "access_token=ACCESO-VENCIDO; refresh_token=REFRESCO-VIGENTE-2"
    const respuestas = await Promise.all([1, 2, 3, 4].map(() => GET(pedir("GET", ruta, { cookies }), params(ruta))))
    expect(respuestas.map((r) => r.status)).toEqual([200, 200, 200, 200])
    expect(refrescosPedidos).toBe(1)
  })

  test("si el refresco tampoco sirve: 401 y se borran las cookies", async () => {
    refrescoValido = false
    const ruta = "api/portal/invoices"
    const r = await GET(pedir("GET", ruta, { cookies: "access_token=ACCESO-VENCIDO; refresh_token=REFRESCO-MUERTO" }), params(ruta))
    expect(r.status).toBe(401)
    expect(cookiesDe(r).join("\n")).toMatch(/access_token=;.*Max-Age=0/i)
  })

  test("sin sesión (sin cookies) una ruta protegida responde 401 sin refrescar", async () => {
    const ruta = "api/portal/invoices"
    const r = await GET(pedir("GET", ruta), params(ruta))
    expect(r.status).toBe(401)
    expect(refrescosPedidos).toBe(0)
  })

  test("el refresco explícito usa la cookie y no acepta un token del cuerpo", async () => {
    const ruta = "portal/auth/refresh"
    const ok = await POST(pedir("POST", ruta, { cookies: CON_SESION, cabeceras: MISMO_ORIGEN }), params(ruta))
    expect(ok.status).toBe(200)
    expect(cookiesDe(ok).join("\n")).toMatch(/access_token=ACCESO-RENOVADO/)
    const sinCookie = await POST(pedir("POST", ruta, { cuerpo: { refresh_token: "REFRESCO-VIGENTE" }, cabeceras: MISMO_ORIGEN }), params(ruta))
    expect(sinCookie.status).toBe(401)
  })
})

describe("cierre de sesión", () => {
  test("avisa a Odoo con el token y borra las cookies", async () => {
    const ruta = "portal/auth/logout"
    const r = await POST(pedir("POST", ruta, { cookies: CON_SESION, cabeceras: MISMO_ORIGEN }), params(ruta))
    expect(r.status).toBe(200)
    expect(recibidas[0].autorizacion).toBe("Bearer ACCESO-VIGENTE")
    const cookies = cookiesDe(r).join("\n")
    expect(cookies).toMatch(/access_token=;.*Max-Age=0/i)
    expect(cookies).toMatch(/refresh_token=;.*Max-Age=0/i)
  })

  test("aunque Odoo esté caído, las cookies se borran igual", async () => {
    odooCaido = true
    const ruta = "portal/auth/logout"
    const r = await POST(pedir("POST", ruta, { cookies: CON_SESION, cabeceras: MISMO_ORIGEN }), params(ruta))
    expect(r.status).toBe(200)
    expect(cookiesDe(r).join("\n")).toMatch(/access_token=;/)
  })
})

describe("robustez", () => {
  test("rutas fuera de la API del portal o con trucos responden 404 sin llamar a Odoo", async () => {
    for (const ruta of ["web/login", "jsonrpc", "api/portal/../../web/database/manager", "api/portal/%2e%2e/web"]) {
      const r = await GET(pedir("GET", ruta, { cookies: CON_SESION }), params(ruta))
      expect(r.status, ruta).toBe(404)
    }
    expect(recibidas).toHaveLength(0)
  })

  test("un cuerpo demasiado grande se rechaza", async () => {
    const ruta = "api/portal/readings/bulk"
    const r = await POST(pedir("POST", ruta, { cookies: CON_SESION, crudo: "x".repeat(13 * 1024 * 1024), cabeceras: MISMO_ORIGEN }), params(ruta))
    expect(r.status).toBe(413)
    expect(recibidas).toHaveLength(0)
  })

  test("si Odoo no responde: 502 genérico, sin detalles internos", async () => {
    odooCaido = true
    const ruta = "api/portal/invoices"
    const registro = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const r = await GET(pedir("GET", ruta, { cookies: CON_SESION }), params(ruta))
    registro.mockRestore()
    expect(r.status).toBe(502)
    const texto = await r.text()
    expect(texto).not.toMatch(/127\.0\.0\.1|ECONN|socket|fetch failed/i)
  })
})
