import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Building2,
  Bed,
  DollarSign,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Zap,
  FileText,
  Briefcase,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

// Hotel navigation items
const hotelNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'Reservations', href: '/reservations', icon: CalendarDays },
  { name: 'Room Types', href: '/room-types', icon: Bed },
  { name: 'Pricing', href: '/pricing', icon: DollarSign },
  { name: 'Agencies', href: '/agencies', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Agency navigation items
const agencyNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Flash Offers', href: '/flash-offers', icon: Zap },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Reservations', href: '/reservations', icon: CalendarDays },
  { name: 'Hotels', href: '/hotels', icon: Building2 },
  { name: 'Commission', href: '/commission', icon: DollarSign },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Super Admin navigation items
const superAdminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: Shield },
  { name: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, organization, logout } = useAuth();

  // Get navigation based on user role and organization type
  const isSuperAdmin = user?.role === 'super_admin';
  const isAgency = organization?.type === 'AGENCY';
  const navigation = isSuperAdmin ? superAdminNavigation : isAgency ? agencyNavigation : hotelNavigation;

  return (
    <div className="flex flex-col h-screen w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-800">
        <h1 className="text-2xl font-bold">TravelSync</h1>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isSuperAdmin ? "bg-red-600" : isAgency ? "bg-purple-600" : "bg-primary-600"
          )}>
            {isSuperAdmin ? (
              <Shield className="w-5 h-5" />
            ) : isAgency ? (
              <Briefcase className="w-5 h-5" />
            ) : (
              <span className="text-lg font-semibold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {isSuperAdmin ? 'System Administrator' : organization?.name || user?.email}
            </p>
          </div>
        </div>
        {/* User Type Badge */}
        <div className="mt-3">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
            isSuperAdmin
              ? "bg-red-500/20 text-red-300"
              : isAgency
                ? "bg-purple-500/20 text-purple-300"
                : "bg-green-500/20 text-green-300"
          )}>
            {isSuperAdmin ? (
              <>
                <Shield className="w-3 h-3" />
                Super Admin
              </>
            ) : isAgency ? (
              <>
                <Briefcase className="w-3 h-3" />
                Travel Agency
              </>
            ) : (
              <>
                <Building2 className="w-3 h-3" />
                Hotel
              </>
            )}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? isAgency ? 'bg-purple-600 text-white' : 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => logout()}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
