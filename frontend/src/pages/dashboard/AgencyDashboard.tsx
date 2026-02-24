import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { useAuth } from '@/hooks/useAuth';
import { fetchReservations } from '@/store/slices/reservationsSlice';
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    DollarSign,
    CalendarDays,
    Building2,
    Clock,
    Zap,
    Briefcase,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

// Mock Data for Charts if actual data is sparse
const MOCK_CHART_DATA = [
    { name: 'Jan', revenue: 4000, commission: 400 },
    { name: 'Feb', revenue: 3000, commission: 300 },
    { name: 'Mar', revenue: 5000, commission: 500 },
    { name: 'Apr', revenue: 4500, commission: 450 },
    { name: 'May', revenue: 6000, commission: 600 },
    { name: 'Jun', revenue: 5500, commission: 550 },
    { name: 'Jul', revenue: 7000, commission: 700 },
];

export default function AgencyDashboard() {
    const dispatch = useAppDispatch();
    const { user, organization } = useAuth();
    const { reservations } = useAppSelector((state) => state.reservations);

    useEffect(() => {
        dispatch(fetchReservations({}));
    }, [dispatch]);

    // Derived State from Reservations
    const safeReservations = Array.isArray(reservations) ? reservations : [];

    const kpiMetrics = useMemo(() => {
        let totalRevenue = 0;
        let totalCommission = 0;
        let activeBookings = 0;
        let pendingOptions = 0;

        safeReservations.forEach(res => {
            // Count total revenue for confirmed/completed
            if (['confirmed', 'checked_in', 'checked_out'].includes(res.status)) {
                totalRevenue += res.total_with_tax || 0;
                // Assuming an average 10% commission if formula isn't explicitly defined yet
                totalCommission += (res.total_with_tax || 0) * 0.10;
                activeBookings += 1;
            }
            if (['pending', 'option'].includes(res.status)) {
                pendingOptions += 1;
            }
        });

        return {
            totalRevenue,
            totalCommission,
            activeBookings,
            pendingOptions
        };
    }, [safeReservations]);


    const stats = [
        {
            name: 'Total Revenue (MTD)',
            value: `€${kpiMetrics.totalRevenue.toLocaleString()}`,
            trend: '+12.5%',
            isPositive: true,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100',
        },
        {
            name: 'Expected Commission',
            value: `€${kpiMetrics.totalCommission.toLocaleString()}`,
            trend: '+8.2%',
            isPositive: true,
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
        },
        {
            name: 'Active Bookings',
            value: kpiMetrics.activeBookings,
            trend: '+5%',
            isPositive: true,
            icon: CalendarDays,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100',
        },
        {
            name: 'Pending Options',
            value: kpiMetrics.pendingOptions,
            trend: '-2',
            isPositive: false,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-100',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8 font-sans space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Agency Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back, {user?.first_name}. Here is your B2B performance overview.</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <Link to="/agency/hotel-search">
                        <Button variant="primary" className="shadow-lg shadow-blue-500/30">
                            Book New Hotel
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards top row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <Card key={idx} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className={`flex items-center text-sm font-medium ${stat.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {stat.trend}
                                {stat.isPositive ? <ArrowUpRight className="w-4 h-4 ml-1" /> : <ArrowDownRight className="w-4 h-4 ml-1" />}
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-gray-500 text-sm font-medium">{stat.name}</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Analytics & Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Main Revenue Chart (Occupies 2 columns on large screens) */}
                <Card className="xl:col-span-2 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Revenue & Commission Trends</h3>
                            <p className="text-sm text-gray-500">Monthly performance overview</p>
                        </div>
                        <select className="text-sm border-gray-200 rounded-lg text-gray-600 focus:ring-blue-500">
                            <option>Last 6 Months</option>
                            <option>This Year</option>
                        </select>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} tickFormatter={(value) => `€${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`€${value}`, undefined]}
                                />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area type="monotone" dataKey="commission" name="Commission" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCommission)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Vertical Operational Widgets inside the 3rd column */}
                <div className="space-y-6">
                    {/* B2B Wallet/Profile Component inside Dashboard */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-semibold text-slate-300">B2B Account Status</h3>
                                <Activity className="w-5 h-5 text-emerald-400" />
                            </div>

                            <h2 className="text-2xl font-bold tracking-tight mb-1">{organization?.name || 'Agency Name'}</h2>
                            <p className="text-slate-400 text-sm mb-6">ID: {organization?._id?.substring(0, 8) || 'AGT-12004X'}</p>

                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-300">Credit Limit</span>
                                    <span className="font-medium">€50,000</span>
                                </div>
                                <div className="w-full bg-slate-700/50 rounded-full h-2 mb-2">
                                    <div className="bg-blue-400 h-2 rounded-full" style={{ width: '35%' }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Available: €32,500</span>
                                    <span>Used: €17,500</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Actions */}
                    <Card className="border border-gray-100 shadow-sm p-0">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            <Link to="/agency/flash-offers" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center group-hover:bg-rose-600 transition-colors">
                                        <Zap className="w-5 h-5 text-rose-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">Flash Offers</p>
                                        <p className="text-xs text-gray-500">2 new hotel discounts</p>
                                    </div>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
                            </Link>

                            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <Briefcase className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">Contract Requests</p>
                                        <p className="text-xs text-gray-500">1 pending partnership</p>
                                    </div>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
                            </button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Bottom Row - Recent Bookings List */}
            <div className="grid grid-cols-1 gap-6">
                <Card className="border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Recent Agency Bookings</h3>
                            <p className="text-sm text-gray-500">Latest reservations made by your team</p>
                        </div>
                        <Link to="/reservations" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Guest Name</th>
                                    <th className="pb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                                    <th className="pb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                                    <th className="pb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                                    <th className="pb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {safeReservations.slice(0, 5).map((res, i) => (
                                    <tr key={res._id || i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                                                    {res.guest.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{res.guest.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm font-mono text-gray-500">{res.booking_reference || `REF-${Math.floor(Math.random() * 10000)}`}</td>
                                        <td className="py-4 text-sm text-gray-600">
                                            {new Date(res.check_in_date).toLocaleDateString()} - {new Date(res.check_out_date).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 font-semibold text-gray-900">
                                            €{res.total_with_tax || 0}
                                        </td>
                                        <td className="py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                                    res.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                                        'bg-amber-100 text-amber-800'}`}>
                                                {res.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {safeReservations.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500">
                                            No reservations found. Start booking!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

        </div>
    );
}
