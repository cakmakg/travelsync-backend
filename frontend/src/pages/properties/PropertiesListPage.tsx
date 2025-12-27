import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Star, BedDouble, Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { propertiesApi } from '../../api';
import { getStarRating } from '../../lib/utils';
import type { Property } from '../../types';

export function PropertiesListPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await propertiesApi.getAll();
        if (response.success && response.data) {
          setProperties(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProperties();
  }, []);

  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      await propertiesApi.delete(id);
      setProperties(properties.filter((p) => p._id !== id));
    } catch (error) {
      console.error('Failed to delete property:', error);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
          <p className="mt-1 text-gray-500">Manage your hotels and properties</p>
        </div>
        <Link to="/properties/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add Property</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          type="search"
          placeholder="Search properties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Properties Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <Card key={property._id} className="group overflow-hidden">
              {/* Property Image */}
              <div className="relative h-48 bg-gray-100">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BedDouble className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <Badge variant={property.is_active ? 'success' : 'default'}>
                    {property.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/properties/${property._id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {property.name}
                    </Link>
                    <p className="text-sm text-gray-500">{property.code}</p>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === property._id ? null : property._id)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {openMenu === property._id && (
                      <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                        <Link
                          to={`/properties/${property._id}/edit`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(property._id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 text-sm text-yellow-500">
                  {getStarRating(property.star_rating)}
                  <span className="ml-1 text-gray-500">
                    {property.property_type}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {property.address.city}, {property.address.country}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{property.total_rooms}</span>
                    <span className="text-gray-500"> rooms</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {property.check_in_time} - {property.check_out_time}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BedDouble className="h-12 w-12" />}
          title="No properties found"
          description={
            searchQuery
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first property'
          }
          action={
            !searchQuery && (
              <Link to="/properties/new">
                <Button leftIcon={<Plus className="h-4 w-4" />}>Add Property</Button>
              </Link>
            )
          }
        />
      )}
    </div>
  );
}
