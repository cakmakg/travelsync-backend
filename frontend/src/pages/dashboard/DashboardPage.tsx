import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchProperties } from '@/store/slices/propertiesSlice';
import { fetchReservations } from '@/store/slices/reservationsSlice';
import Card from '@/components/common/Card';
import { Building2, CalendarDays, DollarSign, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { properties } = useAppSelector((state) => state.properties);
  const { reservations } = useAppSelector((state) => state.reservations);

  useEffect(() => {
    dispatch(fetchProperties());
    dispatch(fetchReservations());
  }, [dispatch]);

  const stats = [
    {
      name: 'Total Properties',
      value: Array.isArray(properties) ? properties.length : 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Reservations',
      value: Array.isArray(reservations) ? reservations.filter((r) => r.status === 'confirmed').length : 0,
      icon: CalendarDays,
      color: 'bg-green-500',
    },
    {
      name: 'Revenue (This Month)',
      value: `€${Array.isArray(reservations) ? reservations.reduce((sum, r) => sum + (r.total_with_tax || 0), 0).toLocaleString() : '0'}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
    {
      name: 'Occupancy Rate',
      value: '75%',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Reservations" subtitle="Latest bookings">
          <div className="space-y-4">
            {Array.isArray(reservations) && reservations.slice(0, 5).map((reservation) => (
              <div key={reservation._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{reservation.guest.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(reservation.check_in_date).toLocaleDateString()} - {new Date(reservation.check_out_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">€{reservation.total_with_tax}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {reservation.status}
                  </span>
                </div>
              </div>
            ))}
            {(!Array.isArray(reservations) || reservations.length === 0) && (
              <p className="text-center text-gray-500 py-8">No reservations yet</p>
            )}
          </div>
        </Card>

        <Card title="Properties" subtitle="Your hotel properties">
          <div className="space-y-4">
            {Array.isArray(properties) && properties.slice(0, 5).map((property) => (
              <div key={property._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{property.name}</p>
                    <p className="text-sm text-gray-500">{property.address.city}, {property.address.country}</p>
                  </div>
                </div>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  property.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {property.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
            {(!Array.isArray(properties) || properties.length === 0) && (
              <p className="text-center text-gray-500 py-8">No properties yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
