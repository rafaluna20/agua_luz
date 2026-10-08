import { apiClient } from "./api";

export type AlertLevel = "green" | "yellow" | "red";

export interface ReconciliationChild {
  meter_code: string;
  customer: string;
  consumption: number;
  percentage: number;
}

export interface Reconciliation {
  id: number;
  period: string; // YYYY-MM
  meter_id: number;
  meter_code: string;
  service_type: "water" | "electricity";
  unit: string;
  provider: string;
  parent_consumption: number;
  children_total: number;
  children_count: number;
  delta: number;
  loss_percentage: number;
  alert_level: AlertLevel;
  state: string;
  unit_price: number;
  /** Lo que se deja de cobrar por la diferencia, a la tarifa interna de los lotes. */
  loss_amount: number;
  children: ReconciliationChild[];
}

export interface ReconciliationResponse {
  items: Reconciliation[];
  thresholds: { yellow: number; red: number };
}

export class ReconciliationService {
  async getReconciliations(
    params: { months?: number; service_type?: "water" | "electricity" } = {}
  ): Promise<ReconciliationResponse> {
    const query = new URLSearchParams();
    query.append("months", String(params.months ?? 6));
    if (params.service_type) query.append("service_type", params.service_type);
    const response = await apiClient.get<{ success: boolean; data: ReconciliationResponse }>(
      `/api/portal/reconciliations?${query.toString()}`
    );
    return response.data;
  }
}

export const reconciliationService = new ReconciliationService();
