import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Users,
    MousePointer2,
    TrendingUp,
    Zap,
    Clock,
    AlertCircle
} from 'lucide-react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import api from '@/services/api';
import { toast } from 'sonner';

interface FlashOffer {
    _id: string;
    title: string;
    discount_value: number;
    discount_type: 'percentage' | 'fixed';
    rooms_available: number;
    rooms_booked: number;
    status: 'active' | 'expired' | 'sold_out' | 'draft';
    offer_expires_at: string;
    views_count: number;
    clicks_count: number;
}

interface FlashOfferFormData {
    property_id: string;
    room_type_id: string;
    title: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    original_price: number;
    rooms_available: number;
    offer_hours: number;
    stay_date_from: string;
    stay_date_to: string;
    target_type: 'all_partners' | 'specific_agencies';
}

export default function FlashOffersManagementPage() {
    const [offers, setOffers] = useState<FlashOffer[]>([]);
    const [stats, setStats] = useState({
        active_offers: 0,
        total_views: 0,
        total_clicks: 0,
        conversion_rate: 0
    });
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form Data State
    const [formData, setFormData] = useState<FlashOfferFormData>({
        property_id: '',
        room_type_id: '',
        title: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 20,
        original_price: 0,
        rooms_available: 5,
        offer_hours: 24,
        stay_date_from: '',
        stay_date_to: '',
        target_type: 'all_partners'
    });

    // Lists for dropdowns
    const [properties, setProperties] = useState<any[]>([]);
    const [roomTypes, setRoomTypes] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
        fetchProperties();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [offersRes, statsRes] = await Promise.all([
                api.get('/flash-offers-b2b?status=active'),
                api.get('/flash-offers-b2b/stats')
            ]);
            setOffers(offersRes.data.data.items || []);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch flash offers:', error);
            toast.error('Failed to load flash offers');
        } finally {
            setLoading(false);
        }
    };

    const fetchProperties = async () => {
        try {
            const res = await api.get('/properties');
            setProperties(res.data.data);
            if (res.data.data.length > 0) {
                setFormData(prev => ({ ...prev, property_id: res.data.data[0]._id }));
                fetchRoomTypes(res.data.data[0]._id);
            }
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        }
    };

    const fetchRoomTypes = async (propertyId: string) => {
        try {
            const res = await api.get(`/properties/${propertyId}/room-types`);
            setRoomTypes(res.data.data);
            if (res.data.data.length > 0) {
                setFormData(prev => ({ ...prev, room_type_id: res.data.data[0]._id }));
            }
        } catch (error) {
            console.error('Failed to fetch room types:', error);
        }
    };

    const handleCreateOffer = async () => {
        try {
            await api.post('/flash-offers-b2b', formData);
            toast.success('Flash offer created successfully');
            setIsCreateModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create offer:', error);
            toast.error('Failed to create offer');
        }
    };

    const handleCancelOffer = async (id: string) => {
        try {
            await api.put(`/flash-offers-b2b/${id}/cancel`);
            toast.success('Offer cancelled');
            fetchData();
        } catch (error) {
            console.error('Failed to cancel offer:', error);
            toast.error('Failed to cancel offer');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'expired': return 'bg-gray-100 text-gray-800';
            case 'sold_out': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Flash Offers Management</h1>
                    <p className="text-gray-500">Create and manage time-limited deals for agencies</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Offer
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active Offers</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.active_offers}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Zap className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Views</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total_views}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Clicks</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total_clicks}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <MousePointer2 className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Conversion Rate</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.conversion_rate}%</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Offers List */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-gray-900">Active Offers</h2>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search offers..."
                                className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <Button variant="outline" size="sm">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires In</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {offers.map((offer) => (
                                <tr key={offer._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{offer.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-green-600 font-semibold">
                                            {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `€${offer.discount_value}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{offer.rooms_booked} / {offer.rooms_available}</div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 max-w-[60px]">
                                            <div
                                                className="bg-blue-600 h-1.5 rounded-full"
                                                style={{ width: `${Math.min(100, (offer.rooms_booked / offer.rooms_available) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Clock className="w-4 h-4 mr-1" />
                                            {new Date(offer.offer_expires_at) > new Date()
                                                ? Math.round((new Date(offer.offer_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60)) + 'h'
                                                : 'Expired'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {offer.views_count} views • {offer.clicks_count} clicks
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(offer.status)}`}>
                                            {offer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleCancelOffer(offer._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Cancel
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {offers.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <Zap className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                        <p>No active flash offers</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create Offer Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Flash Offer"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Property</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.property_id}
                                onChange={(e) => {
                                    setFormData({ ...formData, property_id: e.target.value });
                                    fetchRoomTypes(e.target.value);
                                }}
                            >
                                {properties.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Room Type</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.room_type_id}
                                onChange={(e) => setFormData({ ...formData, room_type_id: e.target.value })}
                            >
                                {roomTypes.map(r => (
                                    <option key={r._id} value={r._id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Offer Title</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Weekend Special - 20% Off"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Discount Value (%)</label>
                            <input
                                type="number"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.discount_value}
                                onChange={(e) => setFormData({ ...formData, discount_value: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Available Rooms</label>
                            <input
                                type="number"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.rooms_available}
                                onChange={(e) => setFormData({ ...formData, rooms_available: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stay Date From</label>
                            <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.stay_date_from}
                                onChange={(e) => setFormData({ ...formData, stay_date_from: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stay Date To</label>
                            <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={formData.stay_date_to}
                                onChange={(e) => setFormData({ ...formData, stay_date_to: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Duration (Hours)</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={formData.offer_hours}
                            onChange={(e) => setFormData({ ...formData, offer_hours: parseInt(e.target.value) })}
                        >
                            <option value={12}>12 Hours</option>
                            <option value={24}>24 Hours</option>
                            <option value={48}>48 Hours</option>
                            <option value={72}>72 Hours</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Offer will automatically expire after this duration
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateOffer}>Publish Offer</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
