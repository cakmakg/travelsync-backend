import { useEffect, useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import {
    Building2,
    Link2,
    Plus,
    Check,
    X,
    Clock,
    MapPin,
    Percent
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

interface Partnership {
    _id: string;
    hotel_org_id: { _id: string; name: string; country: string; contact?: { email?: string } } | null;
    status: 'pending' | 'active' | 'suspended' | 'terminated';
    invited_by: 'hotel' | 'agency';
    default_commission: { rate: number; type: string };
    partnership_start?: string;
    createdAt: string;
}

export default function AgencyPartnersPage() {
    const [partnerships, setPartnerships] = useState<Partnership[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    useEffect(() => {
        fetchPartnerships();
    }, []);

    const fetchPartnerships = async () => {
        try {
            const response = await api.get('/partnerships');
            setPartnerships(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch partnerships:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        try {
            await api.post('/partnerships/invite', {
                partner_email: inviteEmail,
            });
            toast.success('Invitation sent successfully');
            setShowInviteModal(false);
            setInviteEmail('');
            fetchPartnerships();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to send invitation');
        }
    };

    const handleAccept = async (id: string) => {
        try {
            await api.put(`/partnerships/${id}/accept`);
            toast.success('Partnership accepted');
            fetchPartnerships();
        } catch (error) {
            toast.error('Failed to accept partnership');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            active: 'bg-green-100 text-green-800',
            suspended: 'bg-orange-100 text-orange-800',
            terminated: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const activePartners = partnerships.filter((p) => p.status === 'active');
    const pendingPartners = partnerships.filter((p) => p.status === 'pending');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Partner Hotels</h1>
                    <p className="text-gray-600 mt-2">Manage your hotel partnerships</p>
                </div>
                <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Hotel
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Link2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Partners</p>
                            <p className="text-2xl font-bold">{activePartners.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Invites</p>
                            <p className="text-2xl font-bold">{pendingPartners.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Partners</p>
                            <p className="text-2xl font-bold">{partnerships.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Pending Invitations */}
            {pendingPartners.filter(p => p.invited_by === 'hotel').length > 0 && (
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                        Pending Invitations from Hotels
                    </h2>
                    <div className="space-y-3">
                        {pendingPartners
                            .filter((p) => p.invited_by === 'hotel')
                            .map((partnership) => (
                                <div
                                    key={partnership._id}
                                    className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-yellow-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {partnership.hotel_org_id?.name || 'Hotel'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {partnership.default_commission.rate}% commission offered
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button size="sm" variant="primary" onClick={() => handleAccept(partnership._id)}>
                                            <Check className="w-4 h-4 mr-1" /> Accept
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </Card>
            )}

            {/* Active Partners */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Active Hotel Partners</h2>
                {activePartners.length === 0 ? (
                    <div className="text-center py-12">
                        <Link2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Partners</h3>
                        <p className="text-gray-500 mb-4">Start by inviting hotels to partner with you</p>
                        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                            Invite Your First Hotel
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activePartners.map((partnership) => (
                            <div key={partnership._id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">
                                            {partnership.hotel_org_id?.name || 'Hotel'}
                                        </h3>
                                        <p className="text-sm text-gray-500 flex items-center">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            {partnership.hotel_org_id?.country || 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center text-green-600">
                                        <Percent className="w-4 h-4 mr-1" />
                                        {partnership.default_commission.rate}% commission
                                    </span>
                                    {getStatusBadge(partnership.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/50" onClick={() => setShowInviteModal(false)} />
                        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <h2 className="text-xl font-semibold mb-4">Invite Hotel Partner</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Email</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="hotel@example.com"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleInvite}>
                                    Send Invitation
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
