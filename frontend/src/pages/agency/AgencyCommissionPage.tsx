import { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import {
    Euro,
    TrendingUp,
    CalendarDays,
    Download,
    Building2,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

interface CommissionEntry {
    _id: string;
    booking_id: string;
    confirmation_code: string;
    hotel_name: string;
    guest_name: string;
    booking_total: number;
    commission_rate: number;
    commission_amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    check_out_date: string;
    payment_date?: string;
}

export default function AgencyCommissionPage() {
    const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

    // Mock data
    const stats = {
        total_earned: 4580,
        pending: 890,
        paid: 3690,
        this_month: 1240,
        last_month: 980,
        growth: 26.5,
    };

    const commissions: CommissionEntry[] = [
        {
            _id: '1',
            booking_id: 'b1',
            confirmation_code: 'BK-20260118-A1B',
            hotel_name: 'Grand Istanbul Hotel',
            guest_name: 'John Smith',
            booking_total: 450,
            commission_rate: 10,
            commission_amount: 45,
            status: 'paid',
            check_out_date: '2026-01-15',
            payment_date: '2026-01-20',
        },
        {
            _id: '2',
            booking_id: 'b2',
            confirmation_code: 'BK-20260117-C2D',
            hotel_name: 'City Center Hotel',
            guest_name: 'Maria Garcia',
            booking_total: 680,
            commission_rate: 10,
            commission_amount: 68,
            status: 'pending',
            check_out_date: '2026-02-05',
        },
        {
            _id: '3',
            booking_id: 'b3',
            confirmation_code: 'BK-20260115-E3F',
            hotel_name: 'Beach Resort Antalya',
            guest_name: 'Ahmed Hassan',
            booking_total: 750,
            commission_rate: 10,
            commission_amount: 75,
            status: 'paid',
            check_out_date: '2026-01-10',
            payment_date: '2026-01-15',
        },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Commission Reports</h1>
                    <p className="text-gray-600 mt-2">Track your earnings from hotel bookings</p>
                </div>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Earned</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_earned)}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <Euro className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pending Payout</p>
                            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <CalendarDays className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">This Month</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.this_month)}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">vs Last Month</p>
                            <p className="text-2xl font-bold text-green-600 flex items-center">
                                {stats.growth > 0 ? <ArrowUp className="w-5 h-5 mr-1" /> : <ArrowDown className="w-5 h-5 mr-1" />}
                                {stats.growth}%
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Period Selector */}
            <Card className="p-4">
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">View:</span>
                    <div className="flex space-x-1">
                        {(['month', 'quarter', 'year'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 text-sm rounded-lg transition-colors ${period === p
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Commission Table */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900">Commission History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Booking</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Hotel</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Guest</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Booking Total</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Rate</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Commission</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {commissions.map((entry) => (
                                <tr key={entry._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{entry.confirmation_code}</div>
                                        <div className="text-xs text-gray-500">
                                            Checkout: {new Date(entry.check_out_date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <span>{entry.hotel_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-900">{entry.guest_name}</td>
                                    <td className="px-4 py-3 text-gray-900">{formatCurrency(entry.booking_total)}</td>
                                    <td className="px-4 py-3 text-gray-500">{entry.commission_rate}%</td>
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-green-600">{formatCurrency(entry.commission_amount)}</span>
                                    </td>
                                    <td className="px-4 py-3">{getStatusBadge(entry.status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Summary by Hotel */}
            <Card className="p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Commission by Hotel</h2>
                <div className="space-y-4">
                    {[
                        { name: 'Grand Istanbul Hotel', total: 1250, bookings: 12 },
                        { name: 'City Center Hotel', total: 890, bookings: 8 },
                        { name: 'Beach Resort Antalya', total: 640, bookings: 5 },
                    ].map((hotel, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{hotel.name}</p>
                                    <p className="text-sm text-gray-500">{hotel.bookings} bookings</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600">{formatCurrency(hotel.total)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
