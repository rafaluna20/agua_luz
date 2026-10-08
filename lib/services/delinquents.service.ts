import { apiClient } from "./api";

export type CutOrderState = "notified" | "approved" | "cut" | "reconnected" | "cancelled";
export type CutAction = "notify" | "approve" | "cut" | "reconnect" | "cancel";

export interface DelinquentInvoice {
  id: number;
  name: string;
  service_type: "water" | "electricity";
  due_date: string;
  days_overdue: number;
  amount: number;
}

export interface CutOrder {
  id: number;
  state: CutOrderState;
  notified_date: string | null;
  approved_date: string | null;
  approved_by: string;
  cut_date: string | null;
  debt_at_notice: number;
}

export interface Delinquent {
  partner_id: number;
  name: string;
  phone: string;
  email: string;
  meters: string[];
  invoices: DelinquentInvoice[];
  total_debt: number;
  oldest_days_overdue: number;
  apt_for_cut: boolean;
  order: CutOrder | null;
}

export interface DelinquentsSummary {
  customers: number;
  total_debt: number;
  apt_for_cut: number;
  cut_after_days: number;
  notice_days: number;
  can_manage: boolean;
}

export interface DelinquentsResponse {
  items: Delinquent[];
  summary: DelinquentsSummary | Record<string, never>;
}

export class DelinquentsService {
  async getDelinquents(): Promise<DelinquentsResponse> {
    const response = await apiClient.get<{ success: boolean; data: DelinquentsResponse }>("/api/portal/delinquents");
    return response.data;
  }

  /** Avanza la orden de corte del cliente. El servidor valida el rol y los plazos. */
  async act(partnerId: number, action: CutAction, note?: string): Promise<void> {
    await apiClient.post("/api/portal/cut-orders", { partner_id: partnerId, action, note });
  }

  /** Enlace de WhatsApp con el aviso de deuda ya redactado. */
  whatsappLink(phone: string, name: string, debt: number, days: number, noticeDays: number): string {
    const digits = phone.replace(/\D/g, "");
    const numero = digits.length === 9 ? `51${digits}` : digits;
    const mensaje =
      `Estimado(a) ${name}, le recordamos que mantiene una deuda vencida de S/ ${debt.toFixed(2)} por los servicios de agua y luz ` +
      `(${days} días de atraso). Le pedimos regularizarla en los próximos ${noticeDays} días para evitar la suspensión del servicio. ` +
      `Si ya realizó el pago, por favor envíenos su comprobante. Gracias.`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  }
}

export const delinquentsService = new DelinquentsService();
