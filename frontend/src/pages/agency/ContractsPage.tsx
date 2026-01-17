import { useState } from 'react';
import Card from '@/components/common/Card';
import {
    FileText,
    Building2,
    Calendar,
    DollarSign,
    Plus,
    Search,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';

export default function ContractsPage() {
    const [searchTerm, setSearchTerm] = useState('');

    // Mock contracts data - would come from API
    const contracts = [
        {
            id: '1',
            hotel_name: 'Grand Hotel Berlin',
            hotel_city: 'Berlin, Germany',
            commission: 12,
            status: 'ACTIVE',
            valid_from: '2024-01-01',
            valid_to: '2024-12-31',
            rooms_allotment: 10,
            release_days: 7,
            total_bookings: 45,
            total_revenue: 12500,
        },
        {
            id: '2',
            hotel_name: 'Maritim Hotel Munich',
            hotel_city: 'Munich, Germany',
            commission: 15,
            status: 'ACTIVE',
            valid_from: '2024-01-01',
            valid_to: '2024-06-30',
            rooms_allotment: 5,
            release_days: 14,
            total_bookings: 28,
            total_revenue: 8400,
        },
        {
            id: '3',
            hotel_name: 'NH Hotel Hamburg',
            hotel_city: 'Hamburg, Germany',
            commission: 10,
            status: 'DRAFT',
            valid_from: '2024-03-01',
            valid_to: '2024-12-31',
            rooms_allotment: 8,
            release_days: 7,
            total_bookings: 0,
            total_revenue: 0,
        },
        {
            id: '4',
            hotel_name: 'Steigenberger Frankfurt',
            hotel_city: 'Frankfurt, Germany',
            commission: 12,
            status: 'EXPIRED',
            valid_from: '2023-01-01',
            valid_to: '2023-12-31',
            rooms_allotment: 6,
            release_days: 7,
            total_bookings: 120,
            total_revenue: 35000,
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Active
                    </span>
                );
            case 'DRAFT':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        Draft
                    </span>
                );
            case 'EXPIRED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        <XCircle className="w-3 h-3" />
                        Expired
                    </span>
                );
            default:
                return null;
        }
    };

    const filteredContracts = contracts.filter(contract =>
        contract.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.hotel_city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
    const totalCommission = contracts.reduce((sum, c) => sum + (c.total_revenue * c.commission / 100), 0);

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-8 h-8 text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
                    </div>
                    <p className="text-gray-600">Manage your hotel agreements and commissions</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Plus className="w-5 h-5" />
                    New Contract
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Contracts</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{activeContracts}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Bookings</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {contracts.reduce((sum, c) => sum + c.total_bookings, 0)}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Commission</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                €{totalCommission.toLocaleString()}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search contracts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
            </div>

            {/* Contracts Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hotel</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract Period</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allotment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredContracts.map((contract) => (
                            <tr key={contract.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{contract.hotel_name}</p>
                                            <p className="text-sm text-gray-500">{contract.hotel_city}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-900">
                                        {new Date(contract.valid_from).toLocaleDateString()} - {new Date(contract.valid_to).toLocaleDateString()}
                                    </p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-lg font-semibold text-green-600">{contract.commission}%</span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-900">{contract.rooms_allotment} rooms/day</p>
                                    <p className="text-xs text-gray-500">{contract.release_days} days release</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-gray-900">{contract.total_bookings}</p>
                                    <p className="text-xs text-gray-500">€{contract.total_revenue.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(contract.status)}
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
