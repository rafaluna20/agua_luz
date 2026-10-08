import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/api", () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

const { buildReceiptDetail } = await import("@/lib/services/receipt-detail.service");

const factura = {
  id: 186,
  name: "UINT/2026/00077",
  invoice_date: "2026-09-30",
  invoice_date_due: "2026-10-15",
  amount_total: 45,
  payment_state: "not_paid",
  has_informative_receipt: true,
  reading: { id: 157, period: "September 2026", consumption: 10, service_type: "water" },
} as never;

const cliente = { name: "Pedro Castillo", email: "p@x.test", phone: "900000007", street: "Mz B Lt 7", city: false } as never;

const historial = [
  {
    meter_code: "AGUA-LT-07",
    service_type: "water",
    data: [
      { period: "2026-09", reading_date: "2026-09-30T17:00:00", value: 417, consumption: 10, days_diff: 30 },
      { period: "2026-08", reading_date: "2026-08-31T17:00:00", value: 407, consumption: 9, days_diff: 31 },
    ],
  },
  { meter_code: "LUZ-LT-07", service_type: "electricity", data: [{ period: "2026-09", reading_date: "2026-09-30T17:00:00", value: 900, consumption: 94, days_diff: 30 }] },
] as never;

describe("buildReceiptDetail", () => {
  it("deduce lectura anterior y fechas desde el historial del mismo servicio y mes", () => {
    const d = buildReceiptDetail(factura, historial, cliente, "2026-10-07");
    expect(d.medidor?.codigo).toBe("AGUA-LT-07");
    expect(d.lecturas).toEqual({ anterior: 407, actual: 417, fechaAnterior: "2026-08-31", fechaActual: "2026-09-30", dias: 30, consumo: 10 });
    expect(d.unidad).toBe("m³");
  });

  it("calcula la tarifa por unidad con lo cobrado entre lo consumido", () => {
    expect(buildReceiptDetail(factura, historial, cliente, "2026-10-07").tarifa).toBe(4.5);
  });

  it("arma la dirección sin huecos y deja el estado del recibo", () => {
    const d = buildReceiptDetail(factura, historial, cliente, "2026-10-07");
    expect(d.cliente.direccion).toBe("Mz B Lt 7");
    expect(d.recibo.estado).toBe("pendiente");
    expect(buildReceiptDetail(factura, historial, cliente, "2026-11-01").recibo.estado).toBe("vencido");
  });

  it("sin historial no inventa lecturas ni medidor, pero conserva el consumo del cobro", () => {
    const d = buildReceiptDetail(factura, [], cliente, "2026-10-07");
    expect(d.lecturas).toBeNull();
    expect(d.medidor).toBeNull();
    expect(d.tarifa).toBe(4.5);
  });

  it("con consumo cero no calcula tarifa (evita dividir entre cero)", () => {
    const sinConsumo = { ...(factura as object), reading: { id: 1, period: "x", consumption: 0, service_type: "water" } } as never;
    expect(buildReceiptDetail(sinConsumo, [], cliente, "2026-10-07").tarifa).toBeNull();
  });
});
