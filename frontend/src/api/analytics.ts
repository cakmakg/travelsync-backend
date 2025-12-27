import apiClient from './client';
import type { ApiResponse, DashboardMetrics, OccupancyStats, RevenueStats } from '../types';

export interface AnalyticsParams {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
}

export const analyticsApi = {
  getDashboard: async (params?: AnalyticsParams): Promise<ApiResponse<DashboardMetrics>> => {
    const response = await apiClient.get('/analytics/dashboard', { params });
    return response.data;
  },

  getOccupancy: async (params?: AnalyticsParams): Promise<ApiResponse<OccupancyStats[]>> => {
    const response = await apiClient.get('/analytics/occupancy', { params });
    return response.data;
  },

  getRevenue: async (params?: AnalyticsParams): Promise<ApiResponse<RevenueStats[]>> => {
    const response = await apiClient.get('/analytics/revenue', { params });
    return response.data;
  },

  getReservationStats: async (params?: AnalyticsParams): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await apiClient.get('/analytics/reservations/stats', { params });
    return response.data;
  },
};

export default analyticsApi;
