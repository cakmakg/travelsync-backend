import { useEffect, useState } from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BedDouble,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { analyticsApi, reservationsApi } from '../../api';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import type { Reservation, DashboardMetrics } from '../../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}

function StatCard({ title, value, change, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className="mt-1 flex items-center gap-1">
                {trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {change}%
                </span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-primary-50 p-3 text-primary-600">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState<Reservation[]>([]);
  const [todayCheckOuts, setTodayCheckOuts] = useState<Reservation[]>([]);

  // Mock data for chart
  const revenueData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 6390 },
    { name: 'Sun', revenue: 3490 },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, reservationsRes, checkInsRes, checkOutsRes] = await Promise.all([
          analyticsApi.getDashboard(),
          reservationsApi.getAll(),
          reservationsApi.getTodayCheckIns(),
          reservationsApi.getTodayCheckOuts(),
        ]);

        if (dashboardRes.success && dashboardRes.data) {
          setMetrics(dashboardRes.data);
        }
        if (reservationsRes.success && reservationsRes.data) {
          setRecentReservations(reservationsRes.data.slice(0, 5));
        }
        if (checkInsRes.success && checkInsRes.data) {
          setTodayCheckIns(checkInsRes.data);
        }
        if (checkOutsRes.success && checkOutsRes.data) {
          setTodayCheckOuts(checkOutsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Reservations"
          value={metrics?.totalReservations || 0}
          change={12}
          trend="up"
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          title="Today's Check-ins"
          value={metrics?.todayCheckIns || todayCheckIns.length}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Today's Check-outs"
          value={metrics?.todayCheckOuts || todayCheckOuts.length}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Revenue (This Month)"
          value={formatCurrency(metrics?.revenue?.thisMonth || 0)}
          change={8}
          trend="up"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Charts and Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue Overview</CardTitle>
              <Badge variant="success">
                <TrendingUp className="mr-1 h-3 w-3" />
                +12.5%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    fill="#dbeafe"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Today's Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Check-ins */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded bg-green-100 p-1">
                    <ArrowDownRight className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-900">Check-ins ({todayCheckIns.length})</span>
                </div>
                {todayCheckIns.length > 0 ? (
                  <div className="space-y-2">
                    {todayCheckIns.slice(0, 3).map((res) => (
                      <div
                        key={res._id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{res.guest.name}</p>
                          <p className="text-sm text-gray-500">{res.booking_reference}</p>
                        </div>
                        <Badge variant={res.status === 'confirmed' ? 'info' : 'success'}>
                          {getStatusLabel(res.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No check-ins scheduled for today</p>
                )}
              </div>

              {/* Check-outs */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded bg-orange-100 p-1">
                    <ArrowUpRight className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="font-medium text-gray-900">Check-outs ({todayCheckOuts.length})</span>
                </div>
                {todayCheckOuts.length > 0 ? (
                  <div className="space-y-2">
                    {todayCheckOuts.slice(0, 3).map((res) => (
                      <div
                        key={res._id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{res.guest.name}</p>
                          <p className="text-sm text-gray-500">{res.booking_reference}</p>
                        </div>
                        <Badge variant={res.status === 'checked_in' ? 'warning' : 'default'}>
                          {getStatusLabel(res.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No check-outs scheduled for today</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reservations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Reservations</CardTitle>
            <a href="/reservations" className="text-sm font-medium text-primary-600 hover:underline">
              View all
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Guest</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Reference</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Check-in</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Nights</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Total</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentReservations.map((reservation) => (
                  <tr key={reservation._id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                          {reservation.guest.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{reservation.guest.name}</p>
                          <p className="text-sm text-gray-500">{reservation.guest.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600">{reservation.booking_reference}</td>
                    <td className="py-3 text-sm text-gray-600">
                      {formatDate(reservation.check_in_date)}
                    </td>
                    <td className="py-3 text-sm text-gray-600">{reservation.nights}</td>
                    <td className="py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(reservation.total_with_tax, reservation.currency)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                          reservation.status
                        )}`}
                      >
                        {getStatusLabel(reservation.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentReservations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      <BedDouble className="mx-auto h-8 w-8 text-gray-300" />
                      <p className="mt-2">No reservations yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
