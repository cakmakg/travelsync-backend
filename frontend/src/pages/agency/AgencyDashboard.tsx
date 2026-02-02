import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Download,
    TrendingUp,
    Clock,
    Plane,
    MapPin,
    Calendar,
    Users,
    ChevronRight,
    Plus,
    Zap,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchReservations } from '@/store/slices/reservationsSlice';
import api from '@/services/api';

// Flash Offer Type
interface FlashOffer {
    _id: string;
    title: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    original_price?: number;
    discounted_price?: number;
    rooms_available: number;
    rooms_booked: number;
    stay_date_from: string;
    stay_date_to: string;
    offer_expires_at: string;
    property_id?: {
        name: string;
        address?: { city?: string; country?: string };
    };
    hotel_org_id?: { name: string };
    status: string;
}

// Mock proposals
const recentProposals = [
    { client: 'Smith Family', sentAgo: '2h ago', trip: 'Paris, France', estimate: '$4,200 Est.', status: 'Pending', statusColor: 'text-yellow-400' },
    { client: 'Tech Corp', sentAgo: '5h ago', trip: 'Tokyo Retreat', estimate: '$12,500 Est.', status: 'Viewed', statusColor: 'text-blue-400' },
    { client: 'Linda M.', sentAgo: '1d ago', trip: 'Bali Honeymoon', estimate: '$3,800 Est.', status: 'Accepted', statusColor: 'text-green-400' },
    { client: 'The Joneses', sentAgo: '2d ago', trip: 'Disney World', estimate: '$5,100 Est.', status: 'Draft', statusColor: 'text-gray-400' },
];

export default function AgencyDashboard() {
    const { user } = useAuth();
    const dispatch = useAppDispatch();
    const { reservations } = useAppSelector((state) => state.reservations);

    const [destination, setDestination] = useState('');
    const [dates, setDates] = useState('Oct 24 - Oct 31');
    const [guests, setGuests] = useState('2 Adults');
    const [flashOffers, setFlashOffers] = useState<FlashOffer[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(true);

    const userName = user?.first_name || 'User';

    useEffect(() => {
        dispatch(fetchReservations({}));
        fetchFlashOffers();
    }, [dispatch]);

    const fetchFlashOffers = async () => {
        try {
            setLoadingOffers(true);
            const response = await api.get('/flash-offers-b2b/agency');
            setFlashOffers(response.data.data?.items || []);
        } catch (error) {
            console.error('Failed to fetch flash offers:', error);
            setFlashOffers([]);
        } finally {
            setLoadingOffers(false);
        }
    };

    // Calculate stats from real data
    const pendingQuotes = reservations.filter(r => r.status === 'pending').length;
    const activeBookings = reservations.filter(r =>
        r.status === 'confirmed' || r.status === 'checked_in'
    ).length;

    // Mock commission (would come from API)
    const monthCommission = 4250;
    const commissionChange = 12;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Welcome back, {userName}</h1>
                    <p className="text-gray-400 mt-1">Here's what's happening in your territory today.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#2d3a4f] rounded-lg text-white font-medium transition-colors border border-gray-700">
                    <Download className="w-4 h-4" />
                    Export Report
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Month's Commission */}
                <div className="bg-[#1e293b] rounded-2xl p-6 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-sm">Month's Commission</p>
                        <TrendingUp className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                        <span className="text-4xl font-bold text-white">${monthCommission.toLocaleString()}</span>
                        <span className="text-green-400 text-sm font-medium">+{commissionChange}%</span>
                    </div>
                </div>

                {/* Pending Quotes */}
                <div className="bg-[#1e293b] rounded-2xl p-6 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-sm">Pending Quotes</p>
                        <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                        <span className="text-4xl font-bold text-white">{pendingQuotes}</span>
                        {pendingQuotes > 0 && (
                            <span className="text-orange-400 text-sm font-medium">Requires Action</span>
                        )}
                    </div>
                </div>

                {/* Active Bookings */}
                <div className="bg-[#1e293b] rounded-2xl p-6 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-sm">Active Bookings</p>
                        <Plane className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="mt-2">
                        <span className="text-4xl font-bold text-white">{activeBookings}</span>
                        <p className="text-gray-500 text-sm mt-1">Currently traveling</p>
                    </div>
                </div>
            </div>

            {/* Quick Availability Search */}
            <div className="bg-[#1e293b] rounded-2xl p-6 mb-8 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-semibold text-white">Quick Availability Search</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-gray-400 text-xs uppercase mb-2">DESTINATION</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="e.g. Paris, Maldives, or Hotel Name"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-xs uppercase mb-2">DATES</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={dates}
                                onChange={(e) => setDates(e.target.value)}
                                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-xs uppercase mb-2">GUESTS</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <select
                                value={guests}
                                onChange={(e) => setGuests(e.target.value)}
                                className="w-full bg-[#0f172a] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white appearance-none focus:outline-none focus:border-blue-500"
                            >
                                <option>1 Adult</option>
                                <option>2 Adults</option>
                                <option>2 Adults, 1 Child</option>
                                <option>2 Adults, 2 Children</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-end">
                        <Link
                            to="/agency/search"
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                        >
                            Search
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Flash Partner Deals */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">Flash Partner Deals</h2>
                        <Link to="/agency/flash-offers" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                            View All Deals
                        </Link>
                    </div>

                    {loadingOffers ? (
                        <div className="bg-[#1e293b] rounded-2xl p-8 text-center border border-gray-700/50">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-gray-400 mt-4">Loading flash offers...</p>
                        </div>
                    ) : flashOffers.length === 0 ? (
                        <div className="bg-[#1e293b] rounded-2xl p-8 text-center border border-gray-700/50">
                            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">No flash offers available right now.</p>
                            <p className="text-gray-500 text-sm mt-2">Connect with hotels to receive exclusive deals.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {flashOffers.slice(0, 4).map((offer) => (
                                <div key={offer._id} className="bg-[#1e293b] rounded-2xl overflow-hidden border border-gray-700/50">
                                    <div className="relative h-32 bg-gradient-to-br from-blue-600 to-purple-700">
                                        <span className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                                            {offer.discount_type === 'percentage' ? `-${offer.discount_value}%` : `-€${offer.discount_value}`}
                                        </span>
                                        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-white text-sm">
                                            <Clock className="w-3 h-3 text-orange-400" />
                                            {new Date(offer.offer_expires_at) > new Date()
                                                ? `${Math.ceil((new Date(offer.offer_expires_at).getTime() - Date.now()) / (1000 * 60 * 60))}h left`
                                                : 'Expired'}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-white">{offer.title}</h3>
                                        <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                                            <MapPin className="w-3 h-3" />
                                            {offer.property_id?.address?.city || 'Unknown'}, {offer.property_id?.address?.country || ''}
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <div>
                                                {offer.original_price && (
                                                    <span className="text-gray-500 line-through text-sm">€{offer.original_price}/night</span>
                                                )}
                                                {offer.discounted_price && (
                                                    <p className="text-xl font-bold text-white">€{Math.round(offer.discounted_price)}<span className="text-sm font-normal text-gray-400">/night</span></p>
                                                )}
                                                <p className="text-xs text-green-400">{offer.rooms_available - offer.rooms_booked} rooms left</p>
                                            </div>
                                            <Link
                                                to={`/agency/booking?offer=${offer._id}`}
                                                className="px-4 py-2 bg-transparent border border-blue-500 text-blue-400 rounded-lg font-medium text-sm hover:bg-blue-500/10 transition-colors"
                                            >
                                                Book Now
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Proposals */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">Recent Proposals</h2>
                        <button className="w-8 h-8 flex items-center justify-center bg-[#1e293b] hover:bg-[#2d3a4f] rounded-lg border border-gray-700 transition-colors">
                            <Plus className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    <div className="bg-[#1e293b] rounded-2xl border border-gray-700/50 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-gray-400 text-xs uppercase border-b border-gray-700">
                                    <th className="p-4 font-medium">Client</th>
                                    <th className="p-4 font-medium">Trip</th>
                                    <th className="p-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {recentProposals.map((proposal, idx) => (
                                    <tr key={idx} className="hover:bg-[#0f172a]/50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-medium text-white text-sm">{proposal.client}</p>
                                            <p className="text-gray-500 text-xs">Sent {proposal.sentAgo}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-white text-sm">{proposal.trip}</p>
                                            <p className="text-gray-500 text-xs">{proposal.estimate}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-sm font-medium ${proposal.statusColor}`}>
                                                • {proposal.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 border-t border-gray-700">
                            <Link
                                to="/agency/bookings"
                                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center justify-center gap-1"
                            >
                                VIEW ALL PROPOSALS
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
