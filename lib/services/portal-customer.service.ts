import { apiClient } from "./api";

export interface PortalCustomer {
  id: number;
  name: string;
  email: string;
  phone: string | false | null;
  street: string | false | null;
  city: string | false | null;
  meter_count: number;
}

export interface PaymentInfo {
  company_name: string;
  /** Texto libre que define la empresa: cuentas, Yape/Plin, horarios, a quién enviar el comprobante. */
  instructions: string;
}

/** Datos y acciones del propio cliente que inició sesión en el portal. */
export class PortalCustomerService {
  async getMe(): Promise<PortalCustomer> {
    const response = await apiClient.get<{ success: boolean; data: PortalCustomer }>("/api/portal/customer/me");
    return response.data;
  }

  async getPaymentInfo(): Promise<PaymentInfo> {
    const response = await apiClient.get<{ success: boolean; data: PaymentInfo }>("/api/portal/payment-info");
    return response.data;
  }

  async updateProfile(data: { phone?: string; street?: string; city?: string }): Promise<void> {
    await apiClient.post("/api/portal/customer/profile", data);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post("/api/portal/customer/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }
}

export const portalCustomerService = new PortalCustomerService();
