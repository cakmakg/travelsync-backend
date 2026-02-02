import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Package, ChevronLeft, ChevronRight, AlertTriangle, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchProperties } from '@/store/slices/propertiesSlice';
import { fetchRoomTypes } from '@/store/slices/roomTypesSlice';
import api from '@/services/api';

interface InventoryRecord {
    _id: string;
    room_type_id: string;
    date: string;
    allotment: number;
    sold: number;
    available: number;
    stop_sell: boolean;
    closed: boolean;
}

export default function InventoryPage() {
    const dispatch = useAppDispatch();
    const { properties } = useAppSelector((state) => state.properties);
    const { roomTypes } = useAppSelector((state) => state.roomTypes);

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
    const [inventory, setInventory] = useState<InventoryRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });

    // Fetch properties on mount
    useEffect(() => {
        dispatch(fetchProperties({}));
    }, [dispatch]);

    // Set first property as default
    useEffect(() => {
        if (properties.length > 0 && !selectedPropertyId) {
            setSelectedPropertyId(properties[0]._id);
        }
    }, [properties, selectedPropertyId]);

    // Fetch room types when property changes
    useEffect(() => {
        if (selectedPropertyId) {
            dispatch(fetchRoomTypes({ property_id: selectedPropertyId }));
        }
    }, [dispatch, selectedPropertyId]);

    // Fetch inventory when property or week changes
    useEffect(() => {
        if (selectedPropertyId) {
            fetchInventory();
        }
    }, [selectedPropertyId, currentWeekStart]);

    const fetchInventory = async () => {
        if (!selectedPropertyId) return;

        setLoading(true);
        try {
            const endDate = new Date(currentWeekStart);
            endDate.setDate(endDate.getDate() + 6);

            const response = await api.get('/inventory', {
                params: {
                    property_id: selectedPropertyId,
                    start_date: currentWeekStart.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                },
            });
            setInventory(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const goToPreviousWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() - 7);
        setCurrentWeekStart(newStart);
    };

    const goToNextWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + 7);
        setCurrentWeekStart(newStart);
    };

    const goToToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setCurrentWeekStart(today);
    };

    const getWeekDates = () => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const getInventoryForRoomTypeAndDate = (roomTypeId: string, date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return inventory.find(
            (inv) => inv.room_type_id === roomTypeId && inv.date.startsWith(dateStr)
        );
    };

    const handleToggleStopSell = async (inv: InventoryRecord) => {
        try {
            await api.put(`/inventory/${inv._id}`, { stop_sell: !inv.stop_sell });
            toast.success(inv.stop_sell ? 'Room reopened for sale' : 'Room stopped for sale');
            fetchInventory();
        } catch (error) {
            toast.error('Failed to update inventory');
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const weekDates = getWeekDates();

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                    <p className="text-gray-600 mt-2">Manage daily room availability and pricing</p>
                </div>
            </div>

            {/* Property Selector */}
            <Card className="p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700">Property:</label>
                        <select
                            value={selectedPropertyId}
                            onChange={(e) => setSelectedPropertyId(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {properties.map((property) => (
                                <option key={property._id} value={property._id}>
                                    {property.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Week Navigation */}
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Today
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToNextWeek}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Inventory Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : roomTypes.length === 0 ? (
                <Card className="p-12 text-center">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Room Types</h3>
                    <p className="text-gray-500">Create room types first to manage inventory</p>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 min-w-[200px]">
                                        Room Type
                                    </th>
                                    {weekDates.map((date) => (
                                        <th key={date.toISOString()} className="text-center px-2 py-3 text-sm font-medium text-gray-700 min-w-[100px]">
                                            <div>{formatDate(date)}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {roomTypes.map((roomType) => (
                                    <tr key={roomType._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{roomType.name}</div>
                                            <div className="text-xs text-gray-500">{roomType.code}</div>
                                        </td>
                                        {weekDates.map((date) => {
                                            const inv = getInventoryForRoomTypeAndDate(roomType._id, date);
                                            const available = inv?.available ?? roomType.total_quantity;
                                            const sold = inv?.sold ?? 0;
                                            const isStopSell = inv?.stop_sell ?? false;
                                            const isClosed = inv?.closed ?? false;

                                            return (
                                                <td key={date.toISOString()} className="text-center px-2 py-3">
                                                    {isClosed ? (
                                                        <div className="text-red-500 text-sm">
                                                            <X className="w-4 h-4 mx-auto" />
                                                            <span className="text-xs">Closed</span>
                                                        </div>
                                                    ) : isStopSell ? (
                                                        <div
                                                            className="text-orange-500 text-sm cursor-pointer hover:text-orange-700"
                                                            onClick={() => inv && handleToggleStopSell(inv)}
                                                        >
                                                            <AlertTriangle className="w-4 h-4 mx-auto" />
                                                            <span className="text-xs">Stop Sale</span>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={`cursor-pointer rounded-lg p-2 ${available === 0
                                                                ? 'bg-red-50 text-red-700'
                                                                : available <= 2
                                                                    ? 'bg-yellow-50 text-yellow-700'
                                                                    : 'bg-green-50 text-green-700'
                                                                }`}
                                                            onClick={() => inv && handleToggleStopSell(inv)}
                                                        >
                                                            <div className="text-lg font-bold">{available}</div>
                                                            <div className="text-xs">/ {roomType.total_quantity}</div>
                                                            {sold > 0 && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {sold} sold
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Legend */}
            <div className="mt-4 flex items-center justify-end space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-green-100"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-yellow-100"></div>
                    <span>Low Stock</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded bg-red-100"></div>
                    <span>Sold Out</span>
                </div>
                <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span>Stop Sale</span>
                </div>
            </div>
        </div>
    );
}
