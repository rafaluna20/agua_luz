
import { apiClient } from './api';

// ==================== INTERFACES ====================

export interface AdminInvoice {
    id: number;
    name: string;
    partner_name: string;
    partner_phone?: string;
    invoice_date: string;
    invoice_date_due?: string;
    amount_total: number;
    currency: string;
    payment_state: 'not_paid' | 'in_payment' | 'paid' | 'reversed' | 'partial';
    reading?: {
        id: number;
        period: string;
        consumption: number;
        service_type: 'water' | 'electricity';
    };
    download_url: string;
}


export interface AdminInvoicesStats {
    total_invoiced: number;
    total_pending: number;
    total_paid: number;
}

export interface AdminInvoicesResponse {
    invoices: AdminInvoice[];
    total: number;
    stats: AdminInvoicesStats;
}

export interface AdminReceiptDetails {
    supply_code: string;
    customer: string;
    address: string;
    period: string;
    readings: {
        previous: number;
        current: number;
        date: string;
    };
    consumption: {
        total: number;
        unit: string;
        avg_daily: number;
    };
    history: {
        date: string;
        consumption: number;
    }[];
    meter_details: {
        brand: string;
        model: string;
    };
}

export interface AdminInvoicesFilters {
    limit?: number;
    offset?: number;
    search?: string;
    payment_state?: string;
    date_from?: string;
    date_to?: string;
}

// ==================== SERVICE ====================

export class AdminInvoicesService {

    /**
     * Obtiene lista de facturas con filtros
     */
    async getInvoices(filters: AdminInvoicesFilters = {}): Promise<AdminInvoicesResponse> {
        try {
            const params = new URLSearchParams();

            params.append('limit', String(filters.limit || 10));
            params.append('offset', String(filters.offset || 0));

            if (filters.search) params.append('search', filters.search);
            if (filters.payment_state && filters.payment_state !== 'all') params.append('payment_state', filters.payment_state);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);

            const response = await apiClient.get<AdminInvoicesResponse>(`/api/portal/invoices?${params.toString()}`);
            return response;
        } catch (error) {
            console.warn('Backend API endpoint missing or error. Using MOCK data for demonstration.');
            // Mock data fallback
            return {
                invoices: [
                    {
                        id: 1,
                        name: "INV/2023/0001",
                        partner_name: "Juan Perez",
                        partner_phone: "51987654321",
                        invoice_date: "2023-10-01",
                        invoice_date_due: "2023-10-15", // Past due if today is 2026!
                        amount_total: 150.00,
                        currency: "S/",
                        payment_state: "not_paid",
                        reading: {
                            id: 101,
                            period: "Octubre 2023",
                            consumption: 25,
                            service_type: "water"
                        },
                        download_url: "#"
                    },
                    {
                        id: 2,
                        name: "INV/2023/0002",
                        partner_name: "Maria Lopez",
                        partner_phone: "51912345678",
                        invoice_date: "2023-10-02",
                        invoice_date_due: "2023-10-20",
                        amount_total: 85.50,
                        currency: "S/",
                        payment_state: "paid",
                        reading: {
                            id: 102,
                            period: "Octubre 2023",
                            consumption: 120,
                            service_type: "electricity"
                        },
                        download_url: "#"
                    }
                ],
                total: 2,
                stats: {
                    total_invoiced: 235.50,
                    total_pending: 150.00,
                    total_paid: 85.50
                }
            };
        }
    }

    /**
     * Descarga PDF fiscal de factura
     */
    async downloadInvoicePdf(invoiceId: number): Promise<Blob> {
        try {
            const response = await apiClient.get(`/api/portal/invoices/${invoiceId}/pdf`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error downloading invoice PDF:', error);
            throw error;
        }
    }

    /**
     * Obtiene detalles para el Recibo Técnico
     */
    async getReceiptDetails(readingId: number): Promise<AdminReceiptDetails> {
        try {
            const response = await apiClient.get<any>(`/api/portal/readings/${readingId}/receipt`);
            if (response.status === 'success') {
                return response.data;
            }
            throw new Error(response.message || 'Error fetching receipt details');
        } catch (error) {
            console.error('Error fetching receipt details:', error);
            throw error;
        }
    }

    /**
     * Genera link de WhatsApp para enviar recibo
     */
    generateWhatsAppLink(phone: string, customerName: string, period: string, amount: number, pdfLink: string): string {
        const message = `Hola ${customerName}, enviamos tu recibo de ${period} por un monto de S/ ${amount.toFixed(2)}. Puedes verlo aquí: ${pdfLink}`;
        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    }
}

export const adminInvoicesService = new AdminInvoicesService();
