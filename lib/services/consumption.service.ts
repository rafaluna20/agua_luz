import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { apiClient } from "./api";
import { adminInvoicesService } from "./admin-invoices.service";

export interface MeterHistory {
  meter_code: string;
  service_type: "water" | "electricity";
  data: { period: string; reading_date: string; value: number; consumption: number; days_diff: number }[];
}

/** Una fila por mes: lo consumido y lo cobrado de cada servicio (sumando todos los medidores del cliente). */
export interface MonthlyConsumption {
  periodo: string; // YYYY-MM
  mes: string;
  agua: number;
  luz: number;
  costoAgua: string;
  costoLuz: string;
}

export class ConsumptionService {
  /** Historial de lecturas por medidor, tal como lo entrega Odoo (la más reciente primero). */
  async getHistory(months = 12): Promise<MeterHistory[]> {
    const response = await apiClient.get<{ success: boolean; data: MeterHistory[] }>(
      `/api/portal/consumption/history?months=${months}`
    );
    return response.data ?? [];
  }

  /** Consumo mensual real del cliente, con el monto cobrado de cada mes. De más antiguo a más reciente. */
  async getMonthly(months = 12): Promise<MonthlyConsumption[]> {
    const [history, invoices] = await Promise.all([
      apiClient.get<{ success: boolean; data: MeterHistory[] }>(`/api/portal/consumption/history?months=${months}`),
      adminInvoicesService.getInvoices({ limit: 200 }),
    ]);

    const filas = new Map<string, { agua: number; luz: number; costoAgua: number; costoLuz: number }>();
    const fila = (periodo: string) => {
      if (!filas.has(periodo)) filas.set(periodo, { agua: 0, luz: 0, costoAgua: 0, costoLuz: 0 });
      return filas.get(periodo)!;
    };

    for (const medidor of history.data ?? []) {
      for (const punto of medidor.data) {
        if (punto.days_diff <= 0) continue; // la lectura inicial solo sirve de base
        const f = fila(punto.period);
        if (medidor.service_type === "water") f.agua += punto.consumption;
        else f.luz += punto.consumption;
      }
    }
    for (const cobro of invoices.invoices ?? []) {
      const tipo = cobro.reading?.service_type ?? cobro.service_type;
      const periodo = cobro.invoice_date.slice(0, 7);
      if (!filas.has(periodo)) continue; // solo meses con consumo registrado
      const f = fila(periodo);
      if (tipo === "water") f.costoAgua += cobro.amount_total;
      else if (tipo === "electricity") f.costoLuz += cobro.amount_total;
    }

    return Array.from(filas.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-months)
      .map(([periodo, f]) => {
        const nombre = format(parseISO(`${periodo}-01`), "MMM yy", { locale: es });
        return {
          periodo,
          mes: nombre.charAt(0).toUpperCase() + nombre.slice(1),
          agua: Math.round(f.agua * 10) / 10,
          luz: Math.round(f.luz * 10) / 10,
          costoAgua: f.costoAgua.toFixed(2),
          costoLuz: f.costoLuz.toFixed(2),
        };
      });
  }
}

export const consumptionService = new ConsumptionService();
