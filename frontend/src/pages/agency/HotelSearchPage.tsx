import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import {
    Search,
    Building2,
    MapPin,
    Calendar,
    Users,
    Star,
    ArrowRight
} from 'lucide-react';
import api from '@/services/api';

interface Hotel {
    _id: string;
    org_id: string;
    name: string;
    location: string;
    country: string;
    star_rating: number;
    image_url?: string;
    room_types: RoomResult[];
    commission_rate: number;
}

interface RoomResult {
    _id: string;
    name: string;
    code: string;
    capacity: { adults: number; children: number };
    available_rooms: number;
    price_per_night: number;
    total_price: number;
}

export default function HotelSearchPage() {
    const [searchParams] = useSearchParams();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Search filters
    const [destination, setDestination] = useState(searchParams.get('q') || '');
    const [checkIn, setCheckIn] = useState(
        searchParams.get('checkIn') || new Date().toISOString().split('T')[0]
    );
    const [checkOut, setCheckOut] = useState(
        searchParams.get('checkOut') || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    );
    const [adults, setAdults] = useState(parseInt(searchParams.get('adults') || '2'));
    const [children, setChildren] = useState(parseInt(searchParams.get('children') || '0'));

    useEffect(() => {
        if (searchParams.get('q')) {
            handleSearch();
        }
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        setSearched(true);

        try {
            // Get connected hotels first
            const partnersRes = await api.get('/partnerships/connected');
            const partners = partnersRes.data.data || [];

            // Mock search results based on connected hotels
            // In production, this would query availability from each hotel
            const mockResults: Hotel[] = partners.map((partner: any, index: number) => ({
                _id: partner.hotel_org_id?._id || `hotel-${index}`,
                org_id: partner.hotel_org_id?._id,
                name: partner.hotel_org_id?.name || `Partner Hotel ${index + 1}`,
                location: 'Istanbul',
                country: partner.hotel_org_id?.country || 'TR',
                star_rating: 4 + (index % 2),
                commission_rate: partner.default_commission?.rate || 10,
                room_types: [
                    {
                        _id: `room-${index}-1`,
                        name: 'Standard Double',
                        code: 'STD',
                        capacity: { adults: 2, children: 1 },
                        available_rooms: 5 + index,
                        price_per_night: 80 + index * 20,
                        total_price: (80 + index * 20) * getNights(),
                    },
                    {
                        _id: `room-${index}-2`,
                        name: 'Deluxe Suite',
                        code: 'DLX',
                        capacity: { adults: 3, children: 2 },
                        available_rooms: 3,
                        price_per_night: 150 + index * 30,
                        total_price: (150 + index * 30) * getNights(),
                    },
                ],
            }));

            // Filter by destination if provided
            const filtered = destination
                ? mockResults.filter(
                    (h) =>
                        h.name.toLowerCase().includes(destination.toLowerCase()) ||
                        h.location.toLowerCase().includes(destination.toLowerCase())
                )
                : mockResults;

            setHotels(filtered);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const getNights = () => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const renderStars = (rating: number) => {
        return Array(rating)
            .fill(0)
            .map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Search Hotels</h1>
                <p className="text-gray-600 mt-2">Find available rooms from your partner hotels</p>
            </div>

            {/* Search Form */}
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Destination
                        </label>
                        <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="City or hotel name"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Check-in
                        </label>
                        <input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Check-out
                        </label>
                        <input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            min={checkIn}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Users className="w-4 h-4 inline mr-1" />
                            Guests
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="number"
                                value={adults}
                                onChange={(e) => setAdults(parseInt(e.target.value))}
                                min={1}
                                max={10}
                                className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Adults"
                            />
                            <input
                                type="number"
                                value={children}
                                onChange={(e) => setChildren(parseInt(e.target.value))}
                                min={0}
                                max={10}
                                className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Children"
                            />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <Button variant="primary" onClick={handleSearch} className="w-full" disabled={loading}>
                            <Search className="w-4 h-4 mr-2" />
                            {loading ? 'Searching...' : 'Search'}
                        </Button>
                    </div>
                </div>

                {/* Search Summary */}
                {searched && (
                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-600">
                        <span>
                            {getNights()} night{getNights() > 1 ? 's' : ''} • {adults} adult{adults > 1 ? 's' : ''}
                            {children > 0 && `, ${children} child${children > 1 ? 'ren' : ''}`}
                        </span>
                        <span>{hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found</span>
                    </div>
                )}
            </Card>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : searched && hotels.length === 0 ? (
                <Card className="p-12 text-center">
                    <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Hotels Found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria or connect with more partner hotels</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {hotels.map((hotel) => (
                        <Card key={hotel._id} className="overflow-hidden">
                            <div className="flex">
                                {/* Hotel Image */}
                                <div className="w-48 h-48 bg-gray-200 flex-shrink-0">
                                    {hotel.image_url ? (
                                        <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Building2 className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Hotel Info */}
                                <div className="flex-1 p-4">
                                    <div className="flex justify-between">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-xl font-semibold text-gray-900">{hotel.name}</h3>
                                                <div className="flex">{renderStars(hotel.star_rating)}</div>
                                            </div>
                                            <p className="text-sm text-gray-500 flex items-center mt-1">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {hotel.location}, {hotel.country}
                                            </p>
                                            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                                {hotel.commission_rate}% Commission
                                            </span>
                                        </div>
                                    </div>

                                    {/* Room Types */}
                                    <div className="mt-4 space-y-2">
                                        {hotel.room_types.map((room) => (
                                            <div
                                                key={room._id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">{room.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Up to {room.capacity.adults} adults
                                                        {room.capacity.children > 0 && `, ${room.capacity.children} children`}
                                                        • {room.available_rooms} available
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {formatCurrency(room.total_price)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatCurrency(room.price_per_night)}/night
                                                        </p>
                                                    </div>
                                                    <Link
                                                        to={`/agency/booking?hotel=${hotel._id}&room=${room._id}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`}
                                                    >
                                                        <Button variant="primary" size="sm">
                                                            Select <ArrowRight className="w-4 h-4 ml-1" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
