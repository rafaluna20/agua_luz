import { apiClient } from './api';
import { config } from '@/lib/config';

// ==================== INTERFACES ====================

export interface Stage {
    id: number;
    name: string;
}

export interface Block {
    id: number;
    name: string;
}

export interface QRGeneratorFilters {
    service?: 'water' | 'electricity';
    stage?: number;
    block?: number;
    lot_from?: number;
    lot_to?: number;
}

export interface MeterCountResponse {
    total: number;
}

// ==================== QR GENERATOR SERVICE ====================

class QRGeneratorService {

    /**
     * Get list of stages/etapas for filters
     */
    async getStages(): Promise<Stage[]> {
        try {
            const response = await apiClient.post('/api/portal/stages', {});
            return response?.data?.stages || [];
        } catch (error) {
            console.error('Error fetching stages:', error);
            return [];
        }
    }

    /**
     * Get list of blocks/manzanas for filters
     */
    async getBlocks(): Promise<Block[]> {
        try {
            const response = await apiClient.post('/api/portal/blocks', {});
            return response?.data?.blocks || [];
        } catch (error) {
            console.error('Error fetching blocks:', error);
            return [];
        }
    }

    /**
     * Count meters based on filters
     */
    async countMeters(filters: QRGeneratorFilters): Promise<number> {
        try {
            const response = await apiClient.post('/api/portal/meters/count', filters);
            return response?.data?.total || 0;
        } catch (error) {
            console.error('Error counting meters:', error);
            return 0;
        }
    }

    /**
     * Generate download URL for batch QR PDF
     */
    generateBatchURL(filters: QRGeneratorFilters): string {
        const params = new URLSearchParams();

        if (filters.service) {
            params.append('service', filters.service);
        }
        if (filters.stage) {
            params.append('stage', filters.stage.toString());
        }
        if (filters.block) {
            params.append('block', filters.block.toString());
        }
        if (filters.lot_from) {
            params.append('lot_from', filters.lot_from.toString());
        }
        if (filters.lot_to) {
            params.append('lot_to', filters.lot_to.toString());
        }

        return `${config.apiUrl}/api/portal/qr/batch?${params.toString()}`;
    }
}

export const qrGeneratorService = new QRGeneratorService();
