import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Calendar,
  DollarSign,
  Package,
  Users,
  Building,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'Room Types', href: '/room-types', icon: BedDouble },
  { name: 'Reservations', href: '/reservations', icon: Calendar },
  { name: 'Pricing', href: '/pricing', icon: DollarSign },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Agencies', href: '/agencies', icon: Building, roles: ['admin', 'manager'] },
  { name: 'Contracts', href: '/contracts', icon: FileText, roles: ['admin', 'manager'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['admin', 'manager'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'manager'] },
];

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {!isCollapsed && (
          <span className="text-xl font-bold text-primary-600">TravelSync</span>
        )}
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                isCollapsed && 'justify-center px-2'
              )
            }
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 p-3">
        {bottomNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                isCollapsed && 'justify-center px-2'
              )
            }
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.name}</span>}
          </NavLink>
        ))}

        <button
          onClick={() => logout()}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-700',
            isCollapsed && 'justify-center px-2'
          )}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div className={cn('border-t border-gray-200 p-3', isCollapsed && 'flex justify-center')}>
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2',
              isCollapsed && 'px-2'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
              {user.first_name?.[0]}
              {user.last_name?.[0]}
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
                <p className="truncate text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
