export interface Meter {
    id: number;
    code: string;
    qr_code: string;
    service_type: 'electricity' | 'water';
    service_type_label?: string;
    level?: string;
    meter_level_code?: string; // Backend field
    state: 'active' | 'inactive' | 'maintenance' | 'replaced';
    customer_name?: string;
    customer_id?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    last_reading_value?: number;
    last_reading_date?: string;
    parent_meter_id?: number;
    children?: number; // Count of children
}

export interface CreateMeterData {
    code: string;
    service_type: 'electricity' | 'water';
    meter_level_code: string;
    parent_meter_id?: number;
    customer_id?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    brand?: string;
    model?: string;
    serial_number?: string;
}

export interface MeterLevel {
    id: number;
    name: string;
    code: string;
    sequence: number;
}

export interface Customer {
    id: number;
    name: string;
    vat?: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    active?: boolean;
    meter_count?: number;
    balance?: number;
}
