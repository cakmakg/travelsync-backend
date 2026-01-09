import api from './api';
import { Property, ApiResponse } from '@/types';

export const propertyService = {
  // Get all properties
  getAll: async (params?: Record<string, any>): Promise<ApiResponse<Property[]>> => {
    const response = await api.get('/properties', { params });
    return response.data;
  },

  // Get property by ID
  getById: async (id: string): Promise<ApiResponse<Property>> => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  // Create property
  create: async (data: Partial<Property>): Promise<ApiResponse<Property>> => {
    const response = await api.post('/properties', data);
    return response.data;
  },

  // Update property
  update: async (id: string, data: Partial<Property>): Promise<ApiResponse<Property>> => {
    const response = await api.put(`/properties/${id}`, data);
    return response.data;
  },

  // Delete property
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },
};
