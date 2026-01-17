import api from './api';
import { ApiResponse } from '@/types';

interface Price {
    _id: string;
    property_id: string;
    room_type_id: string;
    rate_plan_id: string;
    date: string;
    amount: number;
    original_amount?: number;
    is_available: boolean;
    source: 'MANUAL' | 'BULK_UPLOAD' | 'AI_SUGGESTION' | 'CHANNEL_MANAGER';
    currency?: string;
    created_at: string;
    updated_at: string;
}

interface PriceSummary {
    min: number;
    max: number;
    avg: number;
    count: number;
}

interface BulkPriceUpdate {
    property_id: string;
    room_type_id: string;
    rate_plan_id: string;
    date: string;
    amount: number;
    is_available?: boolean;
}

export const priceService = {
    // Get all prices with filters
    getAll: async (params?: Record<string, any>): Promise<ApiResponse<Price[]>> => {
        const response = await api.get('/prices', { params });
        return response.data;
    },

    // Get prices for a property
    getByProperty: async (
        propertyId: string,
        params?: Record<string, any>
    ): Promise<ApiResponse<{ items: Price[], pagination: any }>> => {
        const response = await api.get(`/prices/property/${propertyId}`, { params });
        return response.data;
    },

    // Get prices for date range
    getForDateRange: async (
        propertyId: string,
        roomTypeId: string,
        ratePlanId: string,
        startDate: string,
        endDate: string
    ): Promise<ApiResponse<Price[]>> => {
        const response = await api.get(
            `/prices/${propertyId}/${roomTypeId}/${ratePlanId}/range`,
            { params: { start_date: startDate, end_date: endDate } }
        );
        return response.data;
    },

    // Get price summary (min, max, avg)
    getPriceSummary: async (
        propertyId: string,
        roomTypeId: string,
        ratePlanId: string,
        startDate: string,
        endDate: string
    ): Promise<ApiResponse<PriceSummary>> => {
        const response = await api.get(
            `/prices/${propertyId}/${roomTypeId}/${ratePlanId}/summary`,
            { params: { start_date: startDate, end_date: endDate } }
        );
        return response.data;
    },

    // Create single price
    create: async (data: Partial<Price>): Promise<ApiResponse<Price>> => {
        const response = await api.post('/prices', data);
        return response.data;
    },

    // Bulk upsert prices
    bulkUpsert: async (prices: BulkPriceUpdate[]): Promise<ApiResponse<{ created: number, updated: number, total: number }>> => {
        const response = await api.post('/prices/bulk-upsert', { prices });
        return response.data;
    },

    // Update single price
    update: async (id: string, data: Partial<Price>): Promise<ApiResponse<Price>> => {
        const response = await api.put(`/prices/${id}`, data);
        return response.data;
    },

    // Bulk update date range
    bulkUpdateDateRange: async (
        propertyId: string,
        roomTypeId: string,
        ratePlanId: string,
        startDate: string,
        endDate: string,
        amount?: number,
        isAvailable?: boolean
    ): Promise<ApiResponse<{ updated_count: number }>> => {
        const response = await api.put(
            `/prices/${propertyId}/${roomTypeId}/${ratePlanId}/bulk-update`,
            {
                start_date: startDate,
                end_date: endDate,
                amount,
                is_available: isAvailable
            }
        );
        return response.data;
    },

    // Delete price
    delete: async (id: string): Promise<ApiResponse> => {
        const response = await api.delete(`/prices/${id}`);
        return response.data;
    },

    // Delete date range
    deleteDateRange: async (
        propertyId: string,
        roomTypeId: string,
        ratePlanId: string,
        startDate: string,
        endDate: string
    ): Promise<ApiResponse<{ deleted_count: number }>> => {
        const response = await api.delete(
            `/prices/${propertyId}/${roomTypeId}/${ratePlanId}/range`,
            { data: { start_date: startDate, end_date: endDate } }
        );
        return response.data;
    },
};
