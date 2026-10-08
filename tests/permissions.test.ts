import { describe, expect, it } from "vitest";
import { puedeVer, rolDe, rolMinimoDe, rutaInicial } from "@/lib/permissions";

describe("permisos por rol", () => {
  it("sin dato del servidor se asume el rol más bajo", () => {
    expect(rolDe(null)).toBe("operator");
    expect(rolDe({})).toBe("operator");
    expect(rolDe({ utility_role: "inventado" as never })).toBe("operator");
    expect(rolDe({ utility_role: "manager" })).toBe("manager");
  });

  it("el lector solo ve lecturas, medidores y QR", () => {
    for (const ruta of ["/admin/lecturas", "/admin/lecturas/registrar", "/admin/medidores", "/admin/qr-generator", "/admin/dashboard/progreso"]) {
      expect(puedeVer("operator", ruta), ruta).toBe(true);
    }
    for (const ruta of ["/admin/dashboard", "/admin/clientes", "/admin/recibos", "/admin/conciliacion", "/admin/morosos", "/admin/reportes", "/admin/configuracion"]) {
      expect(puedeVer("operator", ruta), ruta).toBe(false);
    }
  });

  it("el supervisor ve todo menos la configuración", () => {
    expect(puedeVer("supervisor", "/admin/morosos")).toBe(true);
    expect(puedeVer("supervisor", "/admin/dashboard")).toBe(true);
    expect(puedeVer("supervisor", "/admin/configuracion")).toBe(false);
  });

  it("el gerente lo ve todo", () => {
    expect(puedeVer("manager", "/admin/configuracion")).toBe(true);
    expect(puedeVer("manager", "/admin/conciliacion")).toBe(true);
  });

  it("gana el prefijo más específico y una ruta desconocida exige supervisor", () => {
    expect(rolMinimoDe("/admin/dashboard/progreso")).toBe("operator");
    expect(rolMinimoDe("/admin/dashboard")).toBe("supervisor");
    expect(rolMinimoDe("/admin/algo-nuevo")).toBe("supervisor");
    expect(puedeVer("operator", "/admin/lecturasX")).toBe(false); // no basta con empezar igual
  });

  it("cada rol arranca en su pantalla", () => {
    expect(rutaInicial("operator")).toBe("/admin/lecturas/registrar");
    expect(rutaInicial("supervisor")).toBe("/admin/dashboard");
    expect(rutaInicial("manager")).toBe("/admin/dashboard");
  });
});
