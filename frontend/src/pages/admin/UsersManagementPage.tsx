import { useState } from 'react';
import Card from '@/components/common/Card';
import {
    Users,
    Search,
    Shield,
    CheckCircle,
    XCircle,
    MoreVertical,
    Eye,
    Ban,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemUser {
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'admin';
    organization: string | null;
    org_type: 'HOTEL' | 'AGENCY' | null;
    status: 'active' | 'inactive';
    last_login: string;
}

export default function UsersManagementPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    // Mock users data
    const [users] = useState<SystemUser[]>([
        {
            id: '1',
            name: 'System Administrator',
            email: 'superadmin@travelsync.com',
            role: 'super_admin',
            organization: null,
            org_type: null,
            status: 'active',
            last_login: '2026-01-17 18:30',
        },
        {
            id: '2',
            name: 'Hans Müller',
            email: 'hans@grandhotel.com',
            role: 'admin',
            organization: 'Grand Hotel Berlin',
            org_type: 'HOTEL',
            status: 'active',
            last_login: '2026-01-17 15:20',
        },
        {
            id: '3',
            name: 'Maria Schmidt',
            email: 'maria@tui.com',
            role: 'admin',
            organization: 'TUI Travel Agency',
            org_type: 'AGENCY',
            status: 'active',
            last_login: '2026-01-16 10:45',
        },
    ]);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role: string) => {
        const badges: { [key: string]: { color: string; icon: any } } = {
            super_admin: { color: 'bg-red-100 text-red-700', icon: Shield },
            admin: { color: 'bg-blue-100 text-blue-700', icon: Shield },
        };
        const { color, icon: Icon } = badges[role] || badges.admin;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${color}`}>
                <Icon className="w-3 h-3" />
                {role.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    const handleAction = (action: string, userName: string) => {
        toast.info(`${action}: ${userName} - Coming soon!`);
    };

    const stats = {
        total: users.length,
        super_admins: users.filter(u => u.role === 'super_admin').length,
        admins: users.filter(u => u.role === 'admin').length,
        active: users.filter(u => u.status === 'active').length,
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-8 h-8 text-orange-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
                    </div>
                    <p className="text-gray-600">Manage all system users across organizations</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-sm text-gray-600">Total Users</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-red-600">{stats.super_admins}</p>
                        <p className="text-sm text-gray-600">Super Admins</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{stats.admins}</p>
                        <p className="text-sm text-gray-600">Org Admins</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                        <p className="text-sm text-gray-600">Active</p>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </Card>

            {/* Users Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                <span className="text-primary-700 font-semibold">
                                                    {user.name.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                    <td className="px-6 py-4">
                                        {user.organization ? (
                                            <div>
                                                <p className="text-gray-900">{user.organization}</p>
                                                <p className="text-xs text-gray-500">{user.org_type}</p>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">System</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                <CheckCircle className="w-4 h-4" /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-gray-500">
                                                <XCircle className="w-4 h-4" /> Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{user.last_login}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleAction('View', user.name)}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {user.role !== 'super_admin' && (
                                                user.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleAction('Deactivate', user.name)}
                                                        className="p-1 hover:bg-red-100 rounded text-red-600"
                                                        title="Deactivate"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAction('Activate', user.name)}
                                                        className="p-1 hover:bg-green-100 rounded text-green-600"
                                                        title="Activate"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                )
                                            )}
                                            <button className="p-1 hover:bg-gray-100 rounded text-gray-600">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No users found</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
