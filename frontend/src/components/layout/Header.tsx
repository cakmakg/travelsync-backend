import { Bell, Menu } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { toggleSidebar } from '@/store/slices/uiSlice';

export default function Header() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
          <span className="text-sm font-semibold text-white">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
