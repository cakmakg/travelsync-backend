import api from './api';
import { RoomType, ApiResponse } from '@/types';

export interface CreateRoomTypeData {
  property_id: string;
  name: string;
  code: string;
  description?: string;
  capacity: {
    adults: number;
    children: number;
  };
  bed_configuration: string;
  size_sqm?: number;
  amenities?: string[];
  total_quantity: number;
}

export interface UpdateRoomTypeData extends Partial<CreateRoomTypeData> { }

export const roomTypeService = {
  // Get all room types
  async getAll(params: Record<string, any> = {}): Promise<ApiResponse<RoomType[]>> {
    const response = await api.get('/room-types', { params });
    return response.data;
  },

  // Get room types by property
  async getByProperty(propertyId: string): Promise<ApiResponse<RoomType[]>> {
    const response = await api.get(`/room-types/property/${propertyId}`);
    return response.data;
  },

  // Get single room type
  async getById(id: string): Promise<ApiResponse<RoomType>> {
    const response = await api.get(`/room-types/${id}`);
    return response.data;
  },

  // Create room type
  async create(data: CreateRoomTypeData): Promise<ApiResponse<RoomType>> {
    const response = await api.post('/room-types', data);
    return response.data;
  },

  // Update room type
  async update(id: string, data: UpdateRoomTypeData): Promise<ApiResponse<RoomType>> {
    const response = await api.put(`/room-types/${id}`, data);
    return response.data;
  },

  // Delete room type
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/room-types/${id}`);
    return response.data;
  },

  // Toggle active status
  async toggleActive(id: string): Promise<ApiResponse<RoomType>> {
    const response = await api.put(`/room-types/${id}/toggle-active`);
    return response.data;
  },

  // Toggle bookable status
  async toggleBookable(id: string): Promise<ApiResponse<RoomType>> {
    const response = await api.put(`/room-types/${id}/toggle-bookable`);
    return response.data;
  },
};
