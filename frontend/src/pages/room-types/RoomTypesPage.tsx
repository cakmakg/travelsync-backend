import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchRoomTypes, deleteRoomType, toggleRoomTypeActive } from '@/store/slices/roomTypesSlice';
import { fetchProperties } from '@/store/slices/propertiesSlice';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Bed, Plus, Edit2, Trash2, Users, Maximize2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import RoomTypeModal from './RoomTypeModal';
import { RoomType } from '@/types';

export default function RoomTypesPage() {
  const dispatch = useAppDispatch();
  const { roomTypes, loading } = useAppSelector((state) => state.roomTypes);
  const { properties } = useAppSelector((state) => state.properties);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  useEffect(() => {
    if (selectedPropertyId) {
      dispatch(fetchRoomTypes({ property_id: selectedPropertyId }));
    } else {
      dispatch(fetchRoomTypes());
    }
  }, [dispatch, selectedPropertyId]);

  const handleAddNew = () => {
    setEditingRoomType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (roomType: RoomType) => {
    setEditingRoomType(roomType);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteRoomType(id)).unwrap();
      toast.success('Room type deleted successfully');
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error || 'Failed to delete room type');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await dispatch(toggleRoomTypeActive(id)).unwrap();
      toast.success('Status updated successfully');
    } catch (error: any) {
      toast.error(error || 'Failed to update status');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoomType(null);
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p) => p._id === propertyId);
    return property?.name || 'Unknown Property';
  };

  if (loading && roomTypes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading room types...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Room Types</h1>
          <p className="text-gray-600 mt-2">Manage your room types and configurations</p>
        </div>
        <Button variant="primary" onClick={handleAddNew} className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Room Type</span>
        </Button>
      </div>

      {/* Property Filter */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Property:</label>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="flex-1 max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Properties</option>
            {properties.map((property) => (
              <option key={property._id} value={property._id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Room Types Grid */}
      {roomTypes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Bed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No room types yet</h3>
            <p className="text-gray-600 mb-6">
              {selectedPropertyId
                ? 'No room types found for this property. Add your first room type.'
                : 'Get started by adding your first room type'}
            </p>
            <Button variant="primary" onClick={handleAddNew} className="inline-flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add Room Type</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((roomType) => (
            <Card key={roomType._id}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{roomType.name}</h3>
                    <p className="text-sm text-gray-500">{roomType.code}</p>
                  </div>
                  <button
                    onClick={() => handleToggleActive(roomType._id)}
                    className={`p-1 rounded transition-colors ${
                      roomType.is_active ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'
                    }`}
                    title={roomType.is_active ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                  >
                    {roomType.is_active ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>

                {/* Property Name */}
                {!selectedPropertyId && (
                  <p className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full inline-block">
                    {getPropertyName(roomType.property_id)}
                  </p>
                )}

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      Max: {roomType.max_occupancy.adults} adults
                      {roomType.max_occupancy.children > 0 && `, ${roomType.max_occupancy.children} children`}
                    </span>
                  </div>

                  {roomType.size_sqm && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Maximize2 className="w-4 h-4" />
                      <span>{roomType.size_sqm} m²</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Bed className="w-4 h-4" />
                    <span>{roomType.bed_configuration}</span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{roomType.total_quantity}</span> rooms available
                  </div>
                </div>

                {/* Amenities */}
                {roomType.amenities && roomType.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {roomType.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {roomType.amenities.length > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{roomType.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(roomType)}
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>

                  {deleteConfirm === roomType._id ? (
                    <div className="flex-1 flex items-center space-x-1">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(roomType._id)}
                        className="flex-1"
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(roomType._id)}
                      className="flex-1 flex items-center justify-center space-x-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <RoomTypeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        roomType={editingRoomType}
        properties={properties}
        selectedPropertyId={selectedPropertyId}
      />
    </div>
  );
}
