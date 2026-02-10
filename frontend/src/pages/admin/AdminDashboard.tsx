import { useEffect, useState } from 'react';
import Card from '@/components/common/Card';
import {
    Shield,
    Building2,
    Users,
    Hotel,
    Briefcase,
    TrendingUp,
    Activity,
    AlertCircle,
    CheckCircle,
    Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';

interface SystemStats {
    total_organizations: number;
    total_hotels: number;
    total_agencies: number;
    total_users: number;
    active_users: number;
    total_reservations: number;
    pending_verifications: number;
}

interface RecentActivity {
    id: string;
    action: string;
    entity: string;
    user: string;
    time: string;
}

export default function AdminDashboard() {
    const [, setLoading] = useState(true);
    const [stats, setStats] = useState<SystemStats>({
        total_organizations: 0,
        total_hotels: 0,
        total_agencies: 0,
        total_users: 0,
        active_users: 0,
        total_reservations: 0,
        pending_verifications: 0,
    });

    const [recentActivity] = useState<RecentActivity[]>([
        { id: '1', action: 'New Registration', entity: 'Grand Hotel Berlin', user: 'System', time: '5 min ago' },
        { id: '2', action: 'User Updated', entity: 'john@agency.com', user: 'Admin', time: '15 min ago' },
        { id: '3', action: 'Org Verified', entity: 'TUI Travel', user: 'Admin', time: '1 hour ago' },
        { id: '4', action: 'New Reservation', entity: 'BK-20260117-ABC', user: 'staff@hotel.com', time: '2 hours ago' },
    ]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await adminService.getStats();
                if (response.success && response.data) {
                    setStats({
                        total_organizations: response.data.organizations?.total || 0,
                        total_hotels: response.data.organizations?.hotels || 0,
                        total_agencies: response.data.organizations?.agencies || 0,
                        total_users: response.data.users?.total || 0,
                        active_users: response.data.users?.active || 0,
                        total_reservations: 0,
                        pending_verifications: 0,
                    });
                }
            } catch (error) {
                toast.error('Failed to fetch admin statistics');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        {
            name: 'Total Organizations',
            value: stats.total_organizations,
            icon: Building2,
            color: 'bg-blue-500',
            link: '/admin/organizations',
        },
        {
            name: 'Hotels',
            value: stats.total_hotels,
            icon: Hotel,
            color: 'bg-green-500',
            link: '/admin/organizations?type=HOTEL',
        },
        {
            name: 'Agencies',
            value: stats.total_agencies,
            icon: Briefcase,
            color: 'bg-purple-500',
            link: '/admin/organizations?type=AGENCY',
        },
        {
            name: 'Total Users',
            value: stats.total_users,
            icon: Users,
            color: 'bg-orange-500',
            link: '/admin/users',
        },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-8 h-8 text-red-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                </div>
                <p className="text-gray-600">System administration and monitoring</p>
            </div>

            {/* Alert Banner */}
            {stats.pending_verifications > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-800">
                        {stats.pending_verifications} organization(s) pending verification
                    </span>
                    <Link to="/admin/organizations?status=pending" className="ml-auto text-yellow-700 font-medium hover:underline">
                        Review →
                    </Link>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => (
                    <Link key={stat.name} to={stat.link}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-xl ${stat.color} flex items-center justify-center`}>
                                    <stat.icon className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* System Health */}
                <Card title="System Health" subtitle="Current status">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-gray-900">API Server</span>
                            </div>
                            <span className="text-green-600 font-medium">Operational</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-gray-900">Database</span>
                            </div>
                            <span className="text-green-600 font-medium">Connected</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-gray-900">Active Sessions</span>
                            </div>
                            <span className="text-gray-900 font-medium">{stats.active_users}</span>
                        </div>
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card title="Recent Activity" subtitle="Latest system events">
                    <div className="space-y-3">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div>
                                    <p className="font-medium text-gray-900">{activity.action}</p>
                                    <p className="text-sm text-gray-500">{activity.entity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">{activity.user}</p>
                                    <p className="text-xs text-gray-400">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total_reservations}</p>
                            <p className="text-sm text-gray-600">Total Reservations</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.active_users}</p>
                            <p className="text-sm text-gray-600">Active Users</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <Link to="/admin/settings" className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Settings className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900">System Settings</p>
                            <p className="text-sm text-gray-600">Configure system</p>
                        </div>
                    </Link>
                </Card>
            </div>
        </div>
    );
}
