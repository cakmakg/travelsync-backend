import api from './api';
import { Reservation, ApiResponse } from '@/types';

export const reservationService = {
  // Get all reservations
  getAll: async (params?: Record<string, any>): Promise<ApiResponse<Reservation[]>> => {
    const response = await api.get('/reservations', { params });
    return response.data;
  },

  // Get reservation by ID
  getById: async (id: string): Promise<ApiResponse<Reservation>> => {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
  },

  // Create reservation
  create: async (data: Partial<Reservation>): Promise<ApiResponse<Reservation>> => {
    const response = await api.post('/reservations', data);
    return response.data;
  },

  // Update reservation
  update: async (id: string, data: Partial<Reservation>): Promise<ApiResponse<Reservation>> => {
    const response = await api.put(`/reservations/${id}`, data);
    return response.data;
  },

  // Cancel reservation
  cancel: async (id: string, reason?: string): Promise<ApiResponse> => {
    const response = await api.post(`/reservations/${id}/cancel`, { reason });
    return response.data;
  },

  // Check-in reservation
  checkIn: async (id: string): Promise<ApiResponse> => {
    const response = await api.post(`/reservations/${id}/check-in`);
    return response.data;
  },

  // Check-out reservation
  checkOut: async (id: string): Promise<ApiResponse> => {
    const response = await api.post(`/reservations/${id}/check-out`);
    return response.data;
  },
};
