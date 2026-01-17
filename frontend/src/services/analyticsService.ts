import api from './api';
import { ApiResponse } from '@/types';

interface DashboardStats {
    total_properties: number;
    today: {
        active_reservations: number;
        revenue: number;
        occupancy_rate: number;
        occupied_rooms: number;
        total_rooms: number;
    };
}

interface OccupancyReport {
    propertyId: string;
    start_date: string;
    end_date: string;
    nights: number;
    occupied_room_nights: number;
    capacity: number;
    occupancy_rate: number;
}

interface RevenueReport {
    propertyId: string | null;
    start_date: string;
    end_date: string;
    revenue: number;
    reservations: number;
}

interface ReservationStats {
    propertyId: string | null;
    stats: {
        [status: string]: {
            count: number;
            avg_nights: number;
            avg_revenue: number;
        };
    };
}

export const analyticsService = {
    // Get dashboard overview
    getDashboard: async (): Promise<ApiResponse<DashboardStats>> => {
        const response = await api.get('/analytics/dashboard');
        return response.data;
    },

    // Get occupancy report for a property
    getOccupancy: async (
        propertyId: string,
        startDate: string,
        endDate: string
    ): Promise<ApiResponse<OccupancyReport>> => {
        const response = await api.get('/analytics/occupancy', {
            params: {
                propertyId,
                start_date: startDate,
                end_date: endDate,
            },
        });
        return response.data;
    },

    // Get revenue report
    getRevenue: async (
        startDate: string,
        endDate: string,
        propertyId?: string
    ): Promise<ApiResponse<RevenueReport>> => {
        const response = await api.get('/analytics/revenue', {
            params: {
                start_date: startDate,
                end_date: endDate,
                propertyId,
            },
        });
        return response.data;
    },

    // Get reservation statistics
    getReservationStats: async (
        propertyId?: string
    ): Promise<ApiResponse<ReservationStats>> => {
        const response = await api.get('/analytics/reservations/stats', {
            params: { propertyId },
        });
        return response.data;
    },
};
