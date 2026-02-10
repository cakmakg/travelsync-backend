import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchProperties, deleteProperty } from '@/store/slices/propertiesSlice';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Building2, MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import PropertyModal from './PropertyModal';
import { Property } from '@/types';

export default function PropertiesPage() {
  const dispatch = useAppDispatch();
  const { properties, loading } = useAppSelector((state) => state.properties);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProperties({}));
  }, [dispatch]);

  const handleAddNew = () => {
    setEditingProperty(null);
    setIsModalOpen(true);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteProperty(id)).unwrap();
      toast.success('Property deleted successfully');
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error || 'Failed to delete property');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProperty(null);
  };

  if (loading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-2">Manage your hotel properties</p>
        </div>
        <Button variant="primary" onClick={handleAddNew} className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Property</span>
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first property</p>
            <Button variant="primary" onClick={handleAddNew} className="inline-flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add Property</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property._id}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                    <p className="text-sm text-gray-500">{property.code}</p>
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${property.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {property.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{property.address?.city}, {property.address?.country}</span>
                </div>

                {property.star_rating && (
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: property.star_rating }).map((_, i) => (
                      <span key={i} className="text-yellow-500">★</span>
                    ))}
                  </div>
                )}

                {property.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{property.description}</p>
                )}

                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(property)}
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>

                  {deleteConfirm === property._id ? (
                    <div className="flex-1 flex items-center space-x-1">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(property._id)}
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
                      onClick={() => setDeleteConfirm(property._id)}
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
      <PropertyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        property={editingProperty}
      />
    </div>
  );
}
