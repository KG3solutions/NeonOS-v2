import { Bell, Search, Menu, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth, usePendingCount } from '../state';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const pendingCount = usePendingCount();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="
      bg-slate-900
      border-b border-slate-800
      px-6 py-4
      flex items-center justify-between
      gap-4
    ">
      {/* Left side - Menu & Title */}
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-400 hover:text-emerald-400"
          >
            <Menu size={20} />
          </button>
        )}

        <h1 className="text-xl font-mono text-emerald-400 tracking-wide">
          {title}
        </h1>
      </div>

      {/* Center - Search */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory, rentals, diagrams..."
            className="
              w-full
              bg-slate-800/50
              border border-slate-700
              rounded-lg
              pl-10 pr-4 py-2
              font-mono text-sm text-slate-200
              placeholder:text-slate-600
              focus:outline-none focus:border-emerald-500/50
              transition-colors
            "
          />
        </div>
      </div>

      {/* Right side - Notifications & User */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-emerald-400 transition-colors">
          <Bell size={20} />
          {pendingCount > 0 && (
            <span className="
              absolute -top-1 -right-1
              w-5 h-5
              bg-amber-500
              text-black
              text-xs
              font-bold
              rounded-full
              flex items-center justify-center
            ">
              {pendingCount}
            </span>
          )}
        </button>

        {/* User Avatar & Menu */}
        <div className="relative" ref={menuRef}>
          {/* Mobile Avatar Button */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="sm:hidden p-1"
          >
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-8 h-8 rounded-full border border-emerald-500/30"
            />
          </button>

          {/* Desktop Avatar Button */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="hidden sm:flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-8 h-8 rounded-full border border-emerald-500/30"
            />
            <span className="text-slate-300 font-mono text-sm">
              {user?.name}
            </span>
            <ChevronDown size={14} className={`text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="
              absolute right-0 top-full mt-2
              w-64
              bg-slate-900
              border border-slate-700
              rounded-lg
              shadow-xl
              overflow-hidden
              z-50
            ">
              {/* User Info */}
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-10 h-10 rounded-full border border-emerald-500/30"
                  />
                  <div>
                    <div className="font-mono text-emerald-100">{user?.name}</div>
                    <div className="font-mono text-xs text-slate-500">{user?.email}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`
                    text-xs font-mono px-2 py-0.5 rounded
                    ${user?.role === 'owner' ? 'bg-amber-500/20 text-amber-400' : ''}
                    ${user?.role === 'manager' ? 'bg-cyan-500/20 text-cyan-400' : ''}
                    ${user?.role === 'staff' ? 'bg-slate-500/20 text-slate-400' : ''}
                  `}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button className="
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-slate-300 hover:bg-slate-800/50
                  font-mono text-sm
                  transition-colors
                ">
                  <User size={16} className="text-slate-500" />
                  Profile
                </button>
                <button className="
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-slate-300 hover:bg-slate-800/50
                  font-mono text-sm
                  transition-colors
                ">
                  <Settings size={16} className="text-slate-500" />
                  Preferences
                </button>
              </div>

              {/* Sign Out */}
              <div className="py-1 border-t border-slate-700">
                <button className="
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-red-400 hover:bg-red-500/10
                  font-mono text-sm
                  transition-colors
                ">
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
