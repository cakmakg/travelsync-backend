import apiClient from './client';
import type { ApiResponse, Property } from '../types';

export interface CreatePropertyData {
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  star_rating: number;
  property_type: string;
  total_rooms: number;
  total_floors?: number;
  amenities?: string[];
  check_in_time: string;
  check_out_time: string;
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  currency: string;
  timezone: string;
  tax_rate: number;
  tax_included?: boolean;
  description?: string;
}

export const propertiesApi = {
  getAll: async (): Promise<ApiResponse<Property[]>> => {
    const response = await apiClient.get('/properties');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Property>> => {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  getByCity: async (city: string): Promise<ApiResponse<Property[]>> => {
    const response = await apiClient.get(`/properties/city/${city}`);
    return response.data;
  },

  getByCountry: async (country: string): Promise<ApiResponse<Property[]>> => {
    const response = await apiClient.get(`/properties/country/${country}`);
    return response.data;
  },

  getStats: async (id: string): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await apiClient.get(`/properties/${id}/stats`);
    return response.data;
  },

  create: async (data: CreatePropertyData): Promise<ApiResponse<Property>> => {
    const response = await apiClient.post('/properties', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreatePropertyData>): Promise<ApiResponse<Property>> => {
    const response = await apiClient.put(`/properties/${id}`, data);
    return response.data;
  },

  updateAmenities: async (id: string, amenities: string[]): Promise<ApiResponse<Property>> => {
    const response = await apiClient.put(`/properties/${id}/amenities`, { amenities });
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/properties/${id}`);
    return response.data;
  },

  restore: async (id: string): Promise<ApiResponse<Property>> => {
    const response = await apiClient.post(`/properties/${id}/restore`);
    return response.data;
  },
};

export default propertiesApi;
