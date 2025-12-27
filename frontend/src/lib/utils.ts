import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';

// Tailwind class merge utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: string | Date, formatStr = 'MMM dd, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy HH:mm');
}

export function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
}

export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  const start = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
  const end = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
  return differenceInDays(end, start);
}

export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = startDate;
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  return dates;
}

// Currency formatting
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Status helpers
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Reservation statuses
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    checked_in: 'bg-green-100 text-green-800',
    checked_out: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-orange-100 text-orange-800',
    // Payment statuses
    PENDING: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    REFUNDED: 'bg-purple-100 text-purple-800',
    // Contract statuses
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    SUSPENDED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    checked_in: 'Checked In',
    checked_out: 'Checked Out',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    PENDING: 'Pending',
    PARTIAL: 'Partial',
    PAID: 'Paid',
    REFUNDED: 'Refunded',
    DRAFT: 'Draft',
    ACTIVE: 'Active',
    SUSPENDED: 'Suspended',
    EXPIRED: 'Expired',
  };
  return labels[status] || status;
}

// Meal plan labels
export function getMealPlanLabel(mealPlan: string): string {
  const labels: Record<string, string> = {
    RO: 'Room Only',
    BB: 'Bed & Breakfast',
    HB: 'Half Board',
    FB: 'Full Board',
    AI: 'All Inclusive',
  };
  return labels[mealPlan] || mealPlan;
}

// Role & permission helpers
export function hasPermission(
  permissions: Record<string, string[]> | undefined,
  resource: string,
  action: string
): boolean {
  if (!permissions) return false;
  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) return false;
  return resourcePermissions.includes(action) || resourcePermissions.includes('*');
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrator',
    manager: 'Manager',
    staff: 'Staff',
  };
  return labels[role] || role;
}

// String utilities
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Generate booking reference
export function generateBookingReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Occupancy rate calculation
export function calculateOccupancyRate(occupied: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
}

// Star rating display
export function getStarRating(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}
