import { describe, expect, test, vi } from "vitest"

import {
  cabecerasParaNavegador, cabecerasParaOdoo, extraerSesion, opcionesCookie, origenPermitido, rutaDeOdoo, tipoAuth, urlOdoo,
} from "@/lib/server/bff"

const cab = (o: Record<string, string>) => ({ get: (n: string) => o[n.toLowerCase()] ?? null })

describe("rutaDeOdoo: el BFF no es un proxy abierto", () => {
  test("acepta la API del portal en sus dos formas", () => {
    expect(rutaDeOdoo(["api", "portal", "meters"])).toBe("/api/portal/meters")
    expect(rutaDeOdoo(["portal", "auth", "login"])).toBe("/api/portal/auth/login")
    expect(rutaDeOdoo(["api", "portal", "invoice", "12", "pdf"])).toBe("/api/portal/invoice/12/pdf")
  })

  test("rechaza todo lo que no sea la API del portal", () => {
    for (const s of [[], ["web", "login"], ["api", "otra"], ["api"], ["api", "portal"], ["portal"], ["jsonrpc"], ["xmlrpc", "2", "common"]]) {
      expect(rutaDeOdoo(s), JSON.stringify(s)).toBeNull()
    }
  })

  test("rechaza intentos de salirse de la ruta", () => {
    for (const s of [
      ["api", "portal", "..", "..", "web"], ["api", "portal", "%2e%2e", "x"], ["api", "portal", "a%2F..%2Fb"],
      ["api", "portal", ".", "x"], ["api", "portal", "", "x"], ["api", "portal", "a\\b"], ["api", "portal", "%00"], ["api", "portal", "%E0%A4%A"],
    ]) {
      expect(rutaDeOdoo(s), JSON.stringify(s)).toBeNull()
    }
  })
})

test("tipoAuth reconoce solo las cuatro rutas de sesión", () => {
  expect(tipoAuth("/api/portal/auth/login")).toBe("login")
  expect(tipoAuth("/api/portal/auth/admin-login")).toBe("admin-login")
  expect(tipoAuth("/api/portal/auth/refresh")).toBe("refresh")
  expect(tipoAuth("/api/portal/auth/logout")).toBe("logout")
  expect(tipoAuth("/api/portal/customer/me")).toBeNull()
  expect(tipoAuth("/api/portal/auth/login/")).toBeNull()
})

describe("origenPermitido (CSRF)", () => {
  test("las lecturas siempre pasan", () => {
    for (const m of ["GET", "HEAD", "OPTIONS"]) expect(origenPermitido(m, cab({}))).toBe(true)
  })

  test("un cambio de datos exige el mismo origen", () => {
    expect(origenPermitido("POST", cab({ "sec-fetch-site": "same-origin" }))).toBe(true)
    expect(origenPermitido("POST", cab({ "sec-fetch-site": "cross-site" }))).toBe(false)
    expect(origenPermitido("POST", cab({ "sec-fetch-site": "same-site" }))).toBe(false)
    expect(origenPermitido("DELETE", cab({ origin: "https://app.example.com", host: "app.example.com" }))).toBe(true)
    expect(origenPermitido("POST", cab({ origin: "https://malo.example.com", host: "app.example.com" }))).toBe(false)
    expect(origenPermitido("POST", cab({ origin: "https://app.example.com", "x-forwarded-host": "app.example.com", host: "interno" }))).toBe(true)
  })

  test("sin ninguna señal de origen se rechaza y un origen ilegible también", () => {
    expect(origenPermitido("POST", cab({}))).toBe(false)
    expect(origenPermitido("POST", cab({ origin: "no-es-url", host: "app.example.com" }))).toBe(false)
    expect(origenPermitido("POST", cab({ origin: "null", host: "app.example.com" }))).toBe(false)
  })
})

describe("extraerSesion", () => {
  test("separa los tokens y deja el resto para el navegador", () => {
    const r = extraerSesion({ success: true, data: { access_token: "A", refresh_token: "R", token_type: "bearer", expires_in: 900, customer: { id: 1, name: "Ana" } } })
    expect(r).toMatchObject({ acceso: "A", refresco: "R", expiraEn: 900 })
    expect(JSON.stringify(r.cuerpo)).not.toMatch(/"A"|"R"|access_token|refresh_token/)
    expect(r.cuerpo).toEqual({ success: true, data: { expires_in: 900, customer: { id: 1, name: "Ana" } } })
  })

  test("también entiende tokens al nivel superior y no muta la respuesta original", () => {
    const original = { access_token: "A", user: { id: 2 } }
    const r = extraerSesion(original)
    expect(r.acceso).toBe("A")
    expect(original.access_token).toBe("A")
    expect(r.cuerpo).toEqual({ user: { id: 2 } })
  })

  test("respuestas raras no rompen", () => {
    expect(extraerSesion(null)).toEqual({ cuerpo: null })
    expect(extraerSesion("texto")).toEqual({ cuerpo: "texto" })
    expect(extraerSesion({ data: { access_token: 5 } }).acceso).toBeUndefined()
  })
})

describe("cabeceras", () => {
  test("a Odoo solo pasan las necesarias y la autorización sale de la cookie, no del cliente", () => {
    const salida = cabecerasParaOdoo(cab({ "content-type": "application/json", authorization: "Bearer ROBADO", cookie: "x=1", "x-forwarded-for": "1.1.1.1", accept: "application/json" }), "TOKEN")
    expect(salida).toEqual({ "content-type": "application/json", accept: "application/json", authorization: "Bearer TOKEN" })
  })

  test("sin token no se manda Authorization aunque el cliente lo haya puesto", () => {
    expect(cabecerasParaOdoo(cab({ authorization: "Bearer ROBADO" }))).toEqual({})
  })

  test("al navegador no vuelven cookies ni CORS de Odoo, y nada se guarda en caché", () => {
    const salida = cabecerasParaNavegador(cab({ "content-type": "application/pdf", "content-disposition": "attachment; filename=a.pdf", "set-cookie": "session_id=1", "access-control-allow-origin": "*", "cache-control": "public, max-age=3600", server: "Werkzeug" }))
    expect(salida).toEqual({ "cache-control": "no-store", "content-type": "application/pdf", "content-disposition": "attachment; filename=a.pdf" })
  })
})

describe("cookies", () => {
  test("httpOnly, path raíz, SameSite Lax", () => {
    expect(opcionesCookie(60)).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 })
  })

  test("Secure solo en producción", () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(opcionesCookie(1).secure).toBe(true)
    vi.stubEnv("NODE_ENV", "development")
    expect(opcionesCookie(1).secure).toBe(false)
    vi.unstubAllEnvs()
  })
})

test("urlOdoo usa la variable de entorno y quita barras finales", () => {
  vi.stubEnv("ODOO_URL", "https://odoo.example.com//")
  expect(urlOdoo()).toBe("https://odoo.example.com")
  vi.unstubAllEnvs()
})
