import { apiClient } from "./api";

export type BillingMode = "internal" | "sunat";

export interface CompanySettings {
  company_name: string;
  billing_mode: BillingMode;
  auto_bill: boolean;
  invoice_due_days: number;
  cut_after_days: number;
  cut_notice_days: number;
  payment_instructions: string;
}

export type SettingsForm = Omit<CompanySettings, "company_name">;

/** Los plazos son días enteros entre 0 y 365 (el servidor también lo valida). */
export function validarConfiguracion(f: SettingsForm): string | null {
  const plazos: [string, number][] = [
    ["El plazo de pago", f.invoice_due_days],
    ["Los días de mora para corte", f.cut_after_days],
    ["Los días entre aviso y corte", f.cut_notice_days],
  ];
  for (const [nombre, valor] of plazos) {
    if (!Number.isInteger(valor) || valor < 0 || valor > 365) return `${nombre} debe ser un número entero entre 0 y 365.`;
  }
  if (f.payment_instructions.length > 2000) return "El texto de pago no puede pasar de 2000 caracteres.";
  return null;
}

export class SettingsService {
  async get(): Promise<CompanySettings> {
    const response = await apiClient.get<{ success: boolean; data: CompanySettings }>("/api/portal/settings");
    return response.data;
  }

  async save(form: SettingsForm): Promise<CompanySettings> {
    const response = await apiClient.post<{ success: boolean; data: CompanySettings }>("/api/portal/settings", form);
    return response.data;
  }
}

export const settingsService = new SettingsService();
