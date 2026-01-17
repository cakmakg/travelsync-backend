import { useState } from 'react';
import Card from '@/components/common/Card';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Bed,
    Users,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState('month');

    // Mock data
    const stats = {
        revenue: { value: 125400, change: 12.5, trend: 'up' },
        occupancy: { value: 78, change: 5.2, trend: 'up' },
        adr: { value: 142, change: -2.1, trend: 'down' },
        revpar: { value: 111, change: 8.3, trend: 'up' },
    };

    // Mock chart data for revenue
    const revenueData = [
        { month: 'Jan', value: 85000 },
        { month: 'Feb', value: 92000 },
        { month: 'Mar', value: 78000 },
        { month: 'Apr', value: 95000 },
        { month: 'May', value: 110000 },
        { month: 'Jun', value: 125400 },
    ];

    const maxRevenue = Math.max(...revenueData.map(d => d.value));

    // Mock occupancy by room type
    const occupancyByRoom = [
        { name: 'Standard Room', occupancy: 85, revenue: 32000 },
        { name: 'Deluxe Room', occupancy: 72, revenue: 45000 },
        { name: 'Junior Suite', occupancy: 68, revenue: 28000 },
        { name: 'Executive Suite', occupancy: 45, revenue: 20400 },
    ];

    // Mock booking sources
    const bookingSources = [
        { name: 'Direct', value: 35, color: 'bg-blue-500' },
        { name: 'Booking.com', value: 28, color: 'bg-purple-500' },
        { name: 'Agencies', value: 22, color: 'bg-green-500' },
        { name: 'Other OTAs', value: 15, color: 'bg-orange-500' },
    ];

    // Mock recent performance
    const weeklyPerformance = [
        { day: 'Mon', bookings: 12, revenue: 2400 },
        { day: 'Tue', bookings: 8, revenue: 1800 },
        { day: 'Wed', bookings: 15, revenue: 3200 },
        { day: 'Thu', bookings: 18, revenue: 3800 },
        { day: 'Fri', bookings: 25, revenue: 5500 },
        { day: 'Sat', bookings: 32, revenue: 7200 },
        { day: 'Sun', bookings: 22, revenue: 4800 },
    ];

    const maxBookings = Math.max(...weeklyPerformance.map(d => d.bookings));

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-8 h-8 text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                    </div>
                    <p className="text-gray-600">Track your hotel performance and insights</p>
                </div>
                <div className="flex gap-2">
                    {['week', 'month', 'quarter', 'year'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">€{stats.revenue.value.toLocaleString()}</p>
                            <div className={`flex items-center gap-1 mt-1 text-sm ${stats.revenue.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.revenue.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                {stats.revenue.change}% vs last month
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Occupancy Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.occupancy.value}%</p>
                            <div className={`flex items-center gap-1 mt-1 text-sm ${stats.occupancy.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.occupancy.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                {stats.occupancy.change}% vs last month
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Bed className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">ADR (Avg Daily Rate)</p>
                            <p className="text-2xl font-bold text-gray-900">€{stats.adr.value}</p>
                            <div className={`flex items-center gap-1 mt-1 text-sm ${stats.adr.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.adr.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                {Math.abs(stats.adr.change)}% vs last month
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">RevPAR</p>
                            <p className="text-2xl font-bold text-gray-900">€{stats.revpar.value}</p>
                            <div className={`flex items-center gap-1 mt-1 text-sm ${stats.revpar.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.revpar.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                {stats.revpar.change}% vs last month
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <Card title="Revenue Trend" subtitle="Monthly revenue performance">
                    <div className="h-64 flex items-end justify-between gap-2 pt-4">
                        {revenueData.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all hover:from-primary-700 hover:to-primary-500"
                                    style={{ height: `${(data.value / maxRevenue) * 100}%` }}
                                />
                                <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                                <span className="text-xs font-medium text-gray-700">€{(data.value / 1000).toFixed(0)}k</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Booking Sources */}
                <Card title="Booking Sources" subtitle="Distribution by channel">
                    <div className="space-y-4 pt-4">
                        {bookingSources.map((source, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">{source.name}</span>
                                    <span className="text-sm font-bold text-gray-900">{source.value}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full ${source.color} transition-all`}
                                        style={{ width: `${source.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Weekly Performance */}
                <Card title="Weekly Performance" subtitle="Last 7 days">
                    <div className="h-48 flex items-end justify-between gap-3 pt-4">
                        {weeklyPerformance.map((data, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <span className="text-xs font-medium text-gray-900 mb-1">{data.bookings}</span>
                                <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"
                                    style={{ height: `${(data.bookings / maxBookings) * 100}%` }}
                                />
                                <span className="text-xs text-gray-500 mt-2">{data.day}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Occupancy by Room Type */}
                <Card title="Occupancy by Room Type" subtitle="Current month">
                    <div className="space-y-4 pt-4">
                        {occupancyByRoom.map((room, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                    <Bed className="w-5 h-5 text-primary-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">{room.name}</span>
                                        <span className="text-sm font-bold text-gray-900">{room.occupancy}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${room.occupancy > 80 ? 'bg-green-500' :
                                                room.occupancy > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${room.occupancy}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-semibold text-green-600">€{room.revenue.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Quick Insights */}
            <Card title="Quick Insights" subtitle="AI-powered recommendations">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-800">Revenue Up</span>
                        </div>
                        <p className="text-sm text-green-700">
                            Revenue increased by 12.5% this month. Weekend rates are performing well.
                        </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Bed className="w-5 h-5 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Low Occupancy Alert</span>
                        </div>
                        <p className="text-sm text-yellow-700">
                            Executive Suites have 45% occupancy. Consider a flash offer to boost bookings.
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-800">Agency Growth</span>
                        </div>
                        <p className="text-sm text-blue-700">
                            Agency bookings increased by 8% from TUI. Consider extending the contract.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
