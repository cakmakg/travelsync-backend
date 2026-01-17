import { useState } from 'react';
import Card from '@/components/common/Card';
import {
    Building2,
    Search,
    Hotel,
    Briefcase,
    CheckCircle,
    XCircle,
    Clock,
    MoreVertical,
    Eye,
    Ban,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Organization {
    id: string;
    name: string;
    type: 'HOTEL' | 'AGENCY';
    email: string;
    status: 'active' | 'pending' | 'suspended';
    users_count: number;
    created_at: string;
    subscription: string;
}

export default function OrganizationsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'HOTEL' | 'AGENCY'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

    // Mock organizations data
    const [organizations] = useState<Organization[]>([
        {
            id: '1',
            name: 'Grand Hotel Berlin',
            type: 'HOTEL',
            email: 'admin@grandhotel.com',
            status: 'active',
            users_count: 8,
            created_at: '2025-10-15',
            subscription: 'Pro',
        },
        {
            id: '2',
            name: 'TUI Travel Agency',
            type: 'AGENCY',
            email: 'admin@tui.com',
            status: 'active',
            users_count: 5,
            created_at: '2025-11-01',
            subscription: 'Enterprise',
        },
        {
            id: '3',
            name: 'Maritim Hotel Munich',
            type: 'HOTEL',
            email: 'contact@maritim.de',
            status: 'pending',
            users_count: 3,
            created_at: '2026-01-10',
            subscription: 'Basic',
        },
        {
            id: '4',
            name: 'FTI Touristik',
            type: 'AGENCY',
            email: 'info@fti.de',
            status: 'active',
            users_count: 12,
            created_at: '2025-09-20',
            subscription: 'Pro',
        },
        {
            id: '5',
            name: 'Test Hotel (Suspended)',
            type: 'HOTEL',
            email: 'test@hotel.com',
            status: 'suspended',
            users_count: 1,
            created_at: '2025-12-01',
            subscription: 'Free',
        },
    ]);

    const filteredOrgs = organizations.filter(org => {
        const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || org.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Active</span>;
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" /> Pending</span>;
            case 'suspended':
                return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Suspended</span>;
            default:
                return null;
        }
    };

    const getTypeBadge = (type: string) => {
        if (type === 'HOTEL') {
            return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700"><Hotel className="w-3 h-3" /> Hotel</span>;
        }
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700"><Briefcase className="w-3 h-3" /> Agency</span>;
    };

    const handleAction = (action: string, orgName: string) => {
        toast.info(`${action}: ${orgName} - Coming soon!`);
    };

    const stats = {
        total: organizations.length,
        hotels: organizations.filter(o => o.type === 'HOTEL').length,
        agencies: organizations.filter(o => o.type === 'AGENCY').length,
        pending: organizations.filter(o => o.status === 'pending').length,
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
                    </div>
                    <p className="text-gray-600">Manage all registered organizations</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-sm text-gray-600">Total</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{stats.hotels}</p>
                        <p className="text-sm text-gray-600">Hotels</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600">{stats.agencies}</p>
                        <p className="text-sm text-gray-600">Agencies</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                        <p className="text-sm text-gray-600">Pending</p>
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
                            placeholder="Search organizations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Types</option>
                        <option value="HOTEL">Hotels</option>
                        <option value="AGENCY">Agencies</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </Card>

            {/* Organizations Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrgs.map((org) => (
                                <tr key={org.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{org.name}</p>
                                            <p className="text-sm text-gray-500">{org.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getTypeBadge(org.type)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(org.status)}</td>
                                    <td className="px-6 py-4 text-gray-900">{org.users_count}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                                            {org.subscription}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{org.created_at}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleAction('View', org.name)}
                                                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {org.status === 'active' ? (
                                                <button
                                                    onClick={() => handleAction('Suspend', org.name)}
                                                    className="p-1 hover:bg-red-100 rounded text-red-600"
                                                    title="Suspend"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAction('Activate', org.name)}
                                                    className="p-1 hover:bg-green-100 rounded text-green-600"
                                                    title="Activate"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
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

                {filteredOrgs.length === 0 && (
                    <div className="text-center py-12">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No organizations found</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
