import apiClient from './client';
import type { ApiResponse, RoomType } from '../types';

export interface CreateRoomTypeData {
  property_id: string;
  code: string;
  name: string;
  capacity: {
    adults: number;
    children: number;
  };
  bed_configuration: string;
  size_sqm?: number;
  total_quantity: number;
  amenities?: string[];
  extra_bed_available?: boolean;
  extra_bed_price?: number;
  images?: string[];
  description?: string;
}

export const roomTypesApi = {
  getAll: async (): Promise<ApiResponse<RoomType[]>> => {
    const response = await apiClient.get('/room-types');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<RoomType>> => {
    const response = await apiClient.get(`/room-types/${id}`);
    return response.data;
  },

  getByProperty: async (propertyId: string): Promise<ApiResponse<RoomType[]>> => {
    const response = await apiClient.get(`/room-types/property/${propertyId}`);
    return response.data;
  },

  getBookableByProperty: async (propertyId: string): Promise<ApiResponse<RoomType[]>> => {
    const response = await apiClient.get(`/room-types/property/${propertyId}/bookable`);
    return response.data;
  },

  getStats: async (id: string): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await apiClient.get(`/room-types/${id}/stats`);
    return response.data;
  },

  create: async (data: CreateRoomTypeData): Promise<ApiResponse<RoomType>> => {
    const response = await apiClient.post('/room-types', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateRoomTypeData>): Promise<ApiResponse<RoomType>> => {
    const response = await apiClient.put(`/room-types/${id}`, data);
    return response.data;
  },

  toggleActive: async (id: string): Promise<ApiResponse<RoomType>> => {
    const response = await apiClient.put(`/room-types/${id}/toggle-active`);
    return response.data;
  },

  toggleBookable: async (id: string): Promise<ApiResponse<RoomType>> => {
    const response = await apiClient.put(`/room-types/${id}/toggle-bookable`);
    return response.data;
  },

  updateAmenities: async (id: string, amenities: string[]): Promise<ApiResponse<RoomType>> => {
    const response = await apiClient.put(`/room-types/${id}/amenities`, { amenities });
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/room-types/${id}`);
    return response.data;
  },

  restore: async (id: string): Promise<ApiResponse<RoomType>> => {
    const response = await apiClient.post(`/room-types/${id}/restore`);
    return response.data;
  },
};

export default roomTypesApi;
