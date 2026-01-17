import { useState } from 'react';
import Card from '@/components/common/Card';
import { useAuth } from '@/hooks/useAuth';
import {
    Settings,
    Building2,
    User,
    Bell,
    Shield,
    Globe,
    CreditCard,
    Mail,
    Phone,
    MapPin,
    Clock,
    Save,
    Camera,
    Key,
    Users,
    Plus,
    Edit3,
    Trash2
} from 'lucide-react';

export default function SettingsPage() {
    const { user, organization } = useAuth();
    const [activeTab, setActiveTab] = useState('organization');

    // Mock users data
    const users = [
        { id: '1', name: 'Admin User', email: 'admin@hotel.com', role: 'admin', status: 'active' },
        { id: '2', name: 'Front Desk', email: 'frontdesk@hotel.com', role: 'staff', status: 'active' },
        { id: '3', name: 'Manager', email: 'manager@hotel.com', role: 'manager', status: 'active' },
    ];

    const tabs = [
        { id: 'organization', label: 'Organization', icon: Building2 },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard },
    ];

    return (
        <div>
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-8 h-8 text-gray-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                </div>
                <p className="text-gray-600">Manage your hotel settings and preferences</p>
            </div>

            <div className="flex gap-8">
                {/* Sidebar */}
                <div className="w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                                        ? 'bg-primary-50 text-primary-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'organization' && (
                        <Card title="Organization Settings" subtitle="Manage your hotel information">
                            <div className="space-y-6 pt-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Hotel Name
                                        </label>
                                        <input
                                            type="text"
                                            defaultValue={organization?.name || 'Grand Hotel Berlin'}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Hotel Type
                                        </label>
                                        <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                                            <option>Hotel</option>
                                            <option>Resort</option>
                                            <option>Boutique Hotel</option>
                                            <option>Apartment Hotel</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Mail className="w-4 h-4 inline mr-1" />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            defaultValue="contact@grandhotel.de"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Phone className="w-4 h-4 inline mr-1" />
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            defaultValue="+49 30 123456"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MapPin className="w-4 h-4 inline mr-1" />
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue="Unter den Linden 77, 10117 Berlin, Germany"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            Timezone
                                        </label>
                                        <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                                            <option>Europe/Berlin (UTC+1)</option>
                                            <option>Europe/London (UTC)</option>
                                            <option>America/New_York (UTC-5)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Currency
                                        </label>
                                        <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                                            <option>EUR (€)</option>
                                            <option>USD ($)</option>
                                            <option>GBP (£)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Globe className="w-4 h-4 inline mr-1" />
                                            Language
                                        </label>
                                        <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                                            <option>Deutsch</option>
                                            <option>English</option>
                                            <option>Türkçe</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'profile' && (
                        <Card title="Profile Settings" subtitle="Manage your personal information">
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold">
                                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                                        </div>
                                        <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700">
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {user?.first_name} {user?.last_name}
                                        </h3>
                                        <p className="text-gray-500">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            defaultValue={user?.first_name}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            defaultValue={user?.last_name}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        defaultValue={user?.email}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        defaultValue={user?.phone || ''}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                        <Save className="w-4 h-4" />
                                        Save Profile
                                    </button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'users' && (
                        <Card title="User Management" subtitle="Manage team members and roles">
                            <div className="pt-4">
                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-sm text-gray-600">{users.length} users in your organization</p>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                        <Plus className="w-4 h-4" />
                                        Add User
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {users.map((u) => (
                                        <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                                                    {u.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{u.name}</p>
                                                    <p className="text-sm text-gray-500">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                        u.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                                <button className="p-2 hover:bg-gray-200 rounded-lg">
                                                    <Edit3 className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button className="p-2 hover:bg-red-50 rounded-lg">
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card title="Notification Settings" subtitle="Configure how you receive notifications">
                            <div className="space-y-6 pt-4">
                                {[
                                    { title: 'New Reservations', desc: 'Get notified when a new booking is made', enabled: true },
                                    { title: 'Check-in Reminders', desc: 'Daily summary of today\'s arrivals', enabled: true },
                                    { title: 'Check-out Reminders', desc: 'Daily summary of today\'s departures', enabled: true },
                                    { title: 'Cancellations', desc: 'Immediate notification for cancellations', enabled: true },
                                    { title: 'Agency Messages', desc: 'Messages from partner agencies', enabled: false },
                                    { title: 'System Updates', desc: 'Important platform updates and news', enabled: false },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.title}</p>
                                            <p className="text-sm text-gray-500">{item.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card title="Security Settings" subtitle="Manage your account security">
                            <div className="space-y-6 pt-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                                            <Key className="w-6 h-6 text-yellow-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">Change Password</h4>
                                            <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                                        </div>
                                        <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                                            Update
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                            <Shield className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                                            <p className="text-sm text-gray-500">Add an extra layer of security</p>
                                        </div>
                                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                            Enable
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'billing' && (
                        <Card title="Billing & Subscription" subtitle="Manage your subscription plan">
                            <div className="pt-4">
                                <div className="p-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white mb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-primary-100">Current Plan</p>
                                            <h3 className="text-2xl font-bold mt-1">Professional</h3>
                                            <p className="text-primary-100 mt-2">€99/month • Renews on Feb 1, 2026</p>
                                        </div>
                                        <button className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors">
                                            Upgrade Plan
                                        </button>
                                    </div>
                                </div>

                                <h4 className="font-medium text-gray-900 mb-4">Plan Features</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        'Unlimited properties',
                                        'Unlimited users',
                                        'API access',
                                        'Priority support',
                                        'Advanced analytics',
                                        'Custom branding',
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-gray-600">
                                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                                <span className="text-green-600 text-xs">✓</span>
                                            </div>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
