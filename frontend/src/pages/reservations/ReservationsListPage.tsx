import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Calendar,
  Filter,
  MoreVertical,
  Eye,
  LogIn,
  LogOut,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { reservationsApi } from '../../api';
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '../../lib/utils';
import type { Reservation, ReservationStatus } from '../../types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

export function ReservationsListPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  async function fetchReservations() {
    try {
      setIsLoading(true);
      let response;
      if (statusFilter) {
        response = await reservationsApi.getByStatus(statusFilter as ReservationStatus);
      } else {
        response = await reservationsApi.getAll();
      }
      if (response.success && response.data) {
        setReservations(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredReservations = reservations.filter(
    (res) =>
      res.guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.booking_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.guest.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckIn = async (id: string) => {
    try {
      await reservationsApi.checkIn(id);
      toast.success('Guest checked in successfully');
      fetchReservations();
    } catch (error) {
      toast.error('Failed to check in guest');
    }
    setOpenMenu(null);
  };

  const handleCheckOut = async (id: string) => {
    try {
      await reservationsApi.checkOut(id);
      toast.success('Guest checked out successfully');
      fetchReservations();
    } catch (error) {
      toast.error('Failed to check out guest');
    }
    setOpenMenu(null);
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Please provide a cancellation reason:');
    if (!reason) return;

    try {
      await reservationsApi.cancel(id, reason);
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (error) {
      toast.error('Failed to cancel reservation');
    }
    setOpenMenu(null);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reservations</h1>
          <p className="mt-1 text-gray-500">Manage your bookings and guest check-ins</p>
        </div>
        <Link to="/reservations/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Reservation</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {reservations.filter((r) => r.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {reservations.filter((r) => r.status === 'confirmed').length}
                </p>
                <p className="text-sm text-gray-500">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <LogIn className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {reservations.filter((r) => r.status === 'checked_in').length}
                </p>
                <p className="text-sm text-gray-500">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <LogOut className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {reservations.filter((r) => r.status === 'checked_out').length}
                </p>
                <p className="text-sm text-gray-500">Checked Out</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search by guest name, email, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Reservations Table */}
      <Card>
        <CardContent className="p-0">
          {filteredReservations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Guest</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Reference</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Check-in</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Check-out</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nights</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                            {reservation.guest.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{reservation.guest.name}</p>
                            <p className="text-sm text-gray-500">{reservation.guest.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-600">
                          {reservation.booking_reference}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(reservation.check_in_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(reservation.check_out_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{reservation.nights}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(reservation.total_with_tax, reservation.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                            reservation.status
                          )}`}
                        >
                          {getStatusLabel(reservation.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenu(openMenu === reservation._id ? null : reservation._id)
                            }
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenu === reservation._id && (
                            <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                              <Link
                                to={`/reservations/${reservation._id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                              {reservation.status === 'confirmed' && (
                                <button
                                  onClick={() => handleCheckIn(reservation._id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                                >
                                  <LogIn className="h-4 w-4" />
                                  Check In
                                </button>
                              )}
                              {reservation.status === 'checked_in' && (
                                <button
                                  onClick={() => handleCheckOut(reservation._id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                >
                                  <LogOut className="h-4 w-4" />
                                  Check Out
                                </button>
                              )}
                              {['pending', 'confirmed'].includes(reservation.status) && (
                                <button
                                  onClick={() => handleCancel(reservation._id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<Calendar className="h-12 w-12" />}
              title="No reservations found"
              description={
                searchQuery || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first reservation to get started'
              }
              action={
                !searchQuery &&
                !statusFilter && (
                  <Link to="/reservations/new">
                    <Button leftIcon={<Plus className="h-4 w-4" />}>New Reservation</Button>
                  </Link>
                )
              }
              className="py-12"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
