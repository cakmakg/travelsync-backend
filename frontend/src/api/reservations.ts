import apiClient from './client';
import type { ApiResponse, Reservation, ReservationStatus } from '../types';

export interface CreateReservationData {
  property_id: string;
  room_type_id: string;
  rate_plan_id: string;
  guest: {
    name: string;
    email?: string;
    phone?: string;
    country?: string;
    special_requests?: string;
  };
  check_in_date: string;
  check_out_date: string;
  guests: {
    adults: number;
    children?: number;
  };
  source?: string;
  agency_id?: string;
  agency_booking_ref?: string;
  payment?: {
    method: string;
    status?: string;
  };
  notes?: string;
  idempotency_key?: string;
}

export interface ReservationStats {
  total: number;
  pending: number;
  confirmed: number;
  checked_in: number;
  checked_out: number;
  cancelled: number;
  no_show: number;
}

export const reservationsApi = {
  getAll: async (): Promise<ApiResponse<Reservation[]>> => {
    const response = await apiClient.get('/reservations');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.get(`/reservations/${id}`);
    return response.data;
  },

  getByBookingReference: async (reference: string): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.get(`/reservations/reference/${reference}`);
    return response.data;
  },

  getByStatus: async (status: ReservationStatus): Promise<ApiResponse<Reservation[]>> => {
    const response = await apiClient.get(`/reservations/status/${status}`);
    return response.data;
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<ApiResponse<Reservation[]>> => {
    const response = await apiClient.get('/reservations/date-range', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getTodayCheckIns: async (): Promise<ApiResponse<Reservation[]>> => {
    const response = await apiClient.get('/reservations/today/check-ins');
    return response.data;
  },

  getTodayCheckOuts: async (): Promise<ApiResponse<Reservation[]>> => {
    const response = await apiClient.get('/reservations/today/check-outs');
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<ReservationStats>> => {
    const response = await apiClient.get('/reservations/stats');
    return response.data;
  },

  create: async (data: CreateReservationData): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.post('/reservations', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateReservationData>): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.put(`/reservations/${id}`, data);
    return response.data;
  },

  checkIn: async (id: string): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.post(`/reservations/${id}/check-in`);
    return response.data;
  },

  checkOut: async (id: string): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.post(`/reservations/${id}/check-out`);
    return response.data;
  },

  cancel: async (id: string, reason?: string): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.post(`/reservations/${id}/cancel`, { reason });
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/reservations/${id}`);
    return response.data;
  },

  restore: async (id: string): Promise<ApiResponse<Reservation>> => {
    const response = await apiClient.post(`/reservations/${id}/restore`);
    return response.data;
  },
};

export default reservationsApi;
