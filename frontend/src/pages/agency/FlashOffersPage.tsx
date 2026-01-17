import { useEffect, useState } from 'react';
import Card from '@/components/common/Card';
import {
    Zap,
    Clock,
    Building2,
    MapPin,
    Search,
    Filter
} from 'lucide-react';

export default function FlashOffersPage() {
    // Mock flash offers data - would come from API
    const [offers, setOffers] = useState([
        {
            id: '1',
            hotel_name: 'Grand Hotel Berlin',
            hotel_city: 'Berlin, Germany',
            discount: 25,
            rooms: 10,
            valid_until: new Date(Date.now() + 2 * 60 * 60 * 1000),
            original_price: 150,
            room_type: 'Deluxe Double',
            meal_plan: 'BB',
            created_at: new Date(),
        },
        {
            id: '2',
            hotel_name: 'Maritim Hotel Munich',
            hotel_city: 'Munich, Germany',
            discount: 20,
            rooms: 5,
            valid_until: new Date(Date.now() + 5 * 60 * 60 * 1000),
            original_price: 180,
            room_type: 'Superior Room',
            meal_plan: 'RO',
            created_at: new Date(),
        },
        {
            id: '3',
            hotel_name: 'Steigenberger Frankfurt',
            hotel_city: 'Frankfurt, Germany',
            discount: 30,
            rooms: 3,
            valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000),
            original_price: 200,
            room_type: 'Junior Suite',
            meal_plan: 'HB',
            created_at: new Date(),
        },
        {
            id: '4',
            hotel_name: 'NH Hotel Hamburg',
            hotel_city: 'Hamburg, Germany',
            discount: 15,
            rooms: 8,
            valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000),
            original_price: 120,
            room_type: 'Standard Room',
            meal_plan: 'BB',
            created_at: new Date(),
        },
    ]);

    const [searchTerm, setSearchTerm] = useState('');

    const getTimeRemaining = (validUntil: Date) => {
        const now = new Date();
        const diff = validUntil.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m remaining`;
        }
        return `${minutes}m remaining`;
    };

    const getMealPlanLabel = (code: string) => {
        const labels: { [key: string]: string } = {
            RO: 'Room Only',
            BB: 'Bed & Breakfast',
            HB: 'Half Board',
            FB: 'Full Board',
            AI: 'All Inclusive',
        };
        return labels[code] || code;
    };

    const filteredOffers = offers.filter(offer =>
        offer.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.hotel_city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-8 h-8 text-red-500" />
                    <h1 className="text-3xl font-bold text-gray-900">Flash Offers</h1>
                </div>
                <p className="text-gray-600">
                    Exclusive last-minute deals from partner hotels. Act fast - these offers expire!
                </p>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search hotels or cities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                    <Filter className="w-5 h-5" />
                    Filters
                </button>
            </div>

            {/* Offers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOffers.map((offer) => (
                    <div
                        key={offer.id}
                        className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group"
                    >
                        {/* Header with discount badge */}
                        <div className="relative bg-gradient-to-r from-red-500 to-orange-500 p-4 text-white">
                            <div className="absolute top-4 right-4 bg-white text-red-600 text-xl font-bold px-3 py-1 rounded-lg shadow-lg">
                                -{offer.discount}%
                            </div>
                            <h3 className="text-lg font-bold pr-20">{offer.hotel_name}</h3>
                            <div className="flex items-center gap-1 text-red-100 text-sm mt-1">
                                <MapPin className="w-4 h-4" />
                                {offer.hotel_city}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm text-gray-500">{offer.room_type}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        {getMealPlanLabel(offer.meal_plan)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-gray-400 line-through text-sm">€{offer.original_price}</div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        €{Math.round(offer.original_price * (1 - offer.discount / 100))}
                                    </div>
                                    <div className="text-xs text-gray-500">per night</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-3 border-t border-gray-100">
                                <div className="text-sm text-gray-600">
                                    <span className="font-semibold text-gray-900">{offer.rooms}</span> rooms available
                                </div>
                                <div className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                                    <Clock className="w-4 h-4" />
                                    {getTimeRemaining(offer.valid_until)}
                                </div>
                            </div>

                            <button className="mt-3 w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-colors group-hover:shadow-lg">
                                Book Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredOffers.length === 0 && (
                <div className="text-center py-12">
                    <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Flash Offers Found</h3>
                    <p className="text-gray-500">Check back later for new exclusive deals!</p>
                </div>
            )}
        </div>
    );
}
