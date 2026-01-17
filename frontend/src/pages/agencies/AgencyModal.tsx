import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { X, Briefcase, Phone, Percent } from 'lucide-react';
import { toast } from 'sonner';

const agencySchema = z.object({
    name: z.string().min(2, 'Agency name must be at least 2 characters'),
    code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code must be at most 10 characters'),
    type: z.enum(['TOUR_OPERATOR', 'OTA', 'CORPORATE', 'DMC', 'INDEPENDENT']),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(5, 'Phone number is required'),
    website: z.string().optional(),
    country: z.string().min(2, 'Country is required'),
    commission: z.number().min(0, 'Commission cannot be negative').max(50, 'Commission cannot exceed 50%'),
    contact_person: z.string().optional(),
    notes: z.string().optional(),
});

type AgencyFormData = z.infer<typeof agencySchema>;

interface AgencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (agency: AgencyFormData) => void;
}

const AGENCY_TYPES = [
    { value: 'TOUR_OPERATOR', label: 'Tour Operator' },
    { value: 'OTA', label: 'OTA (Online Travel Agency)' },
    { value: 'CORPORATE', label: 'Corporate Client' },
    { value: 'DMC', label: 'DMC (Destination Management)' },
    { value: 'INDEPENDENT', label: 'Independent Agent' },
];

const COUNTRIES = [
    'Germany', 'Austria', 'Switzerland', 'Netherlands', 'Belgium',
    'France', 'United Kingdom', 'Italy', 'Spain', 'Poland',
    'Czech Republic', 'Turkey', 'United States', 'Other'
];

export default function AgencyModal({ isOpen, onClose, onSuccess }: AgencyModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AgencyFormData>({
        resolver: zodResolver(agencySchema),
        defaultValues: {
            type: 'TOUR_OPERATOR',
            commission: 10,
        },
    });

    const onSubmit = async (data: AgencyFormData) => {
        setIsSubmitting(true);
        try {
            // TODO: Replace with actual API call
            // await agencyService.create(data);

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 500));

            toast.success('Agency partnership created successfully!');
            onSuccess?.(data);
            reset();
            onClose();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to create agency partnership');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Add Agency Partnership</h2>
                                <p className="text-sm text-gray-500">Create a new agency contract</p>
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
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Agency Name *"
                                    {...register('name')}
                                    error={errors.name?.message}
                                    placeholder="TUI Group"
                                />
                                <Input
                                    label="Code *"
                                    {...register('code')}
                                    error={errors.code?.message}
                                    placeholder="TUI"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Agency Type *
                                    </label>
                                    <select
                                        {...register('type')}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {AGENCY_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.type && (
                                        <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Country *
                                    </label>
                                    <select
                                        {...register('country')}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select country</option>
                                        {COUNTRIES.map((country) => (
                                            <option key={country} value={country}>
                                                {country}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.country && (
                                        <p className="text-sm text-red-500 mt-1">{errors.country.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-gray-400" />
                                Contact Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Email *"
                                    type="email"
                                    {...register('email')}
                                    error={errors.email?.message}
                                    placeholder="bookings@agency.com"
                                />
                                <Input
                                    label="Phone *"
                                    {...register('phone')}
                                    error={errors.phone?.message}
                                    placeholder="+49 30 123456"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Input
                                        label="Website"
                                        {...register('website')}
                                        error={errors.website?.message}
                                        placeholder="www.agency.com"
                                    />
                                </div>
                                <Input
                                    label="Contact Person"
                                    {...register('contact_person')}
                                    error={errors.contact_person?.message}
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        {/* Commission */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Percent className="w-5 h-5 text-gray-400" />
                                Commission Rate
                            </h3>
                            <div className="max-w-xs">
                                <Input
                                    label="Commission % *"
                                    type="number"
                                    {...register('commission', { valueAsNumber: true })}
                                    error={errors.commission?.message}
                                    min={0}
                                    max={50}
                                    step={0.5}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Standard commission rate for this agency partner
                                </p>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                {...register('notes')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                                placeholder="Additional notes about this partnership..."
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
                                Add Agency
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
