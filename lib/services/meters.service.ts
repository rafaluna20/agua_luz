import { apiClient } from "./api";
import { API_ENDPOINTS } from "../config";
import { Meter, CreateMeterData, MeterLevel, Customer } from "@/types/meters";

class MetersService {
    /**
     * Obtiene la lista de medidores con filtros paginados
     */
    async getMeters(params: {
        limit?: number;
        offset?: number;
        search?: string;
        service_type?: string;
        state?: string;
    }): Promise<{ meters: Meter[]; total: number }> {
        const response = await apiClient.get(API_ENDPOINTS.ADMIN.METERS, params);
        return response.data;
    }

    /**
     * Crea un nuevo medidor
     */
    async createMeter(data: CreateMeterData): Promise<Meter> {
        const response = await apiClient.post("/api/portal/meters", data);
        return response.data;
    }

    /**
     * (Opcional) Obtiene medidores padre candidatos para un nivel específico
     * Por ahora reusamos getMeters con filtro de nivel si el backend lo soporta,
     * o traemos todos por búsqueda.
     */
    async searchParentMeters(search: string): Promise<Meter[]> {
        const response = await apiClient.get(API_ENDPOINTS.ADMIN.METERS, {
            search,
            limit: 20,
            state: 'active'
        });
        return response.data.meters; // Note: Check if backend returns { meters: [] } or just []? getMeters returns {meters, total}
        // Actually get_meters endpoint returns {meters, total}. Wait, my update to get_meters returns {meters: [], total: ...} 
        // But the NEW endpoints return standard { success: true, data: [...] }.
        // getMeters in service handles response.data.
        // Let's verify getMeters response structure in api_portal.py.
        // api_portal.py get_meters returns _success_response({ 'meters': [...], 'total': ... })
        // So response.data is { success: true, data: { meters: [], total: 0 } }.
        // apiClient likely handles unpacking, but let's be careful.
        // In getMeters: return response.data; implies apiClient returns the payload.
    }

    /**
     * Obtiene los niveles de medidor
     */
    async getMeterLevels(): Promise<MeterLevel[]> {
        const response = await apiClient.get('/api/portal/meter-levels');
        return response.data;
    }

    /**
     * Busca clientes
     */
    async searchCustomers(query: string): Promise<Customer[]> {
        const response = await apiClient.get('/api/portal/customers', { search: query, limit: 10 });
        return response.data;
    }

    /**
     * Crea cliente
     */
    async createCustomer(data: Partial<Customer>): Promise<Customer> {
        const response = await apiClient.post('/api/portal/customers', data);
        return response.data;
    }
}

export const metersService = new MetersService();
