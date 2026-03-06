import api from './api';
import { ApiResponse } from '@/types';

// Types for Package creation
export interface PackageData {
    name: string;
    package_type: string;
    description?: string;
    destination: {
        country: string;
        city: string;
    };
    duration: {
        nights: number;
        days: number;
    };
    accommodation: any[];
    transfers: any[];
    activities: any[];
    pricing: {
        currency: string;
        price_adult: number;
        price_child?: number;
        single_supplement?: number;
        includes_transfers: boolean;
        includes_activities: boolean;
    };
    valid_from: string;
    valid_to: string;
    status: 'draft' | 'active' | 'archived';
}

class PackageService {
    /**
     * Create a new package
     */
    async createPackage(data: PackageData): Promise<any> {
        const response = await api.post<ApiResponse>('/packages', data);
        return response.data;
    }

    /**
     * Generate and download PDF for a specific package
     */
    async generatePdf(id: string): Promise<Blob> {
        const response = await api.post(`/packages/${id}/generate-pdf`, {}, {
            responseType: 'blob', // crucial for handling binary data
        });
        return response.data;
    }
}

export const packageService = new PackageService();
