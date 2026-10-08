import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { adminInvoicesService, type AdminInvoice } from "@/lib/services/admin-invoices.service";

export type EstadoRecibo = "pendiente" | "pagado" | "vencido";

export interface Recibo {
  id: number;
  numero_recibo: string;
  servicio: string;
  periodo: string;
  consumo: number | null;
  total: number;
  /** Lo que aún se debe de este recibo (0 si está pagado). */
  saldo: number;
  estado: EstadoRecibo;
  fecha_vencimiento: string;
  tieneReciboInformativo: boolean;
}

/** Clave que entienden getStatusColor / translateStatus. */
export const CLAVE_ESTADO: Record<EstadoRecibo, string> = { pagado: "paid", pendiente: "pending", vencido: "overdue" };

/** Traduce un cobro de Odoo al modelo que muestran las pantallas del residente. `hoy` es YYYY-MM-DD. */
export function aRecibo(inv: AdminInvoice, hoy: string = new Date().toISOString().slice(0, 10)): Recibo {
  const vencimiento = inv.invoice_date_due || inv.due_date || inv.invoice_date;
  const tipo = inv.reading?.service_type ?? inv.service_type;
  const pagado = inv.payment_state === "paid";
  const estado: EstadoRecibo = pagado ? "pagado" : vencimiento < hoy ? "vencido" : "pendiente";
  return {
    id: inv.id,
    numero_recibo: inv.name,
    servicio: tipo === "water" ? "Agua" : tipo === "electricity" ? "Luz" : inv.service_name || "Servicio",
    periodo: format(parseISO(inv.invoice_date), "MMMM yyyy", { locale: es }),
    consumo: inv.reading?.consumption ?? null,
    total: inv.amount_total,
    saldo: pagado ? 0 : inv.amount_residual ?? inv.amount_total,
    estado,
    fecha_vencimiento: vencimiento,
    tieneReciboInformativo: inv.has_informative_receipt,
  };
}

/** Descarga el PDF del recibo (el informativo con historial si existe, si no el comprobante). */
export async function descargarRecibo(recibo: Recibo): Promise<void> {
  const blob = recibo.tieneReciboInformativo
    ? await adminInvoicesService.downloadUtilityReceipt(recibo.id)
    : await adminInvoicesService.downloadInvoicePdf(recibo.id);
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${recibo.numero_recibo.replace(/[\\/]/g, "-")}.pdf`;
  enlace.click();
  URL.revokeObjectURL(url);
}
