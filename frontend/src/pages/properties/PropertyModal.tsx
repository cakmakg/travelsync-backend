import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { createProperty, updateProperty } from '@/store/slices/propertiesSlice';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Property } from '@/types';

const propertySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code must be at most 10 characters'),
  description: z.string().optional(),
  total_rooms: z.number().min(1, 'Total rooms is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().length(2, 'Country code must be 2 characters'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().optional(),
  star_rating: z.number().min(1).max(5).optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

const COUNTRIES = [
  { code: 'DE', name: 'Germany' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TR', name: 'Turkey' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'GR', name: 'Greece' },
  { code: 'PT', name: 'Portugal' },
];

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'TRY'];

const TIMEZONES = [
  'Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich', 'Europe/Istanbul',
  'Europe/Madrid', 'Europe/Rome', 'Europe/Paris', 'Europe/London'
];

export default function PropertyModal({ isOpen, onClose, property }: PropertyModalProps) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.properties);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      total_rooms: 10,
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'DE',
      phone: '',
      email: '',
      website: '',
      star_rating: 4,
      check_in_time: '15:00',
      check_out_time: '11:00',
      timezone: 'Europe/Berlin',
      currency: 'EUR',
    },
  });

  useEffect(() => {
    if (property) {
      setValue('name', property.name);
      setValue('code', property.code);
      setValue('description', property.description || '');
      setValue('total_rooms', property.total_rooms || 10);
      setValue('street', property.address?.street || '');
      setValue('city', property.address?.city || '');
      setValue('state', property.address?.state || '');
      setValue('postal_code', property.address?.postal_code || '');
      setValue('country', property.address?.country || 'DE');
      setValue('phone', property.contact?.phone || '');
      setValue('email', property.contact?.email || '');
      setValue('website', property.contact?.website || '');
      setValue('star_rating', property.star_rating || 4);
      setValue('check_in_time', property.policies?.check_in_time || '15:00');
      setValue('check_out_time', property.policies?.check_out_time || '11:00');
      setValue('timezone', property.settings?.timezone || 'Europe/Berlin');
      setValue('currency', property.settings?.currency || 'EUR');
    } else {
      reset();
    }
  }, [property, setValue, reset]);

  const onSubmit = async (data: PropertyFormData) => {
    const formattedData = {
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
      total_rooms: data.total_rooms,
      address: {
        street: data.street,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        country: data.country,
      },
      contact: {
        phone: data.phone,
        email: data.email,
        website: data.website,
      },
      star_rating: data.star_rating,
      policies: {
        check_in_time: data.check_in_time,
        check_out_time: data.check_out_time,
      },
      settings: {
        timezone: data.timezone,
        currency: data.currency,
      },
    };

    try {
      if (property) {
        await dispatch(updateProperty({ id: property._id, data: formattedData })).unwrap();
        toast.success('Property updated successfully');
      } else {
        await dispatch(createProperty(formattedData)).unwrap();
        toast.success('Property created successfully');
      }
      onClose();
    } catch (error: any) {
      toast.error(error || 'Failed to save property');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {property ? 'Edit Property' : 'Add Property'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Property Name"
                    placeholder="e.g. Grand Hotel Berlin"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                </div>
                <div>
                  <Input
                    label="Code"
                    placeholder="e.g. GHB"
                    {...register('code')}
                    error={errors.code?.message}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Brief description of your property..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating</label>
                  <select
                    {...register('star_rating', { valueAsNumber: true })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <option key={star} value={star}>
                        {'★'.repeat(star)} ({star} Star)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Input
                    label="Total Rooms"
                    type="number"
                    placeholder="e.g. 50"
                    {...register('total_rooms', { valueAsNumber: true })}
                    error={errors.total_rooms?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    {...register('currency')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Address</h3>

              <div>
                <Input
                  label="Street"
                  placeholder="e.g. Friedrichstrasse 123"
                  {...register('street')}
                  error={errors.street?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="City"
                    placeholder="e.g. Berlin"
                    {...register('city')}
                    error={errors.city?.message}
                  />
                </div>
                <div>
                  <Input
                    label="State/Region"
                    placeholder="e.g. Berlin"
                    {...register('state')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Postal Code"
                    placeholder="e.g. 10117"
                    {...register('postal_code')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('country')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>{country.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Contact Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Phone"
                    placeholder="e.g. +49 30 123456"
                    {...register('phone')}
                  />
                </div>
                <div>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="e.g. info@hotel.com"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>
              </div>

              <div>
                <Input
                  label="Website"
                  placeholder="e.g. https://www.hotel.com"
                  {...register('website')}
                />
              </div>
            </div>

            {/* Policies */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Policies & Settings</h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
                  <input
                    type="time"
                    {...register('check_in_time')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Time</label>
                  <input
                    type="time"
                    {...register('check_out_time')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    {...register('timezone')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : property ? 'Update Property' : 'Create Property'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
