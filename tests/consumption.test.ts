import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const getInvoices = vi.fn();

vi.mock("@/lib/services/api", () => ({ apiClient: { get } }));
vi.mock("@/lib/services/admin-invoices.service", () => ({ adminInvoicesService: { getInvoices } }));

const { consumptionService } = await import("@/lib/services/consumption.service");

const punto = (period: string, consumption: number, days_diff = 30) => ({ period, consumption, days_diff });

beforeEach(() => {
  get.mockReset();
  getInvoices.mockReset();
});

describe("consumptionService.getMonthly", () => {
  it("junta consumo y cobro de cada mes, ordenado de más antiguo a más reciente", async () => {
    get.mockResolvedValue({
      data: [
        { meter_code: "AGUA-1", service_type: "water", data: [punto("2026-09", 10), punto("2026-08", 9)] },
        { meter_code: "LUZ-1", service_type: "electricity", data: [punto("2026-09", 94), punto("2026-08", 93)] },
      ],
    });
    getInvoices.mockResolvedValue({
      invoices: [
        { invoice_date: "2026-09-30", amount_total: 45, service_type: "water" },
        { invoice_date: "2026-09-30", amount_total: 75.2, service_type: "electricity" },
        { invoice_date: "2026-08-31", amount_total: 40.5, reading: { service_type: "water" } },
      ],
    });

    const filas = await consumptionService.getMonthly(12);

    expect(filas.map((f) => f.periodo)).toEqual(["2026-08", "2026-09"]);
    expect(filas[1]).toMatchObject({ agua: 10, luz: 94, costoAgua: "45.00", costoLuz: "75.20" });
    expect(filas[0]).toMatchObject({ agua: 9, luz: 93, costoAgua: "40.50", costoLuz: "0.00" });
  });

  it("no cuenta la lectura inicial (sin días transcurridos) como un mes de consumo", async () => {
    get.mockResolvedValue({
      data: [{ meter_code: "AGUA-1", service_type: "water", data: [punto("2026-07", 0, 0), punto("2026-08", 9)] }],
    });
    getInvoices.mockResolvedValue({ invoices: [] });

    const filas = await consumptionService.getMonthly(12);

    expect(filas.map((f) => f.periodo)).toEqual(["2026-08"]);
  });

  it("suma los medidores del mismo servicio y no inventa meses con cobro pero sin lectura", async () => {
    get.mockResolvedValue({
      data: [
        { meter_code: "AGUA-1", service_type: "water", data: [punto("2026-09", 10)] },
        { meter_code: "AGUA-2", service_type: "water", data: [punto("2026-09", 5.5)] },
      ],
    });
    getInvoices.mockResolvedValue({
      invoices: [{ invoice_date: "2026-01-31", amount_total: 99, service_type: "water" }],
    });

    const filas = await consumptionService.getMonthly(12);

    expect(filas).toHaveLength(1);
    expect(filas[0].agua).toBe(15.5);
    expect(filas[0].costoAgua).toBe("0.00");
  });

  it("devuelve una lista vacía si el cliente aún no tiene consumo", async () => {
    get.mockResolvedValue({ data: [] });
    getInvoices.mockResolvedValue({ invoices: [] });
    expect(await consumptionService.getMonthly(12)).toEqual([]);
  });
});
