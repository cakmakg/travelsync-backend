import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchProperties } from '@/store/slices/propertiesSlice';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Building2, MapPin, Plus } from 'lucide-react';

export default function PropertiesPage() {
  const dispatch = useAppDispatch();
  const { properties, loading } = useAppSelector((state) => state.properties);

  useEffect(() => {
    dispatch(fetchProperties());
  }, [dispatch]);

  if (loading) {
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
        <Button variant="primary" className="flex items-center space-x-2">
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
            <Button variant="primary" className="inline-flex items-center space-x-2">
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
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    property.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {property.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{property.address.city}, {property.address.country}</span>
                </div>

                {property.star_rating && (
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: property.star_rating }).map((_, i) => (
                      <span key={i} className="text-yellow-500">★</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1">
                    Manage
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
