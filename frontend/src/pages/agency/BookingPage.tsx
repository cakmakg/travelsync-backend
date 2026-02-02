import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { createReservation } from '@/store/slices/reservationsSlice';
import {
    ArrowLeft,
    Building2,
    Calendar,
    Users,
    CreditCard,
    Check,
    User,
    FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AgencyBookingPage() {
    const [searchParams] = useSearchParams();
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state) => state.reservations);

    // URL'den parametreleri al
    const hotelId = searchParams.get('hotel') || '';
    const roomId = searchParams.get('room') || '';
    const checkIn = searchParams.get('checkIn') || '';
    const checkOut = searchParams.get('checkOut') || '';
    const adults = parseInt(searchParams.get('adults') || '2');
    const children = parseInt(searchParams.get('children') || '0');

    // Mock hotel/room bilgisi (gerçek API entegrasyonu sonra yapılabilir)
    const [hotelInfo] = useState({
        name: 'Partner Hotel',
        roomName: 'Standard Room',
        pricePerNight: 120,
    });

    // Guest form state
    const [guestInfo, setGuestInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        notes: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [bookingRef, setBookingRef] = useState('');

    // Hesaplamalar
    const getNights = () => {
        if (!checkIn || !checkOut) return 1;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    };

    const nights = getNights();
    const subtotal = hotelInfo.pricePerNight * nights;
    const tax = subtotal * 0.19; // 19% VAT
    const total = subtotal + tax;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleInputChange = (field: string, value: string) => {
        setGuestInfo((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        if (!guestInfo.firstName.trim()) {
            toast.error('First name is required');
            return false;
        }
        if (!guestInfo.lastName.trim()) {
            toast.error('Last name is required');
            return false;
        }
        if (!guestInfo.email.trim() || !guestInfo.email.includes('@')) {
            toast.error('Valid email is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const reservationData = {
                property_id: hotelId,
                room_type_id: roomId,
                check_in_date: checkIn,
                check_out_date: checkOut,
                guests: {
                    adults,
                    children,
                },
                guest: {
                    name: `${guestInfo.firstName} ${guestInfo.lastName}`,
                    email: guestInfo.email,
                    phone: guestInfo.phone || undefined,
                },
                notes: guestInfo.notes || undefined,
                source: 'AGENCY',
                status: 'pending',
                currency: 'EUR',
                total_price: subtotal,
                total_with_tax: total,
            };

            const result = await dispatch(createReservation(reservationData)).unwrap();

            setBookingRef(result?.booking_reference || 'BK-' + Date.now().toString(36).toUpperCase());
            setIsSuccess(true);
            toast.success('Booking submitted for hotel approval!');
        } catch (error: any) {
            toast.error(error || 'Failed to create booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success Screen
    if (isSuccess) {
        return (
            <div className="max-w-2xl mx-auto">
                <Card className="p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Submitted!</h1>
                    <p className="text-gray-600 mb-6">
                        Your booking request has been sent to the hotel for approval.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-500">Booking Reference</p>
                        <p className="text-xl font-mono font-bold text-primary-600">{bookingRef}</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-yellow-800">
                            <strong>Status: Pending Approval</strong>
                            <br />
                            The hotel will review and approve or reject this booking. You will be notified once a decision is made.
                        </p>
                    </div>

                    <div className="flex justify-center space-x-4">
                        <Link to="/agency/bookings">
                            <Button variant="primary">View My Bookings</Button>
                        </Link>
                        <Link to="/agency/search">
                            <Button variant="outline">Search More Hotels</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Link to="/agency/search">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Search
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Complete Booking</h1>
                    <p className="text-gray-600">Enter guest details to submit booking for approval</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Booking Summary */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Building2 className="w-5 h-5 mr-2 text-primary-600" />
                            Booking Summary
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Hotel</p>
                                <p className="font-medium">{hotelInfo.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Room Type</p>
                                <p className="font-medium">{hotelInfo.roomName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Check-in</p>
                                <p className="font-medium flex items-center">
                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                    {formatDate(checkIn)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Check-out</p>
                                <p className="font-medium flex items-center">
                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                    {formatDate(checkOut)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Guests</p>
                                <p className="font-medium flex items-center">
                                    <Users className="w-4 h-4 mr-1 text-gray-400" />
                                    {adults} Adult{adults > 1 ? 's' : ''}
                                    {children > 0 && `, ${children} Child${children > 1 ? 'ren' : ''}`}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Duration</p>
                                <p className="font-medium">{nights} Night{nights > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Guest Information */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2 text-primary-600" />
                            Guest Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                placeholder="John"
                                value={guestInfo.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                required
                            />
                            <Input
                                label="Last Name"
                                placeholder="Smith"
                                value={guestInfo.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                required
                            />
                            <Input
                                label="Email"
                                type="email"
                                placeholder="john.smith@email.com"
                                value={guestInfo.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                required
                            />
                            <Input
                                label="Phone (Optional)"
                                type="tel"
                                placeholder="+49 123 456 7890"
                                value={guestInfo.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Special Requests (Optional)
                            </label>
                            <textarea
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                rows={3}
                                placeholder="e.g. Late check-in, room preference..."
                                value={guestInfo.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                            />
                        </div>
                    </Card>
                </div>

                {/* Right: Price Summary */}
                <div className="space-y-6">
                    <Card className="p-6 sticky top-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <CreditCard className="w-5 h-5 mr-2 text-primary-600" />
                            Price Summary
                        </h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    {formatCurrency(hotelInfo.pricePerNight)} x {nights} night{nights > 1 ? 's' : ''}
                                </span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">VAT (19%)</span>
                                <span className="font-medium">{formatCurrency(tax)}</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-primary-600">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="mt-6 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                            <FileText className="w-4 h-4 inline mr-1" />
                            This booking will be sent to the hotel for <strong>approval</strong>. Payment will be processed after confirmation.
                        </div>

                        <Button
                            variant="primary"
                            className="w-full mt-6"
                            onClick={handleSubmit}
                            disabled={isSubmitting || loading}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                        </Button>

                        <p className="text-xs text-gray-500 text-center mt-3">
                            By submitting, you agree to our terms and conditions.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
