import { apiClient } from './api';

//  ==================== ADMIN WEB INTERFACES ====================

export interface AdminReading {
    id: number;
    meter_code: string;
    meter_type: 'agua' | 'luz';
    client: string;
    location: string;
    reading_date: string;
    reading_time: string;
    previous_value: number;
    current_value: number;
    consumption: number;
    unit: string;
    state: 'draft' | 'validated' | 'anomaly' | 'rejected';
    read_by: string;
    has_photo: boolean;
    has_geolocation: boolean;
    notes: string;
    anomaly_reason: string;
    days_diff: number;
    daily_average: number;
}

export interface AdminReadingsStats {
    total: number;
    validated: number;
    draft: number;
    anomaly: number;
    rejected: number;
}

export interface AdminReadingsResponse {
    readings: AdminReading[];
    total: number;
    stats: AdminReadingsStats;
}

export interface AdminReadingsFilters {
    limit?: number;
    offset?: number;
    search?: string;
    state?: string;
    service_type?: string;
    date_filter?: string;
    date_from?: string;
    date_to?: string;
}

// ==================== ADMIN WEB SERVICE ====================

export class AdminReadingsService {
    /**
     * Obtiene lecturas con paginación y filtros
     */
    async getReadings(filters: AdminReadingsFilters = {}): Promise<AdminReadingsResponse> {
        try {
            const params = new URLSearchParams();

            params.append('limit', String(filters.limit || 10));
            params.append('offset', String(filters.offset || 0));

            if (filters.search) params.append('search', filters.search);
            if (filters.state) params.append('state', filters.state);
            if (filters.service_type) params.append('service_type', filters.service_type);
            if (filters.date_filter) params.append('date_filter', filters.date_filter);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);

            const response = await apiClient.get(`/api/portal/readings?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching readings:', error);
            throw error;
        }
    }

    /**
     * Valida una lectura
     */
    async validateReading(id: number): Promise<{ id: number; state: string }> {
        try {
            const response = await apiClient.post(`/api/portal/readings/${id}/validate`);
            return response.data;
        } catch (error) {
            console.error('Error validating reading:', error);
            throw error;
        }
    }

    /**
     * Rechaza una lectura
     */
    async rejectReading(id: number, reason?: string): Promise<{ id: number; state: string }> {
        try {
            const response = await apiClient.post(
                `/api/portal/readings/${id}/reject`,
                { reason }
            );
            return response.data;
        } catch (error) {
            console.error('Error rejecting reading:', error);
            throw error;
        }
    }

    /**
     * Exporta lecturas a CSV
     */
    async exportReadings(filters: AdminReadingsFilters = {}): Promise<Blob> {
        try {
            const params = new URLSearchParams();

            if (filters.search) params.append('search', filters.search);
            if (filters.state) params.append('state', filters.state);
            if (filters.service_type) params.append('service_type', filters.service_type);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);

            const response = await apiClient.get(
                `/api/portal/readings/export?${params.toString()}`,
                {
                    responseType: 'blob',
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error exporting readings:', error);
            throw error;
        }
    }
}

// Singleton instance
export const adminReadingsService = new AdminReadingsService();
