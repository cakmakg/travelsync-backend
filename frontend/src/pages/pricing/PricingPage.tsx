import { useState } from 'react';
import Card from '@/components/common/Card';
import {
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Save,
    X,
    Bed,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

export default function PricingPage() {
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedRoomType, setSelectedRoomType] = useState('all');
    const [editingDate, setEditingDate] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState('');

    // Mock room types
    const roomTypes = [
        { id: '1', name: 'Standard Room', code: 'STD', basePrice: 89 },
        { id: '2', name: 'Deluxe Room', code: 'DLX', basePrice: 129 },
        { id: '3', name: 'Junior Suite', code: 'JST', basePrice: 189 },
        { id: '4', name: 'Executive Suite', code: 'EXE', basePrice: 289 },
    ];

    // Generate calendar days
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Add empty cells for days before the first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add actual days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    // Mock price data - in real app, this would come from API
    const getPriceForDate = (date: Date, roomTypeId: string) => {
        const day = date.getDay();
        const roomType = roomTypes.find(r => r.id === roomTypeId);
        const basePrice = roomType?.basePrice || 100;

        // Weekend markup
        if (day === 5 || day === 6) {
            return Math.round(basePrice * 1.2);
        }
        return basePrice;
    };

    const getOccupancyForDate = (_date: Date) => {
        // Mock occupancy data
        const random = Math.floor(Math.random() * 100);
        return random;
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const navigateMonth = (direction: number) => {
        const newDate = new Date(selectedMonth);
        newDate.setMonth(newDate.getMonth() + direction);
        setSelectedMonth(newDate);
    };

    const handleEditPrice = (dateStr: string, currentPrice: number) => {
        setEditingDate(dateStr);
        setEditPrice(currentPrice.toString());
    };

    const handleSavePrice = () => {
        // Save price logic would go here
        setEditingDate(null);
        setEditPrice('');
    };

    const days = getDaysInMonth(selectedMonth);

    // Stats
    const avgPrice = roomTypes.reduce((sum, r) => sum + r.basePrice, 0) / roomTypes.length;
    const minPrice = Math.min(...roomTypes.map(r => r.basePrice));
    const maxPrice = Math.max(...roomTypes.map(r => r.basePrice));

    return (
        <div>
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-8 h-8 text-yellow-500" />
                    <h1 className="text-3xl font-bold text-gray-900">Pricing</h1>
                </div>
                <p className="text-gray-600">Manage room rates and pricing strategies</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Average Rate</p>
                            <p className="text-2xl font-bold text-gray-900">€{avgPrice.toFixed(0)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Min Rate</p>
                            <p className="text-2xl font-bold text-green-600">€{minPrice}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Max Rate</p>
                            <p className="text-2xl font-bold text-red-600">€{maxPrice}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Room Types</p>
                            <p className="text-2xl font-bold text-gray-900">{roomTypes.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Bed className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <select
                        value={selectedRoomType}
                        onChange={(e) => setSelectedRoomType(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Room Types</option>
                        {roomTypes.map(room => (
                            <option key={room.id} value={room.id}>{room.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-semibold min-w-[180px] text-center">
                        {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
                    </span>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Edit3 className="w-4 h-4" />
                    Bulk Update
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {dayNames.map(day => (
                        <div key={day} className="py-3 text-center text-sm font-medium text-gray-600">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                    {days.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className="min-h-[100px] bg-gray-50" />;
                        }

                        const dateStr = date.toISOString().split('T')[0];
                        const isToday = new Date().toDateString() === date.toDateString();
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const occupancy = getOccupancyForDate(date);
                        const price = selectedRoomType !== 'all'
                            ? getPriceForDate(date, selectedRoomType)
                            : Math.round(avgPrice);
                        const isEditing = editingDate === dateStr;

                        return (
                            <div
                                key={dateStr}
                                className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${isToday ? 'bg-primary-50' : isWeekend ? 'bg-orange-50/50' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-medium ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
                                        {date.getDate()}
                                    </span>
                                    {isWeekend && (
                                        <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">
                                            +20%
                                        </span>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={editPrice}
                                            onChange={(e) => setEditPrice(e.target.value)}
                                            className="w-16 px-2 py-1 text-sm border rounded"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSavePrice}
                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                        >
                                            <Save className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingDate(null)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleEditPrice(dateStr, price)}
                                        className="w-full text-left group"
                                    >
                                        <div className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                            €{price}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <div
                                                className={`h-1.5 rounded-full ${occupancy > 80 ? 'bg-red-500' :
                                                    occupancy > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${occupancy}%` }}
                                            />
                                            <span className="text-xs text-gray-500">{occupancy}%</span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Room Type Rates Table */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Base Rates by Room Type</h2>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weekend Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {roomTypes.map((room) => (
                                <tr key={room.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                                <Bed className="w-5 h-5 text-primary-600" />
                                            </div>
                                            <span className="font-medium text-gray-900">{room.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm font-mono rounded">
                                            {room.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-lg font-semibold text-gray-900">€{room.basePrice}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-lg font-semibold text-orange-600">
                                            €{Math.round(room.basePrice * 1.2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                            Edit Rates
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
