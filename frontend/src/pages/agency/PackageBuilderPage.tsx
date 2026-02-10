import { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import {
    Package,
    Plus,
    Building2,
    Car,
    MapPin,
    Trash2,
    Save,
    Eye,
    ChevronDown,
    ChevronUp,
    Calendar,
    DollarSign,
    Star,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface AccommodationItem {
    id: string;
    hotel_name: string;
    room_name: string;
    nights: number;
    day_start: number;
    board_type: string;
    price_per_night: number;
}

interface TransferItem {
    id: string;
    type: string;
    description: string;
    from_location: string;
    to_location: string;
    vehicle_type: string;
    day: number;
    price: number;
    included: boolean;
}

interface ActivityItem {
    id: string;
    name: string;
    description: string;
    day: number;
    duration_hours: number;
    location: string;
    price: number;
    included: boolean;
}

export default function PackageBuilderPage() {
    // Package basics
    const [packageName, setPackageName] = useState('');
    const [packageType, setPackageType] = useState('custom');
    const [description, setDescription] = useState('');
    const [destinationCountry, setDestinationCountry] = useState('Germany');
    const [destinationCity, setDestinationCity] = useState('');
    const [nights, setNights] = useState(3);
    const [validFrom, setValidFrom] = useState('');
    const [validTo, setValidTo] = useState('');

    // Pricing
    const [priceAdult, setPriceAdult] = useState(0);
    const [priceChild, setPriceChild] = useState(0);
    const [singleSupplement, setSingleSupplement] = useState(0);

    // Components
    const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
    const [transfers, setTransfers] = useState<TransferItem[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);

    // UI State
    const [activeSection, setActiveSection] = useState('basics');
    const [isSaving, setIsSaving] = useState(false);

    // Helpers
    const generateId = () => Math.random().toString(36).substring(2, 9);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    // Calculate totals
    const calculateTotal = () => {
        let total = 0;
        accommodations.forEach(a => total += a.price_per_night * a.nights);
        transfers.filter(t => t.included).forEach(t => total += t.price);
        activities.filter(a => a.included).forEach(a => total += a.price);
        return total;
    };

    // Add handlers
    const addAccommodation = () => {
        setAccommodations([...accommodations, {
            id: generateId(),
            hotel_name: '',
            room_name: '',
            nights: 1,
            day_start: accommodations.length > 0 ? Math.max(...accommodations.map(a => a.day_start + a.nights)) : 1,
            board_type: 'breakfast',
            price_per_night: 0,
        }]);
    };

    const addTransfer = () => {
        setTransfers([...transfers, {
            id: generateId(),
            type: 'airport_pickup',
            description: '',
            from_location: '',
            to_location: '',
            vehicle_type: 'private_car',
            day: 1,
            price: 0,
            included: true,
        }]);
    };

    const addActivity = () => {
        setActivities([...activities, {
            id: generateId(),
            name: '',
            description: '',
            day: 1,
            duration_hours: 2,
            location: '',
            price: 0,
            included: true,
        }]);
    };

    // Update handlers
    const updateAccommodation = (id: string, field: string, value: unknown) => {
        setAccommodations(accommodations.map(a =>
            a.id === id ? { ...a, [field]: value } : a
        ));
    };

    const updateTransfer = (id: string, field: string, value: unknown) => {
        setTransfers(transfers.map(t =>
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    const updateActivity = (id: string, field: string, value: unknown) => {
        setActivities(activities.map(a =>
            a.id === id ? { ...a, [field]: value } : a
        ));
    };

    // Remove handlers
    const removeAccommodation = (id: string) => {
        setAccommodations(accommodations.filter(a => a.id !== id));
    };

    const removeTransfer = (id: string) => {
        setTransfers(transfers.filter(t => t.id !== id));
    };

    const removeActivity = (id: string) => {
        setActivities(activities.filter(a => a.id !== id));
    };

    // Save handler
    const handleSave = async (publish = false) => {
        if (!packageName.trim()) {
            toast.error('Package name is required');
            return;
        }
        if (!destinationCity.trim()) {
            toast.error('Destination city is required');
            return;
        }
        if (priceAdult <= 0) {
            toast.error('Adult price must be greater than 0');
            return;
        }

        setIsSaving(true);

        try {
            const packageData = {
                name: packageName,
                package_type: packageType,
                description,
                destination: {
                    country: destinationCountry,
                    city: destinationCity,
                },
                duration: {
                    nights,
                    days: nights + 1,
                },
                accommodation: accommodations.map(a => ({
                    hotel_name: a.hotel_name,
                    room_name: a.room_name,
                    nights: a.nights,
                    day_start: a.day_start,
                    board_type: a.board_type,
                    price_per_night: a.price_per_night,
                })),
                transfers: transfers.map(t => ({
                    type: t.type,
                    description: t.description,
                    from_location: t.from_location,
                    to_location: t.to_location,
                    vehicle_type: t.vehicle_type,
                    day: t.day,
                    price: t.price,
                    included: t.included,
                })),
                activities: activities.map(a => ({
                    name: a.name,
                    description: a.description,
                    day: a.day,
                    duration_hours: a.duration_hours,
                    location: a.location,
                    price: a.price,
                    included: a.included,
                })),
                pricing: {
                    currency: 'EUR',
                    price_adult: priceAdult,
                    price_child: priceChild,
                    single_supplement: singleSupplement,
                    includes_transfers: true,
                    includes_activities: true,
                },
                valid_from: validFrom || new Date().toISOString(),
                valid_to: validTo || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                status: publish ? 'active' : 'draft',
            };

            // TODO: API call
            console.log('Package data:', packageData);
            toast.success(publish ? 'Package published!' : 'Package saved as draft');
        } catch (error) {
            toast.error('Failed to save package');
        } finally {
            setIsSaving(false);
        }
    };

    const packageTypes = [
        { value: 'city_break', label: 'City Break' },
        { value: 'beach', label: 'Beach Holiday' },
        { value: 'cultural', label: 'Cultural Tour' },
        { value: 'adventure', label: 'Adventure' },
        { value: 'wellness', label: 'Wellness & Spa' },
        { value: 'ski', label: 'Ski Holiday' },
        { value: 'cruise', label: 'Cruise' },
        { value: 'custom', label: 'Custom Package' },
    ];

    const boardTypes = [
        { value: 'room_only', label: 'Room Only' },
        { value: 'breakfast', label: 'Breakfast' },
        { value: 'half_board', label: 'Half Board' },
        { value: 'full_board', label: 'Full Board' },
        { value: 'all_inclusive', label: 'All Inclusive' },
    ];

    const transferTypes = [
        { value: 'airport_pickup', label: 'Airport Pickup' },
        { value: 'airport_dropoff', label: 'Airport Drop-off' },
        { value: 'intercity', label: 'Intercity Transfer' },
        { value: 'excursion', label: 'Excursion Transfer' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="w-8 h-8 text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Package Builder</h1>
                    </div>
                    <p className="text-gray-600">Create and customize travel packages for your clients</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                    </Button>
                    <Button variant="primary" onClick={() => handleSave(true)} disabled={isSaving}>
                        <Eye className="w-4 h-4 mr-2" />
                        Publish
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Builder Sections */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <Card className="p-6">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setActiveSection(activeSection === 'basics' ? '' : 'basics')}
                        >
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Star className="w-5 h-5 mr-2 text-purple-600" />
                                Basic Information
                            </h2>
                            {activeSection === 'basics' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>

                        {activeSection === 'basics' && (
                            <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Package Name"
                                        placeholder="e.g. Berlin City Explorer"
                                        value={packageName}
                                        onChange={(e) => setPackageName(e.target.value)}
                                        required
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
                                        <select
                                            value={packageType}
                                            onChange={(e) => setPackageType(e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                        >
                                            {packageTypes.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Destination Country"
                                        value={destinationCountry}
                                        onChange={(e) => setDestinationCountry(e.target.value)}
                                    />
                                    <Input
                                        label="Destination City"
                                        placeholder="e.g. Berlin"
                                        value={destinationCity}
                                        onChange={(e) => setDestinationCity(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <Input
                                        label="Nights"
                                        type="number"
                                        min={1}
                                        value={nights}
                                        onChange={(e) => setNights(parseInt(e.target.value) || 1)}
                                    />
                                    <Input
                                        label="Valid From"
                                        type="date"
                                        value={validFrom}
                                        onChange={(e) => setValidFrom(e.target.value)}
                                    />
                                    <Input
                                        label="Valid To"
                                        type="date"
                                        value={validTo}
                                        onChange={(e) => setValidTo(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                        rows={3}
                                        placeholder="Describe your package..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Accommodation */}
                    <Card className="p-6">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setActiveSection(activeSection === 'accommodation' ? '' : 'accommodation')}
                        >
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                                Accommodation ({accommodations.length})
                            </h2>
                            {activeSection === 'accommodation' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>

                        {activeSection === 'accommodation' && (
                            <div className="mt-4 space-y-4">
                                {accommodations.map((acc, idx) => (
                                    <div key={acc.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">Hotel #{idx + 1}</span>
                                            <button onClick={() => removeAccommodation(acc.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                label="Hotel Name"
                                                placeholder="e.g. Grand Hotel Berlin"
                                                value={acc.hotel_name}
                                                onChange={(e) => updateAccommodation(acc.id, 'hotel_name', e.target.value)}
                                            />
                                            <Input
                                                label="Room Type"
                                                placeholder="e.g. Deluxe Double"
                                                value={acc.room_name}
                                                onChange={(e) => updateAccommodation(acc.id, 'room_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 gap-3">
                                            <Input
                                                label="Day Start"
                                                type="number"
                                                min={1}
                                                value={acc.day_start}
                                                onChange={(e) => updateAccommodation(acc.id, 'day_start', parseInt(e.target.value) || 1)}
                                            />
                                            <Input
                                                label="Nights"
                                                type="number"
                                                min={1}
                                                value={acc.nights}
                                                onChange={(e) => updateAccommodation(acc.id, 'nights', parseInt(e.target.value) || 1)}
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Board Type</label>
                                                <select
                                                    value={acc.board_type}
                                                    onChange={(e) => updateAccommodation(acc.id, 'board_type', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                >
                                                    {boardTypes.map(b => (
                                                        <option key={b.value} value={b.value}>{b.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <Input
                                                label="€/Night"
                                                type="number"
                                                min={0}
                                                value={acc.price_per_night}
                                                onChange={(e) => updateAccommodation(acc.id, 'price_per_night', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={addAccommodation} className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Accommodation
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* Transfers */}
                    <Card className="p-6">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setActiveSection(activeSection === 'transfers' ? '' : 'transfers')}
                        >
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Car className="w-5 h-5 mr-2 text-green-600" />
                                Transfers ({transfers.length})
                            </h2>
                            {activeSection === 'transfers' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>

                        {activeSection === 'transfers' && (
                            <div className="mt-4 space-y-4">
                                {transfers.map((t, idx) => (
                                    <div key={t.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">Transfer #{idx + 1}</span>
                                            <button onClick={() => removeTransfer(t.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                                <select
                                                    value={t.type}
                                                    onChange={(e) => updateTransfer(t.id, 'type', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                >
                                                    {transferTypes.map(tt => (
                                                        <option key={tt.value} value={tt.value}>{tt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <Input
                                                label="From"
                                                placeholder="e.g. Berlin Airport"
                                                value={t.from_location}
                                                onChange={(e) => updateTransfer(t.id, 'from_location', e.target.value)}
                                            />
                                            <Input
                                                label="To"
                                                placeholder="e.g. Hotel"
                                                value={t.to_location}
                                                onChange={(e) => updateTransfer(t.id, 'to_location', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <Input
                                                label="Day"
                                                type="number"
                                                min={1}
                                                value={t.day}
                                                onChange={(e) => updateTransfer(t.id, 'day', parseInt(e.target.value) || 1)}
                                            />
                                            <Input
                                                label="Price (€)"
                                                type="number"
                                                min={0}
                                                value={t.price}
                                                onChange={(e) => updateTransfer(t.id, 'price', parseFloat(e.target.value) || 0)}
                                            />
                                            <div className="flex items-center pt-6">
                                                <input
                                                    type="checkbox"
                                                    checked={t.included}
                                                    onChange={(e) => updateTransfer(t.id, 'included', e.target.checked)}
                                                    className="w-4 h-4 text-purple-600 rounded"
                                                />
                                                <label className="ml-2 text-sm text-gray-700">Included in price</label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={addTransfer} className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Transfer
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* Activities */}
                    <Card className="p-6">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setActiveSection(activeSection === 'activities' ? '' : 'activities')}
                        >
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                                Activities & Excursions ({activities.length})
                            </h2>
                            {activeSection === 'activities' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>

                        {activeSection === 'activities' && (
                            <div className="mt-4 space-y-4">
                                {activities.map((a, idx) => (
                                    <div key={a.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">Activity #{idx + 1}</span>
                                            <button onClick={() => removeActivity(a.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                label="Activity Name"
                                                placeholder="e.g. City Walking Tour"
                                                value={a.name}
                                                onChange={(e) => updateActivity(a.id, 'name', e.target.value)}
                                            />
                                            <Input
                                                label="Location"
                                                placeholder="e.g. City Center"
                                                value={a.location}
                                                onChange={(e) => updateActivity(a.id, 'location', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 gap-3">
                                            <Input
                                                label="Day"
                                                type="number"
                                                min={1}
                                                value={a.day}
                                                onChange={(e) => updateActivity(a.id, 'day', parseInt(e.target.value) || 1)}
                                            />
                                            <Input
                                                label="Duration (h)"
                                                type="number"
                                                min={0.5}
                                                step={0.5}
                                                value={a.duration_hours}
                                                onChange={(e) => updateActivity(a.id, 'duration_hours', parseFloat(e.target.value) || 1)}
                                            />
                                            <Input
                                                label="Price (€)"
                                                type="number"
                                                min={0}
                                                value={a.price}
                                                onChange={(e) => updateActivity(a.id, 'price', parseFloat(e.target.value) || 0)}
                                            />
                                            <div className="flex items-center pt-6">
                                                <input
                                                    type="checkbox"
                                                    checked={a.included}
                                                    onChange={(e) => updateActivity(a.id, 'included', e.target.checked)}
                                                    className="w-4 h-4 text-purple-600 rounded"
                                                />
                                                <label className="ml-2 text-sm text-gray-700">Included</label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={addActivity} className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Activity
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right: Summary & Pricing */}
                <div className="space-y-6">
                    {/* Pricing */}
                    <Card className="p-6 sticky top-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                            Pricing
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Adult Price (per person)"
                                type="number"
                                min={0}
                                value={priceAdult}
                                onChange={(e) => setPriceAdult(parseFloat(e.target.value) || 0)}
                                required
                            />
                            <Input
                                label="Child Price (per person)"
                                type="number"
                                min={0}
                                value={priceChild}
                                onChange={(e) => setPriceChild(parseFloat(e.target.value) || 0)}
                            />
                            <Input
                                label="Single Supplement"
                                type="number"
                                min={0}
                                value={singleSupplement}
                                onChange={(e) => setSingleSupplement(parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        <div className="mt-6 pt-4 border-t">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Component Costs</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Accommodation</span>
                                    <span className="font-medium">
                                        {formatCurrency(accommodations.reduce((sum, a) => sum + a.price_per_night * a.nights, 0))}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Transfers</span>
                                    <span className="font-medium">
                                        {formatCurrency(transfers.filter(t => t.included).reduce((sum, t) => sum + t.price, 0))}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Activities</span>
                                    <span className="font-medium">
                                        {formatCurrency(activities.filter(a => a.included).reduce((sum, a) => sum + a.price, 0))}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t font-semibold">
                                    <span>Total Cost</span>
                                    <span className="text-purple-600">{formatCurrency(calculateTotal())}</span>
                                </div>
                            </div>
                        </div>

                        {priceAdult > 0 && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-800">
                                    <strong>Profit Margin:</strong>{' '}
                                    {formatCurrency(priceAdult - calculateTotal())} per adult
                                    ({((priceAdult - calculateTotal()) / priceAdult * 100).toFixed(1)}%)
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* Package Summary */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Package className="w-5 h-5 mr-2 text-purple-600" />
                            Package Summary
                        </h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{destinationCity || 'No destination'}, {destinationCountry}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>{nights} Nights / {nights + 1} Days</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span>{accommodations.length} Hotel(s)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-gray-400" />
                                <span>{transfers.length} Transfer(s)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{activities.length} Activity(ies)</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
