import api from './api';
import { User, Organization, ApiResponse } from '@/types';

interface AdminStats {
    organizations: {
        total: number;
        hotels: number;
        agencies: number;
    };
    users: {
        total: number;
        active: number;
        super_admins: number;
    };
    recent: {
        organizations: Organization[];
        users: User[];
    };
}

interface OrganizationWithStats extends Organization {
    user_count: number;
}

export const adminService = {
    // Get system statistics
    getStats: async (): Promise<ApiResponse<AdminStats>> => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    // Get all organizations
    getOrganizations: async (params?: Record<string, any>): Promise<ApiResponse<OrganizationWithStats[]>> => {
        const response = await api.get('/admin/organizations', { params });
        return response.data;
    },

    // Get all users
    getUsers: async (params?: Record<string, any>): Promise<ApiResponse<User[]>> => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    // Update organization status
    updateOrganizationStatus: async (
        id: string,
        status: 'active' | 'suspended' | 'inactive'
    ): Promise<ApiResponse<Organization>> => {
        const response = await api.patch(`/admin/organizations/${id}/status`, { status });
        return response.data;
    },

    // Update user status
    updateUserStatus: async (
        id: string,
        is_active: boolean
    ): Promise<ApiResponse<User>> => {
        const response = await api.patch(`/admin/users/${id}/status`, { is_active });
        return response.data;
    },
};
