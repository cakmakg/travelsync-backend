import apiClient from './client';
import type { ApiResponse, User, LoginCredentials, RegisterData } from '../types';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ token: string }>> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

export default authApi;
