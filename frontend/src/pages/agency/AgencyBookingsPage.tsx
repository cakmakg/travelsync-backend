import { useEffect, useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import {
    CalendarDays,
    Search,
    Filter,
    Eye,
    Download,
    Building2,
    User,
    Clock
} from 'lucide-react';

interface Booking {
    _id: string;
    confirmation_code: string;
    guest: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    hotel_name: string;
    room_type: string;
    check_in: string;
    check_out: string;
    nights: number;
    guests: { adults: number; children: number };
    total_price: number;
    commission: number;
    status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
    created_at: string;
}

export default function AgencyBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            // Mock data - will be replaced with API call
            const mockBookings: Booking[] = [
                {
                    _id: '1',
                    confirmation_code: 'BK-20260118-A1B',
                    guest: {
                        first_name: 'John',
                        last_name: 'Smith',
                        email: 'john.smith@email.com',
                        phone: '+49 123 456 7890',
                    },
                    hotel_name: 'Grand Istanbul Hotel',
                    room_type: 'Deluxe Double',
                    check_in: '2026-01-25',
                    check_out: '2026-01-28',
                    nights: 3,
                    guests: { adults: 2, children: 0 },
                    total_price: 450,
                    commission: 45,
                    status: 'confirmed',
                    created_at: '2026-01-18T10:30:00Z',
                },
                {
                    _id: '2',
                    confirmation_code: 'BK-20260117-C2D',
                    guest: {
                        first_name: 'Maria',
                        last_name: 'Garcia',
                        email: 'maria.g@email.com',
                        phone: '+49 987 654 3210',
                    },
                    hotel_name: 'City Center Hotel',
                    room_type: 'Junior Suite',
                    check_in: '2026-02-01',
                    check_out: '2026-02-05',
                    nights: 4,
                    guests: { adults: 2, children: 1 },
                    total_price: 680,
                    commission: 68,
                    status: 'pending',
                    created_at: '2026-01-17T14:20:00Z',
                },
                {
                    _id: '3',
                    confirmation_code: 'BK-20260115-E3F',
                    guest: {
                        first_name: 'Ahmed',
                        last_name: 'Hassan',
                        email: 'ahmed.h@email.com',
                        phone: '+49 555 123 4567',
                    },
                    hotel_name: 'Beach Resort Antalya',
                    room_type: 'Standard Room',
                    check_in: '2026-01-10',
                    check_out: '2026-01-15',
                    nights: 5,
                    guests: { adults: 2, children: 2 },
                    total_price: 750,
                    commission: 75,
                    status: 'checked_out',
                    created_at: '2026-01-05T09:15:00Z',
                },
            ];
            setBookings(mockBookings);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-green-100 text-green-800',
            checked_in: 'bg-blue-100 text-blue-800',
            checked_out: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800',
            no_show: 'bg-purple-100 text-purple-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
            </span>
        );
    };

    // Filter bookings
    const filteredBookings = bookings.filter((booking) => {
        const matchesSearch =
            booking.confirmation_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.guest.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.guest.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.hotel_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Stats
    const stats = {
        total: bookings.length,
        pending: bookings.filter((b) => b.status === 'pending').length,
        confirmed: bookings.filter((b) => b.status === 'confirmed').length,
        totalCommission: bookings.reduce((sum, b) => sum + b.commission, 0),
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                    <p className="text-gray-600 mt-2">Manage bookings made through your agency</p>
                </div>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CalendarDays className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Bookings</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-2xl font-bold">{stats.pending}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CalendarDays className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Confirmed</p>
                            <p className="text-2xl font-bold">{stats.confirmed}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Commission</p>
                            <p className="text-2xl font-bold">{formatCurrency(stats.totalCommission)}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by confirmation code, guest name, or hotel..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="checked_in">Checked In</option>
                            <option value="checked_out">Checked Out</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Bookings Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Booking</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Guest</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Hotel</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Dates</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Amount</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        No bookings found
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{booking.confirmation_code}</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(booking.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {booking.guest.first_name} {booking.guest.last_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{booking.guest.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{booking.hotel_name}</div>
                                            <div className="text-xs text-gray-500">{booking.room_type}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                                            </div>
                                            <div className="text-xs text-gray-500">{booking.nights} nights</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{formatCurrency(booking.total_price)}</div>
                                            <div className="text-xs text-green-600">
                                                +{formatCurrency(booking.commission)} commission
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                                        <td className="px-4 py-3">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setSelectedBooking(booking)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Booking Detail Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedBooking(null)} />
                        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Booking Details</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b">
                                    <span className="text-gray-500">Confirmation</span>
                                    <span className="font-mono font-bold">{selectedBooking.confirmation_code}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Guest</p>
                                        <p className="font-medium">
                                            {selectedBooking.guest.first_name} {selectedBooking.guest.last_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        {getStatusBadge(selectedBooking.status)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Hotel</p>
                                        <p className="font-medium">{selectedBooking.hotel_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Room Type</p>
                                        <p className="font-medium">{selectedBooking.room_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Check-in</p>
                                        <p className="font-medium">{formatDate(selectedBooking.check_in)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Check-out</p>
                                        <p className="font-medium">{formatDate(selectedBooking.check_out)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Total Price</p>
                                        <p className="font-medium">{formatCurrency(selectedBooking.total_price)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Your Commission</p>
                                        <p className="font-medium text-green-600">
                                            {formatCurrency(selectedBooking.commission)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
