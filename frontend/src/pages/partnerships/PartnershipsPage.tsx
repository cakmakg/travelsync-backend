import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Link2, UserPlus, Check, X, Pause, Play, Trash2, Building2, Mail } from 'lucide-react';
import api from '@/services/api';

interface Partnership {
    _id: string;
    hotel_org_id: { _id: string; name: string; country: string } | null;
    agency_org_id: { _id: string; name: string; country: string } | null;
    status: 'pending' | 'active' | 'suspended' | 'terminated';
    invited_by: 'hotel' | 'agency';
    invitation_email?: string;
    default_commission: { rate: number; type: string };
    partnership_start?: string;
    createdAt: string;
}

export default function PartnershipsPage() {
    const [partnerships, setPartnerships] = useState<Partnership[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [commissionRate, setCommissionRate] = useState(10);

    useEffect(() => {
        fetchPartnerships();
    }, []);

    const fetchPartnerships = async () => {
        try {
            const response = await api.get('/partnerships');
            setPartnerships(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch partnerships:', error);
            toast.error('Failed to load partnerships');
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        try {
            await api.post('/partnerships/invite', {
                partner_email: inviteEmail,
                commission_rate: commissionRate,
            });
            toast.success('Invitation sent successfully');
            setShowInviteModal(false);
            setInviteEmail('');
            fetchPartnerships();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to send invitation');
        }
    };

    const handleAction = async (id: string, action: string) => {
        try {
            await api.put(`/partnerships/${id}/${action}`);
            toast.success(`Partnership ${action}ed successfully`);
            fetchPartnerships();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || `Failed to ${action} partnership`);
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

    const getPartnerInfo = (partnership: Partnership) => {
        // For hotels, show agency info; for agencies, show hotel info
        return partnership.agency_org_id || partnership.hotel_org_id;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Partner Agencies</h1>
                    <p className="text-gray-600 mt-2">Manage your B2B connections with travel agencies</p>
                </div>
                <Button variant="primary" onClick={() => setShowInviteModal(true)} className="flex items-center space-x-2">
                    <UserPlus className="w-5 h-5" />
                    <span>Invite Agency</span>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Link2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Partners</p>
                            <p className="text-2xl font-bold">{partnerships.filter(p => p.status === 'active').length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Mail className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Invites</p>
                            <p className="text-2xl font-bold">{partnerships.filter(p => p.status === 'pending').length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Pause className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Suspended</p>
                            <p className="text-2xl font-bold">{partnerships.filter(p => p.status === 'suspended').length}</p>
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

            {/* Partnerships List */}
            {partnerships.length === 0 ? (
                <Card className="p-12 text-center">
                    <Link2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Partner Agencies Yet</h3>
                    <p className="text-gray-500 mb-4">Start building your B2B network by inviting travel agencies</p>
                    <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Your First Agency
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    {partnerships.map((partnership) => {
                        const partner = getPartnerInfo(partnership);
                        return (
                            <Card key={partnership._id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {partner?.name || partnership.invitation_email || 'Pending Partner'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {partner?.country || 'Invitation sent'} • Commission: {partnership.default_commission.rate}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {getStatusBadge(partnership.status)}

                                        {/* Actions based on status */}
                                        {partnership.status === 'pending' && partnership.invited_by === 'agency' && (
                                            <>
                                                <Button size="sm" variant="primary" onClick={() => handleAction(partnership._id, 'accept')}>
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleAction(partnership._id, 'reject')}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}

                                        {partnership.status === 'active' && (
                                            <Button size="sm" variant="outline" onClick={() => handleAction(partnership._id, 'suspend')}>
                                                <Pause className="w-4 h-4" />
                                            </Button>
                                        )}

                                        {partnership.status === 'suspended' && (
                                            <Button size="sm" variant="outline" onClick={() => handleAction(partnership._id, 'reactivate')}>
                                                <Play className="w-4 h-4" />
                                            </Button>
                                        )}

                                        {partnership.status !== 'terminated' && (
                                            <Button size="sm" variant="danger" onClick={() => handleAction(partnership._id, 'terminate')}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/50" onClick={() => setShowInviteModal(false)} />
                        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <h2 className="text-xl font-semibold mb-4">Invite Agency Partner</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Agency Email</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="agency@example.com"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Commission Rate (%)</label>
                                    <input
                                        type="number"
                                        value={commissionRate}
                                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                                        min={0}
                                        max={50}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleInvite}>Send Invitation</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
