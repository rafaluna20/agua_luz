import { adminInvoicesService } from "./admin-invoices.service";
import { consumptionService, type MonthlyConsumption } from "./consumption.service";
import { portalCustomerService } from "./portal-customer.service";
import { aRecibo, type Recibo } from "@/lib/receipts";

export interface ServicioResumen {
  consumoActual: number;
  consumoAnterior: number | null;
  /** Variación porcentual contra el mes anterior; null si no hay con qué comparar. */
  cambio: number | null;
  /** Lo cobrado por el último mes con consumo. */
  costo: number;
  /** "alto" cuando el consumo subió más de 30% contra el mes anterior. */
  estado: "normal" | "alto";
}

export interface DashboardData {
  nombre: string;
  /** Mes al que corresponde el resumen (YYYY-MM); null si aún no hay consumo. */
  periodo: string | null;
  servicios: { agua: ServicioResumen; luz: ServicioResumen } | null;
  ultimosRecibos: Recibo[];
  estadoCuenta: { totalPendiente: number; proximoVencimiento: string | null; recibosVencidos: number };
}

const UMBRAL_ALTO = 30;

function resumen(actual: number, anterior: number | null, costo: string): ServicioResumen {
  const cambio = anterior && anterior > 0 ? ((actual - anterior) / anterior) * 100 : null;
  return {
    consumoActual: actual,
    consumoAnterior: anterior,
    cambio,
    costo: Number(costo),
    estado: cambio !== null && cambio > UMBRAL_ALTO ? "alto" : "normal",
  };
}

/** Arma el resumen del dashboard a partir de datos ya leídos (función pura, sin red). */
export function buildDashboard(
  nombre: string,
  mensual: MonthlyConsumption[],
  recibos: Recibo[]
): DashboardData {
  const ultimo = mensual[mensual.length - 1];
  const previo = mensual.length > 1 ? mensual[mensual.length - 2] : null;

  const pendientes = recibos.filter((r) => r.estado !== "pagado");
  const vencidos = pendientes.filter((r) => r.estado === "vencido");
  // Lo que más urge: el cobro vencido más antiguo; si no hay, el próximo a vencer.
  const urgente = [...pendientes].sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))[0];

  return {
    nombre,
    periodo: ultimo?.periodo ?? null,
    servicios: ultimo
      ? {
          agua: resumen(ultimo.agua, previo ? previo.agua : null, ultimo.costoAgua),
          luz: resumen(ultimo.luz, previo ? previo.luz : null, ultimo.costoLuz),
        }
      : null,
    ultimosRecibos: [...recibos].sort((a, b) => b.id - a.id).slice(0, 5),
    estadoCuenta: {
      totalPendiente: Math.round(pendientes.reduce((suma, r) => suma + r.saldo, 0) * 100) / 100,
      proximoVencimiento: urgente?.fecha_vencimiento ?? null,
      recibosVencidos: vencidos.length,
    },
  };
}

export class DashboardService {
  async getDashboard(): Promise<DashboardData> {
    const [me, mensual, facturas] = await Promise.all([
      portalCustomerService.getMe(),
      consumptionService.getMonthly(2),
      adminInvoicesService.getInvoices({ limit: 100 }),
    ]);
    return buildDashboard(me.name, mensual, (facturas.invoices ?? []).map((f) => aRecibo(f)));
  }
}

export const dashboardService = new DashboardService();
