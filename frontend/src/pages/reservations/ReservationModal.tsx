import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { createReservation, fetchReservations } from '@/store/slices/reservationsSlice';
import { fetchRoomTypes } from '@/store/slices/roomTypesSlice';
import { fetchProperties } from '@/store/slices/propertiesSlice';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { X, Calendar, Users, User, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const reservationSchema = z.object({
    property_id: z.string().min(1, 'Property is required'),
    room_type_id: z.string().min(1, 'Room type is required'),
    guest_name: z.string().min(2, 'Guest name must be at least 2 characters'),
    guest_email: z.string().email('Valid email is required'),
    guest_phone: z.string().min(5, 'Phone number is required'),
    check_in_date: z.string().min(1, 'Check-in date is required'),
    check_out_date: z.string().min(1, 'Check-out date is required'),
    adults: z.number().min(1, 'At least 1 adult required').max(10),
    children: z.number().min(0).max(10),
    infants: z.number().min(0).max(5),
    rooms_requested: z.number().min(1, 'At least 1 room required').max(10),
    source: z.enum(['direct', 'phone', 'email', 'ota', 'agency']),
    special_requests: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

interface ReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BOOKING_SOURCES = [
    { value: 'direct', label: 'Direct Booking' },
    { value: 'phone', label: 'Phone' },
    { value: 'email', label: 'Email' },
    { value: 'ota', label: 'OTA (Booking.com, etc.)' },
    { value: 'agency', label: 'Travel Agency' },
];

export default function ReservationModal({ isOpen, onClose }: ReservationModalProps) {
    const dispatch = useAppDispatch();
    const { properties } = useAppSelector((state) => state.properties);
    const { roomTypes } = useAppSelector((state) => state.roomTypes);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<ReservationFormData>({
        resolver: zodResolver(reservationSchema),
        defaultValues: {
            adults: 2,
            children: 0,
            infants: 0,
            rooms_requested: 1,
            source: 'direct',
        },
    });

    const watchPropertyId = watch('property_id');

    // Load properties on mount
    useEffect(() => {
        if (isOpen) {
            dispatch(fetchProperties({}));
        }
    }, [isOpen, dispatch]);

    // Load room types when property changes
    useEffect(() => {
        if (watchPropertyId && watchPropertyId !== selectedPropertyId) {
            setSelectedPropertyId(watchPropertyId);
            dispatch(fetchRoomTypes({ property_id: watchPropertyId }));
        }
    }, [watchPropertyId, selectedPropertyId, dispatch]);

    // Filter room types for selected property
    const filteredRoomTypes = roomTypes.filter(rt => rt.property_id === watchPropertyId);

    const onSubmit = async (data: ReservationFormData) => {
        setIsSubmitting(true);
        try {
            const reservationData = {
                property_id: data.property_id,
                room_type_id: data.room_type_id,
                guest: {
                    name: data.guest_name,
                    email: data.guest_email,
                    phone: data.guest_phone,
                },
                check_in_date: data.check_in_date,
                check_out_date: data.check_out_date,
                guests: {
                    adults: data.adults,
                    children: data.children,
                    infants: data.infants,
                },
                rooms_requested: data.rooms_requested,
                source: data.source,
                special_requests: data.special_requests || '',
            };

            await dispatch(createReservation(reservationData)).unwrap();
            toast.success('Reservation created successfully!');
            dispatch(fetchReservations({}));
            reset();
            onClose();
        } catch (error: any) {
            toast.error(error || 'Failed to create reservation');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!isOpen) return null;

    // Get today's date in YYYY-MM-DD format for min date
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">New Reservation</h2>
                                <p className="text-sm text-gray-500">Create a new booking</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                        {/* Property & Room Type Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Property *
                                </label>
                                <select
                                    {...register('property_id')}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">Select property</option>
                                    {properties.map((property) => (
                                        <option key={property._id} value={property._id}>
                                            {property.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.property_id && (
                                    <p className="text-sm text-red-500 mt-1">{errors.property_id.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Room Type *
                                </label>
                                <select
                                    {...register('room_type_id')}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    disabled={!watchPropertyId}
                                >
                                    <option value="">Select room type</option>
                                    {filteredRoomTypes.map((roomType) => (
                                        <option key={roomType._id} value={roomType._id}>
                                            {roomType.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.room_type_id && (
                                    <p className="text-sm text-red-500 mt-1">{errors.room_type_id.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Guest Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-gray-400" />
                                Guest Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label="Guest Name *"
                                    {...register('guest_name')}
                                    error={errors.guest_name?.message}
                                    placeholder="John Doe"
                                />
                                <div className="relative">
                                    <Input
                                        label="Email *"
                                        type="email"
                                        {...register('guest_email')}
                                        error={errors.guest_email?.message}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="relative">
                                    <Input
                                        label="Phone *"
                                        {...register('guest_phone')}
                                        error={errors.guest_phone?.message}
                                        placeholder="+49 123 456 7890"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                Stay Dates
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Check-in Date *"
                                    type="date"
                                    {...register('check_in_date')}
                                    error={errors.check_in_date?.message}
                                    min={today}
                                />
                                <Input
                                    label="Check-out Date *"
                                    type="date"
                                    {...register('check_out_date')}
                                    error={errors.check_out_date?.message}
                                    min={today}
                                />
                            </div>
                        </div>

                        {/* Guests & Rooms */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-400" />
                                Guests & Rooms
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Input
                                    label="Adults *"
                                    type="number"
                                    {...register('adults', { valueAsNumber: true })}
                                    error={errors.adults?.message}
                                    min={1}
                                    max={10}
                                />
                                <Input
                                    label="Children"
                                    type="number"
                                    {...register('children', { valueAsNumber: true })}
                                    error={errors.children?.message}
                                    min={0}
                                    max={10}
                                />
                                <Input
                                    label="Infants"
                                    type="number"
                                    {...register('infants', { valueAsNumber: true })}
                                    error={errors.infants?.message}
                                    min={0}
                                    max={5}
                                />
                                <Input
                                    label="Rooms *"
                                    type="number"
                                    {...register('rooms_requested', { valueAsNumber: true })}
                                    error={errors.rooms_requested?.message}
                                    min={1}
                                    max={10}
                                />
                            </div>
                        </div>

                        {/* Booking Source */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Booking Source
                            </label>
                            <select
                                {...register('source')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                {BOOKING_SOURCES.map((source) => (
                                    <option key={source.value} value={source.value}>
                                        {source.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Special Requests */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <MessageSquare className="w-4 h-4 inline mr-1" />
                                Special Requests
                            </label>
                            <textarea
                                {...register('special_requests')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                                placeholder="Any special requests or notes..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                            >
                                Create Reservation
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
