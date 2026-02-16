import { apiClient } from "./api";
import { Customer } from "@/types/meters";

export interface CustomersResponse {
    customers: Customer[];
    total: number;
    stats: {
        total: number;
        active: number;
        inactive: number;
        with_debt: number;
    };
}

export interface GetCustomersParams {
    limit?: number;
    offset?: number;
    search?: string;
    status?: 'all' | 'active' | 'inactive';
    has_debt?: 'true' | 'false';
    service_type?: 'electricity' | 'water';
    has_meter?: 'true' | 'false';
}

class CustomersService {
    /**
     * Obtiene la lista de clientes con paginación y búsqueda
     */
    async getCustomers(params: GetCustomersParams): Promise<CustomersResponse> {
        try {
            const response = await apiClient.get('/api/portal/customers', params);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Crea un nuevo cliente
     */
    async createCustomer(data: Partial<Customer>): Promise<Customer> {
        try {
            const response = await apiClient.post("/api/portal/customers", data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export const customersService = new CustomersService();
