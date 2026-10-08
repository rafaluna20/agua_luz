import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/api", () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

const { validarConfiguracion } = await import("@/lib/services/settings.service");

const base = {
  billing_mode: "internal" as const,
  auto_bill: false,
  invoice_due_days: 15,
  cut_after_days: 30,
  cut_notice_days: 3,
  payment_instructions: "Yape 999",
};

describe("validarConfiguracion", () => {
  it("acepta una configuración normal y los límites 0 y 365", () => {
    expect(validarConfiguracion(base)).toBeNull();
    expect(validarConfiguracion({ ...base, cut_after_days: 0, invoice_due_days: 365 })).toBeNull();
  });

  it("rechaza plazos negativos, decimales, vacíos (NaN) o mayores a 365", () => {
    for (const malo of [-1, 366, 2.5, NaN]) {
      expect(validarConfiguracion({ ...base, invoice_due_days: malo }), String(malo)).toMatch(/plazo de pago/);
      expect(validarConfiguracion({ ...base, cut_after_days: malo }), String(malo)).toMatch(/mora/);
      expect(validarConfiguracion({ ...base, cut_notice_days: malo }), String(malo)).toMatch(/aviso/);
    }
  });

  it("rechaza un texto de pago de más de 2000 caracteres", () => {
    expect(validarConfiguracion({ ...base, payment_instructions: "x".repeat(2001) })).toMatch(/2000/);
    expect(validarConfiguracion({ ...base, payment_instructions: "x".repeat(2000) })).toBeNull();
  });
});
