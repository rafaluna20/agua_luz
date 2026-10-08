import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { aRecibo, type Recibo } from "@/lib/receipts";
import { adminInvoicesService, type AdminInvoice } from "./admin-invoices.service";
import { consumptionService, type MeterHistory } from "./consumption.service";
import { portalCustomerService, type PortalCustomer } from "./portal-customer.service";

export interface ReciboDetalle {
  recibo: Recibo;
  fechaEmision: string;
  unidad: string;
  cliente: { nombre: string; email: string; telefono: string; direccion: string };
  /** Solo si se encontró la lectura en el historial del cliente. */
  medidor: { codigo: string } | null;
  lecturas: {
    anterior: number;
    actual: number;
    fechaAnterior: string;
    fechaActual: string;
    dias: number;
    consumo: number;
  } | null;
  /** Tarifa por unidad, deducida de lo cobrado entre lo consumido (null si no hay consumo). */
  tarifa: number | null;
}

const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");

/** Arma el detalle de un recibo con los datos que el residente puede ver (función pura, sin red). */
export function buildReceiptDetail(
  factura: AdminInvoice,
  historial: MeterHistory[],
  cliente: Pick<PortalCustomer, "name" | "email" | "phone" | "street" | "city">,
  hoy?: string
): ReciboDetalle {
  const recibo = aRecibo(factura, hoy);
  const tipo = factura.reading?.service_type ?? factura.service_type;
  const periodo = factura.invoice_date.slice(0, 7);

  const medidor = historial.find((m) => m.service_type === tipo && m.data.some((d) => d.period === periodo));
  const punto = medidor?.data.find((d) => d.period === periodo);

  const consumo = punto?.consumption ?? factura.reading?.consumption ?? recibo.consumo ?? 0;
  const lecturas =
    punto && medidor
      ? {
          anterior: Math.round((punto.value - punto.consumption) * 100) / 100,
          actual: punto.value,
          fechaAnterior: format(addDays(parseISO(punto.reading_date), -punto.days_diff), "yyyy-MM-dd"),
          fechaActual: punto.reading_date.slice(0, 10),
          dias: punto.days_diff,
          consumo: punto.consumption,
        }
      : null;

  return {
    recibo,
    fechaEmision: factura.invoice_date,
    unidad: tipo === "water" ? "m³" : "kWh",
    cliente: {
      nombre: cliente.name,
      email: cliente.email,
      telefono: texto(cliente.phone),
      direccion: [texto(cliente.street), texto(cliente.city)].filter(Boolean).join(", "),
    },
    medidor: medidor ? { codigo: medidor.meter_code } : null,
    lecturas,
    tarifa: consumo > 0 ? Math.round((factura.amount_total / consumo) * 100) / 100 : null,
  };
}

export const periodoLegible = (iso: string) => format(parseISO(iso), "d 'de' MMMM yyyy", { locale: es });

export class ReceiptDetailService {
  /** Devuelve null si el recibo no existe o no es del cliente. */
  async getDetail(id: number): Promise<ReciboDetalle | null> {
    const [facturas, historial, me] = await Promise.all([
      adminInvoicesService.getInvoices({ limit: 200 }),
      consumptionService.getHistory(24),
      portalCustomerService.getMe(),
    ]);
    const factura = (facturas.invoices ?? []).find((f) => f.id === id);
    return factura ? buildReceiptDetail(factura, historial, me) : null;
  }
}

export const receiptDetailService = new ReceiptDetailService();
