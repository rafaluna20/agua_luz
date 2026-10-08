
import { apiClient } from './api';

// ==================== INTERFACES ====================

export interface AdminInvoice {
    id: number;
    name: string;
    partner_name: string;
    partner_phone?: string;
    invoice_date: string;
    invoice_date_due?: string;
    due_date?: string;  // Odoo lo envía con este nombre
    amount_residual?: number;
    amount_total: number;
    currency: string;
    payment_state: 'not_paid' | 'in_payment' | 'paid' | 'reversed' | 'partial';
    document_type: 'Boleta' | 'Factura';  // Tipo de comprobante SUNAT
    service_type?: 'water' | 'electricity' | 'internet' | 'other';  // Tipo de servicio
    service_name?: string;  // Nombre real del producto/servicio
    has_informative_receipt: boolean;  // Si tiene recibo informativo disponible
    voucher_url: string;  // URL del comprobante SUNAT (Boleta/Factura)
    receipt_url?: string | null;  // URL del recibo informativo (solo servicios medidos)
    download_url: string;  // Deprecated - usar voucher_url
    reading?: {
        id: number;
        period: string;
        consumption: number;
        service_type: 'water' | 'electricity';
    };
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
    service_type?: 'water' | 'electricity' | 'all';
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
            if (filters.service_type && filters.service_type !== 'all') params.append('service_type', filters.service_type);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);

            const response = await apiClient.get<{ success: boolean; data: AdminInvoicesResponse }>(`/api/portal/invoices?${params.toString()}`);

            // Odoo devuelve { success: true, data: {...} }, necesitamos extraer solo data
            if (response && 'data' in response) {
                return response.data;
            }

            // Fallback si la estructura es diferente
            return response as any;
        } catch (error) {
            console.error('Error fetching invoices:', error);
            throw error;
        }
    }

    /**
     * Descarga PDF fiscal de factura
     */
    /**
     * Descarga PDF fiscal de factura
     */
    async downloadInvoicePdf(invoiceId: number): Promise<Blob> {
        try {
            return await apiClient.get<Blob>(`/api/portal/invoice/${invoiceId}/pdf`, undefined, {
                responseType: 'blob'
            });
        } catch (error) {
            console.error('Error downloading invoice PDF:', error);
            throw error;
        }
    }

    /**
     * Descarga el Recibo Profesional (Agua/Luz) con historial y QR
     */
    async downloadUtilityReceipt(invoiceId: number): Promise<Blob> {
        try {
            return await apiClient.get<Blob>(`/api/portal/invoice/${invoiceId}/receipt`, undefined, {
                responseType: 'blob'
            });
        } catch (error) {
            console.error('Error downloading utility receipt:', error);
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
