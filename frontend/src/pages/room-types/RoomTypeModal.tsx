import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { createRoomType, updateRoomType } from '@/store/slices/roomTypesSlice';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { RoomType, Property } from '@/types';

const roomTypeSchema = z.object({
  property_id: z.string().min(1, 'Property is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code must be at most 10 characters'),
  description: z.string().optional(),
  max_adults: z.number().min(1, 'At least 1 adult required').max(10),
  max_children: z.number().min(0).max(10),
  max_infants: z.number().min(0).max(5),
  bed_configuration: z.string().min(1, 'Bed configuration is required'),
  size_sqm: z.number().min(0).optional(),
  total_quantity: z.number().min(1, 'At least 1 room required'),
  amenities: z.string().optional(),
});

type RoomTypeFormData = z.infer<typeof roomTypeSchema>;

interface RoomTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomType: RoomType | null;
  properties: Property[];
  selectedPropertyId?: string;
}

const BED_CONFIGURATIONS = [
  '1 King Bed',
  '1 Queen Bed',
  '2 Single Beds',
  '1 Double Bed',
  '1 King Bed + 1 Sofa Bed',
  '2 Queen Beds',
  '1 King Bed + 2 Single Beds',
];

const COMMON_AMENITIES = [
  { label: 'WiFi', value: 'wifi' },
  { label: 'Air Conditioning', value: 'air_conditioning' },
  { label: 'TV', value: 'tv' },
  { label: 'Mini Bar', value: 'minibar' },
  { label: 'Safe', value: 'safe' },
  { label: 'Balcony', value: 'balcony' },
  { label: 'Sea View', value: 'sea_view' },
  { label: 'City View', value: 'city_view' },
  { label: 'Bathtub', value: 'bathtub' },
  { label: 'Shower', value: 'shower' },
  { label: 'Hair Dryer', value: 'hairdryer' },
  { label: 'Coffee Machine', value: 'coffee_machine' },
];

export default function RoomTypeModal({
  isOpen,
  onClose,
  roomType,
  properties,
  selectedPropertyId,
}: RoomTypeModalProps) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.roomTypes);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RoomTypeFormData>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      property_id: selectedPropertyId || '',
      name: '',
      code: '',
      description: '',
      max_adults: 2,
      max_children: 0,
      max_infants: 0,
      bed_configuration: '1 King Bed',
      size_sqm: 0,
      total_quantity: 1,
      amenities: '',
    },
  });

  useEffect(() => {
    if (roomType) {
      setValue('property_id', roomType.property_id);
      setValue('name', roomType.name);
      setValue('code', roomType.code);
      setValue('description', roomType.description || '');
      setValue('max_adults', roomType.max_occupancy.adults);
      setValue('max_children', roomType.max_occupancy.children);
      setValue('max_infants', roomType.max_occupancy.infants);
      setValue('bed_configuration', roomType.bed_configuration);
      setValue('size_sqm', roomType.size_sqm || 0);
      setValue('total_quantity', roomType.total_quantity);
      setValue('amenities', roomType.amenities?.join(', ') || '');
    } else {
      reset({
        property_id: selectedPropertyId || '',
        name: '',
        code: '',
        description: '',
        max_adults: 2,
        max_children: 0,
        max_infants: 0,
        bed_configuration: '1 King Bed',
        size_sqm: 0,
        total_quantity: 1,
        amenities: '',
      });
    }
  }, [roomType, selectedPropertyId, setValue, reset]);

  const onSubmit = async (data: RoomTypeFormData) => {
    const formattedData = {
      property_id: data.property_id,
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
      capacity: {
        adults: data.max_adults,
        children: data.max_children,
      },
      bed_configuration: data.bed_configuration,
      size_sqm: data.size_sqm || undefined,
      total_quantity: data.total_quantity,
      amenities: data.amenities
        ? data.amenities.split(',').map((a) => a.trim().toLowerCase().replace(/\s+/g, '_')).filter(Boolean)
        : [],
    };

    try {
      if (roomType) {
        await dispatch(updateRoomType({ id: roomType._id, data: formattedData })).unwrap();
        toast.success('Room type updated successfully');
      } else {
        await dispatch(createRoomType(formattedData)).unwrap();
        toast.success('Room type created successfully');
      }
      onClose();
    } catch (error: any) {
      toast.error(error || 'Failed to save room type');
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
              {roomType ? 'Edit Room Type' : 'Add Room Type'}
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
            {/* Property Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property <span className="text-red-500">*</span>
              </label>
              <select
                {...register('property_id')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!!roomType}
              >
                <option value="">Select a property</option>
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

            {/* Name & Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Room Type Name"
                  placeholder="e.g. Deluxe Double Room"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>
              <div>
                <Input
                  label="Code"
                  placeholder="e.g. DLX"
                  {...register('code')}
                  error={errors.code?.message}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe this room type..."
              />
            </div>

            {/* Occupancy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Max Occupancy</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Adults</label>
                  <input
                    type="number"
                    {...register('max_adults', { valueAsNumber: true })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min={1}
                    max={10}
                  />
                  {errors.max_adults && (
                    <p className="text-xs text-red-500 mt-1">{errors.max_adults.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Children</label>
                  <input
                    type="number"
                    {...register('max_children', { valueAsNumber: true })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min={0}
                    max={10}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Infants</label>
                  <input
                    type="number"
                    {...register('max_infants', { valueAsNumber: true })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min={0}
                    max={5}
                  />
                </div>
              </div>
            </div>

            {/* Bed Configuration & Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bed Configuration <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('bed_configuration')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {BED_CONFIGURATIONS.map((config) => (
                    <option key={config} value={config}>
                      {config}
                    </option>
                  ))}
                </select>
                {errors.bed_configuration && (
                  <p className="text-sm text-red-500 mt-1">{errors.bed_configuration.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size (m²)</label>
                <input
                  type="number"
                  {...register('size_sqm', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min={0}
                  placeholder="e.g. 35"
                />
              </div>
            </div>

            {/* Total Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Rooms <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register('total_quantity', { valueAsNumber: true })}
                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                min={1}
                placeholder="Number of rooms of this type"
              />
              {errors.total_quantity && (
                <p className="text-sm text-red-500 mt-1">{errors.total_quantity.message}</p>
              )}
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
              <textarea
                {...register('amenities')}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="WiFi, Air Conditioning, TV, Mini Bar..."
              />
              <p className="text-xs text-gray-500 mt-1">Separate amenities with commas</p>

              {/* Quick add amenities */}
              <div className="flex flex-wrap gap-1 mt-2">
                {COMMON_AMENITIES.slice(0, 6).map((amenity) => (
                  <button
                    key={amenity.value}
                    type="button"
                    onClick={() => {
                      const current = (document.querySelector('textarea[name="amenities"]') as HTMLTextAreaElement)?.value || '';
                      const amenities = current ? current.split(',').map(a => a.trim()) : [];
                      if (!amenities.includes(amenity.value)) {
                        amenities.push(amenity.value);
                        setValue('amenities', amenities.join(', '));
                      }
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                  >
                    + {amenity.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : roomType ? 'Update Room Type' : 'Create Room Type'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
