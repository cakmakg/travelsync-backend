import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { useAuth } from '@/hooks/useAuth';
import { fetchReservations } from '@/store/slices/reservationsSlice';
import Card from '@/components/common/Card';
import {
    Zap,
    FileText,
    CalendarDays,
    DollarSign,
    Building2,
    ArrowRight,
    Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AgencyDashboard() {
    const dispatch = useAppDispatch();
    const { organization } = useAuth();
    const { reservations } = useAppSelector((state) => state.reservations);

    useEffect(() => {
        dispatch(fetchReservations({}));
    }, [dispatch]);

    const stats = [
        {
            name: 'Active Contracts',
            value: 5,
            icon: FileText,
            color: 'bg-purple-500',
            trend: '+2 this month',
        },
        {
            name: 'Total Reservations',
            value: Array.isArray(reservations) ? reservations.length : 0,
            icon: CalendarDays,
            color: 'bg-blue-500',
            trend: 'All time',
        },
        {
            name: 'Commission Earned',
            value: '€2,450',
            icon: DollarSign,
            color: 'bg-green-500',
            trend: 'This month',
        },
        {
            name: 'Pending Offers',
            value: 3,
            icon: Zap,
            color: 'bg-red-500',
            trend: 'Expires soon',
        },
    ];

    // Mock flash offers data
    const flashOffers = [
        {
            id: '1',
            hotel_name: 'Grand Hotel Berlin',
            discount: 25,
            rooms: 10,
            valid_until: '2 hours',
            original_price: 150,
        },
        {
            id: '2',
            hotel_name: 'Maritim Hotel Munich',
            discount: 20,
            rooms: 5,
            valid_until: '5 hours',
            original_price: 180,
        },
        {
            id: '3',
            hotel_name: 'Steigenberger Frankfurt',
            discount: 30,
            rooms: 3,
            valid_until: '12 hours',
            original_price: 200,
        },
    ];

    // Mock contracts data
    const contracts = [
        {
            id: '1',
            hotel_name: 'Grand Hotel Berlin',
            commission: 12,
            status: 'active',
            rooms_allotment: 10,
        },
        {
            id: '2',
            hotel_name: 'Maritim Hotel Munich',
            commission: 15,
            status: 'active',
            rooms_allotment: 5,
        },
        {
            id: '3',
            hotel_name: 'NH Hotel Hamburg',
            commission: 10,
            status: 'pending',
            rooms_allotment: 8,
        },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Agency Dashboard</h1>
                <p className="text-gray-600 mt-2">
                    Welcome back, {organization?.name || 'Agency'}! Here's your overview.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <Card key={stat.name}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Flash Offers Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Zap className="w-6 h-6 text-red-500" />
                        <h2 className="text-xl font-bold text-gray-900">Flash Offers</h2>
                        <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">
                            {flashOffers.length} New
                        </span>
                    </div>
                    <Link
                        to="/flash-offers"
                        className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-medium"
                    >
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {flashOffers.map((offer) => (
                        <div
                            key={offer.id}
                            className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-xl p-4 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{offer.hotel_name}</h3>
                                    <p className="text-sm text-gray-500">{offer.rooms} rooms available</p>
                                </div>
                                <span className="bg-red-500 text-white text-lg font-bold px-3 py-1 rounded-lg">
                                    -{offer.discount}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-gray-400 line-through text-sm">€{offer.original_price}</span>
                                    <span className="text-xl font-bold text-gray-900 ml-2">
                                        €{Math.round(offer.original_price * (1 - offer.discount / 100))}
                                    </span>
                                    <span className="text-gray-500 text-sm">/night</span>
                                </div>
                                <div className="flex items-center gap-1 text-orange-600 text-sm">
                                    <Clock className="w-4 h-4" />
                                    {offer.valid_until}
                                </div>
                            </div>
                            <button className="mt-3 w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 rounded-lg font-medium hover:from-red-600 hover:to-orange-600 transition-colors">
                                Book Now
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Contracts */}
                <Card title="My Contracts" subtitle="Active hotel agreements">
                    <div className="space-y-4">
                        {contracts.map((contract) => (
                            <div
                                key={contract.id}
                                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{contract.hotel_name}</p>
                                        <p className="text-sm text-gray-500">
                                            {contract.rooms_allotment} rooms allotment
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-green-600">{contract.commission}% commission</p>
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${contract.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {contract.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link
                        to="/contracts"
                        className="mt-4 block text-center text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                        View All Contracts
                    </Link>
                </Card>

                {/* Recent Reservations */}
                <Card title="Recent Reservations" subtitle="Latest bookings">
                    <div className="space-y-4">
                        {Array.isArray(reservations) && reservations.slice(0, 5).map((reservation) => (
                            <div
                                key={reservation._id}
                                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{reservation.guest.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(reservation.check_in_date).toLocaleDateString()} -
                                        {new Date(reservation.check_out_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900">€{reservation.total_with_tax}</p>
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {reservation.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(!Array.isArray(reservations) || reservations.length === 0) && (
                            <p className="text-center text-gray-500 py-8">No reservations yet</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
