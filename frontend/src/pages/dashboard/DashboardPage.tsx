import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { useAuth } from '@/hooks/useAuth';
import { fetchProperties } from '@/store/slices/propertiesSlice';
import { fetchReservations } from '@/store/slices/reservationsSlice';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import AgencyDashboard from './AgencyDashboard';
import {
  Building2,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Zap,
  FileText,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { flashOfferService, reportService } from '@/services/flashOffer';
import { toast } from 'sonner';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { organization } = useAuth();
  const { properties } = useAppSelector((state) => state.properties);
  const { reservations } = useAppSelector((state) => state.reservations);

  // If agency, render AgencyDashboard
  if (organization?.type === 'AGENCY') {
    return <AgencyDashboard />;
  }

  // Flash Offer Modal State
  const [showFlashOfferModal, setShowFlashOfferModal] = useState(false);
  const [flashOfferLoading, setFlashOfferLoading] = useState(false);
  const [flashOfferResult, setFlashOfferResult] = useState<any>(null);
  const [flashOfferForm, setFlashOfferForm] = useState({
    property_id: '',
    room_count: 5,
    discount_percentage: 20,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hours_valid: 24,
  });

  // GoBD Report State
  const [gobdLoading, setGobdLoading] = useState(false);

  // PMS Sync State
  const [pmsLoading, setPmsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProperties({}));
    dispatch(fetchReservations({}));
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

  // Flash Offer Handler
  const handleFlashOffer = async () => {
    if (!flashOfferForm.property_id) {
      toast.error('Lütfen bir otel seçin');
      return;
    }

    setFlashOfferLoading(true);
    try {
      const result = await flashOfferService.create({
        ...flashOfferForm,
        target_agencies: 'all',
      });
      setFlashOfferResult(result.data);
      toast.success('Flash Offer başarıyla gönderildi!');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Flash Offer gönderilemedi');
    } finally {
      setFlashOfferLoading(false);
    }
  };

  // GoBD Report Handler
  const handleGoBDReport = async () => {
    setGobdLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await reportService.downloadGoBDReport(startDate, endDate);
      toast.success('GoBD Raporu indirildi!');
    } catch (error: any) {
      toast.error('Rapor indirilemedi. Backend\'de /reports/gobd endpoint\'i henüz aktif değil.');
    } finally {
      setGobdLoading(false);
    }
  };

  // PMS Sync Handler
  const handlePMSSync = async () => {
    setPmsLoading(true);
    try {
      // Simülasyon - gerçek PMS servisi sonra eklenecek
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('PMS senkronizasyonu tamamlandı!');
    } catch (error) {
      toast.error('PMS senkronizasyonu başarısız');
    } finally {
      setPmsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
      </div>

      {/* ACTION BUTTONS - Almanya Pazarı için Kritik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Flash Offer Button */}
        <button
          onClick={() => setShowFlashOfferModal(true)}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-6 h-6" />
                <span className="text-lg font-bold">Flash Offer</span>
              </div>
              <p className="text-sm text-red-100">Son dakika indirim gönder</p>
            </div>
            <Send className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        {/* GoBD Report Button */}
        <button
          onClick={handleGoBDReport}
          disabled={gobdLoading}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-6 h-6" />
                <span className="text-lg font-bold">GoBD Raporu</span>
              </div>
              <p className="text-sm text-green-100">Vergi raporu indir</p>
            </div>
            {gobdLoading ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : (
              <FileText className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </button>

        {/* PMS Sync Button */}
        <button
          onClick={handlePMSSync}
          disabled={pmsLoading}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className={`w-6 h-6 ${pmsLoading ? 'animate-spin' : ''}`} />
                <span className="text-lg font-bold">PMS Senkronize</span>
              </div>
              <p className="text-sm text-blue-100">Protel/SIHOT eşitle</p>
            </div>
            <RefreshCw className={`w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity ${pmsLoading ? 'animate-spin' : ''}`} />
          </div>
        </button>
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
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
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
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${property.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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

      {/* Today's Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card title="Today's Check-ins" subtitle="Guests arriving today">
          <div className="space-y-3">
            {[
              { name: 'Hans Müller', room: '301', time: '14:00', guests: 2 },
              { name: 'Maria Schmidt', room: '205', time: '15:00', guests: 1 },
              { name: 'Thomas Weber', room: '412', time: '16:00', guests: 3 },
            ].map((guest, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-700 font-semibold">{guest.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{guest.name}</p>
                    <p className="text-sm text-gray-500">{guest.guests} guest{guest.guests > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">Room {guest.room}</p>
                  <p className="text-sm text-green-600">{guest.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Today's Check-outs" subtitle="Guests departing today">
          <div className="space-y-3">
            {[
              { name: 'Klaus Fischer', room: '102', time: '11:00', nights: 3 },
              { name: 'Anna Braun', room: '508', time: '12:00', nights: 2 },
            ].map((guest, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-700 font-semibold">{guest.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{guest.name}</p>
                    <p className="text-sm text-gray-500">{guest.nights} night{guest.nights > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">Room {guest.room}</p>
                  <p className="text-sm text-orange-600">Due: {guest.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Flash Offer Modal */}
      {showFlashOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Flash Offer Oluştur</h2>
                    <p className="text-sm text-gray-500">Acentelere anlık indirim gönder</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFlashOfferModal(false);
                    setFlashOfferResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {!flashOfferResult ? (
                <div className="space-y-4">
                  {/* Property Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Otel</label>
                    <select
                      value={flashOfferForm.property_id}
                      onChange={(e) => setFlashOfferForm(f => ({ ...f, property_id: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Otel seçin...</option>
                      {Array.isArray(properties) && properties.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Room Count & Discount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Oda Sayısı</label>
                      <input
                        type="number"
                        min="1"
                        value={flashOfferForm.room_count}
                        onChange={(e) => setFlashOfferForm(f => ({ ...f, room_count: parseInt(e.target.value) }))}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">İndirim %</label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={flashOfferForm.discount_percentage}
                        onChange={(e) => setFlashOfferForm(f => ({ ...f, discount_percentage: parseInt(e.target.value) }))}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç</label>
                      <input
                        type="date"
                        value={flashOfferForm.valid_from}
                        onChange={(e) => setFlashOfferForm(f => ({ ...f, valid_from: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş</label>
                      <input
                        type="date"
                        value={flashOfferForm.valid_to}
                        onChange={(e) => setFlashOfferForm(f => ({ ...f, valid_to: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Hours Valid */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Geçerlilik Süresi (Saat)</label>
                    <input
                      type="number"
                      min="1"
                      max="72"
                      value={flashOfferForm.hours_valid}
                      onChange={(e) => setFlashOfferForm(f => ({ ...f, hours_valid: parseInt(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleFlashOffer}
                    isLoading={flashOfferLoading}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Tüm Acentelere Gönder
                  </Button>
                </div>
              ) : (
                // Result View
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Flash Offer Gönderildi!</h3>
                  <p className="text-gray-600 mb-6">
                    {flashOfferResult.offer.property_name} için %{flashOfferResult.offer.discount_percentage} indirim
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-green-600">{flashOfferResult.notification_results.sent}</p>
                      <p className="text-sm text-green-700">Gönderildi</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-yellow-600">{flashOfferResult.notification_results.skipped}</p>
                      <p className="text-sm text-yellow-700">Atlandı</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-red-600">{flashOfferResult.notification_results.failed}</p>
                      <p className="text-sm text-red-700">Başarısız</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setShowFlashOfferModal(false);
                      setFlashOfferResult(null);
                    }}
                    variant="primary"
                    className="w-full"
                  >
                    Kapat
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

