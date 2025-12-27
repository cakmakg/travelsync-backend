export { default as apiClient } from './client';
export { authApi } from './auth';
export { propertiesApi } from './properties';
export { roomTypesApi } from './roomTypes';
export { reservationsApi } from './reservations';
export { analyticsApi } from './analytics';

// Re-export types for convenience
export type { AuthResponse } from './auth';
export type { CreatePropertyData } from './properties';
export type { CreateRoomTypeData } from './roomTypes';
export type { CreateReservationData, ReservationStats } from './reservations';
export type { AnalyticsParams } from './analytics';
