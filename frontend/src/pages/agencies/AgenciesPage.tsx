import { useState } from 'react';
import Card from '@/components/common/Card';
import {
    Users,
    DollarSign,
    Plus,
    Search,
    Phone,
    Mail,
    Globe,
    FileText,
    CheckCircle,
    Clock,
    MoreVertical
} from 'lucide-react';
import AgencyModal from './AgencyModal';

export default function AgenciesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Mock agencies data
    const agencies = [
        {
            id: '1',
            name: 'TUI Group',
            code: 'TUI',
            type: 'TOUR_OPERATOR',
            email: 'bookings@tui.com',
            phone: '+49 30 123456',
            website: 'www.tui.com',
            country: 'Germany',
            commission: 12,
            status: 'active',
            total_bookings: 156,
            total_revenue: 45000,
            contracts: 3,
        },
        {
            id: '2',
            name: 'Booking.com',
            code: 'BOK',
            type: 'OTA',
            email: 'partners@booking.com',
            phone: '+31 20 123456',
            website: 'www.booking.com',
            country: 'Netherlands',
            commission: 15,
            status: 'active',
            total_bookings: 289,
            total_revenue: 78000,
            contracts: 1,
        },
        {
            id: '3',
            name: 'FTI Touristik',
            code: 'FTI',
            type: 'TOUR_OPERATOR',
            email: 'hotels@fti.de',
            phone: '+49 89 123456',
            website: 'www.fti.de',
            country: 'Germany',
            commission: 10,
            status: 'active',
            total_bookings: 78,
            total_revenue: 23000,
            contracts: 2,
        },
        {
            id: '4',
            name: 'Expedia',
            code: 'EXP',
            type: 'OTA',
            email: 'partners@expedia.com',
            phone: '+1 425 123456',
            website: 'www.expedia.com',
            country: 'USA',
            commission: 18,
            status: 'pending',
            total_bookings: 0,
            total_revenue: 0,
            contracts: 0,
        },
    ];

    const getTypeBadge = (type: string) => {
        const types: { [key: string]: { label: string; color: string } } = {
            OTA: { label: 'OTA', color: 'bg-blue-100 text-blue-700' },
            TOUR_OPERATOR: { label: 'Tour Operator', color: 'bg-purple-100 text-purple-700' },
            TRAVEL_AGENCY: { label: 'Travel Agency', color: 'bg-green-100 text-green-700' },
            CORPORATE: { label: 'Corporate', color: 'bg-orange-100 text-orange-700' },
            GDS: { label: 'GDS', color: 'bg-gray-100 text-gray-700' },
        };
        const { label, color } = types[type] || types.TRAVEL_AGENCY;
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>{label}</span>;
    };

    const filteredAgencies = agencies.filter(agency =>
        agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalBookings = agencies.reduce((sum, a) => sum + a.total_bookings, 0);
    const totalRevenue = agencies.reduce((sum, a) => sum + a.total_revenue, 0);
    const activeAgencies = agencies.filter(a => a.status === 'active').length;
    const avgCommission = agencies.reduce((sum, a) => sum + a.commission, 0) / agencies.length;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Agencies</h1>
                    </div>
                    <p className="text-gray-600">Manage your partner agencies and contracts</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Agency
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Agencies</p>
                            <p className="text-2xl font-bold text-gray-900">{agencies.length}</p>
                            <p className="text-xs text-green-600 mt-1">{activeAgencies} active</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Bookings</p>
                            <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-600">€{totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-yellow-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Avg Commission</p>
                            <p className="text-2xl font-bold text-gray-900">{avgCommission.toFixed(1)}%</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-purple-600" />
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
                        placeholder="Search agencies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>

            {/* Agencies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgencies.map((agency) => (
                    <div
                        key={agency.id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                                        {agency.code.slice(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{agency.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getTypeBadge(agency.type)}
                                            {agency.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                                    <CheckCircle className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                                                    <Clock className="w-3 h-3" /> Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button className="p-1 hover:bg-gray-100 rounded">
                                    <MoreVertical className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    <span className="truncate">{agency.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <span>{agency.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Globe className="w-4 h-4" />
                                    <span>{agency.website}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-gray-900">{agency.commission}%</p>
                                    <p className="text-xs text-gray-500">Commission</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-gray-900">{agency.total_bookings}</p>
                                    <p className="text-xs text-gray-500">Bookings</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-green-600">€{(agency.total_revenue / 1000).toFixed(0)}k</p>
                                    <p className="text-xs text-gray-500">Revenue</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                                <FileText className="w-4 h-4 inline mr-1" />
                                {agency.contracts} contract{agency.contracts !== 1 ? 's' : ''}
                            </span>
                            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                View Details →
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredAgencies.length === 0 && (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Agencies Found</h3>
                    <p className="text-gray-500">Try adjusting your search or add a new agency.</p>
                </div>
            )}

            {/* Agency Modal */}
            <AgencyModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
            />
        </div>
    );
}
