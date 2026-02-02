import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/common/Card';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Bed,
    Users,
    ArrowUp,
    ArrowDown,
    RefreshCw
} from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';

interface TimeRangeData {
    revenue: number;
    revenueChange: number;
    occupancy: number;
    occupancyChange: number;
    adr: number;
    adrChange: number;
    revpar: number;
    revparChange: number;
    reservations: number;
}

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState('month');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<TimeRangeData>({
        revenue: 0,
        revenueChange: 0,
        occupancy: 0,
        occupancyChange: 0,
        adr: 0,
        adrChange: 0,
        revpar: 0,
        revparChange: 0,
        reservations: 0,
    });

    // Calculate date range based on selected timeRange
    const getDateRange = useCallback((range: string) => {
        const endDate = new Date();
        let startDate = new Date();

        switch (range) {
            case 'week':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(endDate.getMonth() - 1);
        }

        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
        };
    }, []);

    // Fetch analytics data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { start, end } = getDateRange(timeRange);

            // Fetch revenue data
            const revenueResponse = await analyticsService.getRevenue(start, end);
            const revenueData = revenueResponse.data;

            // Calculate previous period for comparison
            const { start: prevStart, end: prevEnd } = getDateRange(timeRange);
            const prevStartDate = new Date(prevStart);
            const diff = new Date(end).getTime() - new Date(start).getTime();
            prevStartDate.setTime(prevStartDate.getTime() - diff);

            // Get previous period revenue for comparison
            let prevRevenue = 0;
            try {
                const prevRevenueResponse = await analyticsService.getRevenue(
                    prevStartDate.toISOString().split('T')[0],
                    prevStart
                );
                prevRevenue = prevRevenueResponse.data?.revenue || 0;
            } catch {
                // Previous period data not available
            }

            const revenue = revenueData?.revenue || 0;
            const revenueChange = prevRevenue > 0
                ? ((revenue - prevRevenue) / prevRevenue) * 100
                : 0;

            // Mock some calculated values (would normally come from API)
            const reservations = revenueData?.reservations || 0;
            const avgNights = 2.5;
            const adr = reservations > 0 ? revenue / (reservations * avgNights) : 0;
            const occupancy = Math.min(95, Math.random() * 30 + 60); // 60-90%
            const revpar = adr * (occupancy / 100);

            setData({
                revenue,
                revenueChange: parseFloat(revenueChange.toFixed(1)),
                occupancy: parseFloat(occupancy.toFixed(1)),
                occupancyChange: parseFloat((Math.random() * 10 - 5).toFixed(1)),
                adr: Math.round(adr),
                adrChange: parseFloat((Math.random() * 10 - 5).toFixed(1)),
                revpar: Math.round(revpar),
                revparChange: parseFloat((Math.random() * 10 - 2).toFixed(1)),
                reservations,
            });
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [timeRange, getDateRange]);

    // Fetch data when timeRange changes
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Mock chart data (in real app, would be from API)
    const revenueData = [
        { month: 'Jan', value: Math.round(data.revenue * 0.68) },
        { month: 'Feb', value: Math.round(data.revenue * 0.74) },
        { month: 'Mar', value: Math.round(data.revenue * 0.62) },
        { month: 'Apr', value: Math.round(data.revenue * 0.76) },
        { month: 'May', value: Math.round(data.revenue * 0.88) },
        { month: 'Jun', value: data.revenue },
    ];

    const maxRevenue = Math.max(...revenueData.map(d => d.value), 1);

    // Mock occupancy by room type
    const occupancyByRoom = [
        { name: 'Standard Room', occupancy: 85, revenue: Math.round(data.revenue * 0.26) },
        { name: 'Deluxe Room', occupancy: 72, revenue: Math.round(data.revenue * 0.36) },
        { name: 'Junior Suite', occupancy: 68, revenue: Math.round(data.revenue * 0.22) },
        { name: 'Executive Suite', occupancy: 45, revenue: Math.round(data.revenue * 0.16) },
    ];

    // Mock booking sources
    const bookingSources = [
        { name: 'Direct', value: 35, color: 'bg-blue-500' },
        { name: 'Booking.com', value: 28, color: 'bg-purple-500' },
        { name: 'Agencies', value: 22, color: 'bg-green-500' },
        { name: 'Other OTAs', value: 15, color: 'bg-orange-500' },
    ];

    // Weekly performance
    const weeklyPerformance = [
        { day: 'Mon', bookings: 12, revenue: Math.round(data.revenue * 0.08) },
        { day: 'Tue', bookings: 8, revenue: Math.round(data.revenue * 0.06) },
        { day: 'Wed', bookings: 15, revenue: Math.round(data.revenue * 0.11) },
        { day: 'Thu', bookings: 18, revenue: Math.round(data.revenue * 0.13) },
        { day: 'Fri', bookings: 25, revenue: Math.round(data.revenue * 0.19) },
        { day: 'Sat', bookings: 32, revenue: Math.round(data.revenue * 0.25) },
        { day: 'Sun', bookings: 22, revenue: Math.round(data.revenue * 0.18) },
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
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        title="Refresh data"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
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

            {/* Loading indicator */}
            {loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                        <p className="text-blue-700">Loading {timeRange} data...</p>
                    </div>
                </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">€{data.revenue.toLocaleString()}</p>
                            <div className={`flex items-center gap-1 mt-1 text-sm ${data.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {data.revenueChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                {Math.abs(data.revenueChange)}% vs last {timeRange}
                            </div>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Occupancy Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{data.occupancy}%</p>
                            <div className={`flex items-center gap-1 mt-1 text-sm ${data.occupancyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {data.occupancyChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                {Math.abs(data.occupancyChange)}% vs last {timeRange}
                            </div>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Bed className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">ADR</p>
                            <p className="text-2xl font-bold text-gray-900">€{data.adr}</p>
                            <div className={`flex items-center gap-1 mt-1 text-sm ${data.adrChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {data.adrChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                {Math.abs(data.adrChange)}% vs last {timeRange}
                            </div>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">RevPAR</p>
                            <p className="text-2xl font-bold text-gray-900">€{data.revpar}</p>
                            <div className={`flex items-center gap-1 mt-1 text-sm ${data.revparChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {data.revparChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                {Math.abs(data.revparChange)}% vs last {timeRange}
                            </div>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <Card title={`Revenue Trend (${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)})`}>
                    <div className="h-64 flex items-end gap-2">
                        {revenueData.map((item, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t transition-all duration-300"
                                    style={{ height: `${(item.value / maxRevenue) * 200}px` }}
                                />
                                <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                                <span className="text-xs font-medium text-gray-700">€{(item.value / 1000).toFixed(0)}k</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Booking Sources */}
                <Card title="Booking Sources">
                    <div className="space-y-4">
                        {bookingSources.map((source, idx) => (
                            <div key={idx}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">{source.name}</span>
                                    <span className="text-sm text-gray-500">{source.value}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${source.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${source.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Room Type Performance */}
                <Card title="Performance by Room Type">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-200">
                                    <th className="pb-3 text-sm font-medium text-gray-500">Room Type</th>
                                    <th className="pb-3 text-sm font-medium text-gray-500">Occupancy</th>
                                    <th className="pb-3 text-sm font-medium text-gray-500">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {occupancyByRoom.map((room, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                                        <td className="py-3 text-sm text-gray-900">{room.name}</td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${room.occupancy}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600">{room.occupancy}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-sm font-medium text-gray-900">€{room.revenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Weekly Performance */}
                <Card title="This Week's Performance">
                    <div className="h-48 flex items-end gap-2">
                        {weeklyPerformance.map((item, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t transition-all duration-300"
                                    style={{ height: `${(item.bookings / maxBookings) * 140}px` }}
                                />
                                <span className="text-xs text-gray-500 mt-2">{item.day}</span>
                                <span className="text-xs font-medium text-gray-700">{item.bookings}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
