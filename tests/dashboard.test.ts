import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/api", () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

const { buildDashboard } = await import("@/lib/services/dashboard.service");
const { aRecibo } = await import("@/lib/receipts");

const HOY = "2026-10-07";

const factura = (id: number, extra: Record<string, unknown> = {}) =>
  aRecibo(
    {
      id,
      name: `UINT/2026/${id}`,
      invoice_date: "2026-09-30",
      invoice_date_due: "2026-10-15",
      amount_total: 50,
      payment_state: "not_paid",
      service_type: "water",
      has_informative_receipt: true,
      ...extra,
    } as never,
    HOY
  );

const mes = (periodo: string, agua: number, luz: number, costoAgua = "0.00", costoLuz = "0.00") => ({
  periodo,
  mes: periodo,
  agua,
  luz,
  costoAgua,
  costoLuz,
});

describe("aRecibo", () => {
  it("marca vencido lo impago con fecha pasada, pendiente lo vigente y pagado lo pagado", () => {
    expect(factura(1).estado).toBe("pendiente");
    expect(factura(2, { invoice_date_due: "2026-09-01" }).estado).toBe("vencido");
    const pagado = factura(3, { payment_state: "paid", invoice_date_due: "2026-09-01" });
    expect(pagado.estado).toBe("pagado");
    expect(pagado.saldo).toBe(0);
  });

  it("acepta el vencimiento con el nombre que envía Odoo (due_date)", () => {
    const r = factura(4, { invoice_date_due: undefined, due_date: "2026-09-02" });
    expect(r.fecha_vencimiento).toBe("2026-09-02");
    expect(r.estado).toBe("vencido");
  });
});

describe("buildDashboard", () => {
  it("compara el último mes con el anterior y marca consumo alto sobre 30%", () => {
    const d = buildDashboard("Ana", [mes("2026-08", 10, 100, "45.00", "80.00"), mes("2026-09", 14, 104, "63.00", "83.20")], []);
    expect(d.periodo).toBe("2026-09");
    expect(d.servicios?.agua).toMatchObject({ consumoActual: 14, consumoAnterior: 10, estado: "alto", costo: 63 });
    expect(d.servicios?.agua.cambio).toBeCloseTo(40);
    expect(d.servicios?.luz.estado).toBe("normal");
  });

  it("sin mes anterior no inventa un porcentaje", () => {
    const d = buildDashboard("Ana", [mes("2026-09", 10, 100)], []);
    expect(d.servicios?.agua.cambio).toBeNull();
    expect(d.servicios?.agua.estado).toBe("normal");
  });

  it("sin consumo registrado no muestra tarjetas de servicio", () => {
    const d = buildDashboard("Ana", [], []);
    expect(d.servicios).toBeNull();
    expect(d.periodo).toBeNull();
  });

  it("suma lo pendiente, cuenta vencidos y apunta al cobro más urgente", () => {
    const d = buildDashboard("Ana", [], [
      factura(10, { amount_total: 45, invoice_date_due: "2026-09-15" }),
      factura(11, { amount_total: 75.2, invoice_date_due: "2026-10-15" }),
      factura(12, { amount_total: 99, payment_state: "paid" }),
    ]);
    expect(d.estadoCuenta.totalPendiente).toBeCloseTo(120.2);
    expect(d.estadoCuenta.recibosVencidos).toBe(1);
    expect(d.estadoCuenta.proximoVencimiento).toBe("2026-09-15");
  });

  it("usa el saldo de un pago parcial, no el total", () => {
    const d = buildDashboard("Ana", [], [factura(20, { amount_total: 100, amount_residual: 40, payment_state: "partial" })]);
    expect(d.estadoCuenta.totalPendiente).toBe(40);
  });

  it("al día: sin deuda ni fecha de vencimiento", () => {
    const d = buildDashboard("Ana", [], [factura(30, { payment_state: "paid" })]);
    expect(d.estadoCuenta).toEqual({ totalPendiente: 0, proximoVencimiento: null, recibosVencidos: 0 });
  });

  it("muestra solo los 5 recibos más recientes", () => {
    const d = buildDashboard("Ana", [], Array.from({ length: 8 }, (_, i) => factura(i + 1)));
    expect(d.ultimosRecibos.map((r) => r.id)).toEqual([8, 7, 6, 5, 4]);
  });
});
