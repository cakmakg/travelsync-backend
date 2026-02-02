import api from './api';

export interface FlashOfferData {
    property_id: string;
    room_type_id?: string;
    room_count: number;
    discount_percentage: number;
    valid_from: string;
    valid_to: string;
    hours_valid?: number;
    target_agencies?: 'all' | string[];
    message_note?: string;
}

export interface FlashOfferResult {
    offer: {
        _id: string;
        title: string;
        property_name?: string;
        discount_value: number;
        discount_type: string;
        rooms_available: number;
    };
    whatsapp_sent?: number;
}

export interface WhatsAppStatus {
    configured: boolean;
    provider: string;
    fromNumber: string | null;
    enabled_agencies: number;
}

export interface PriceSuggestion {
    current_price: number | null;
    suggested_discount: number;
    reason: string;
    confidence: number;
}

// Flash Offer API
export const flashOfferService = {
    // Flash Offer oluştur
    create: async (data: FlashOfferData) => {
        // Frontend alanlarını backend alanlarına dönüştür
        const payload = {
            property_id: data.property_id,
            room_type_id: data.room_type_id,
            rooms_available: data.room_count,
            discount_type: 'percentage',
            discount_value: data.discount_percentage,
            stay_date_from: data.valid_from,
            stay_date_to: data.valid_to,
            hours_valid: data.hours_valid || 24,
            target_type: data.target_agencies === 'all' ? 'all_partners' : 'specific_agencies',
            target_agency_ids: Array.isArray(data.target_agencies) ? data.target_agencies : [],
            description: data.message_note,
        };
        const response = await api.post<{ success: boolean; data: FlashOfferResult }>('/flash-offers', payload);
        return response.data;
    },

    // WhatsApp durumu
    getWhatsAppStatus: async () => {
        const response = await api.get<{ success: boolean; data: WhatsAppStatus }>('/flash-offers/whatsapp-status');
        return response.data;
    },

    // Test mesajı gönder
    sendTestMessage: async (phone_number: string) => {
        const response = await api.post<{ success: boolean; data: any }>('/flash-offers/test', { phone_number });
        return response.data;
    },

    // Acenteleri listele
    getAgencies: async () => {
        const response = await api.get<{ success: boolean; data: any }>('/flash-offers/agencies');
        return response.data;
    },

    // Fiyat önerisi al
    getPriceSuggestion: async (property_id: string, room_type_id?: string, date?: string) => {
        const params = new URLSearchParams({ property_id });
        if (room_type_id) params.append('room_type_id', room_type_id);
        if (date) params.append('date', date);

        const response = await api.get<{ success: boolean; data: PriceSuggestion }>(`/flash-offers/price-suggestion?${params}`);
        return response.data;
    },
};

// PDF Rapor API
export const reportService = {
    // GoBD Raporu indir
    downloadGoBDReport: async (start_date: string, end_date: string) => {
        const response = await api.get('/reports/gobd', {
            params: { start_date, end_date },
            responseType: 'blob',
        });

        // Blob'u dosya olarak indir
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `GoBD_Rapor_${start_date}_${end_date}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);

        return true;
    },
};

export default flashOfferService;
