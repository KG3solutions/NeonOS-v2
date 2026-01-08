import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Plus,
  Package,
  Cable,
  Calendar,
  Tag,
  Users,
  LogOut,
  PackageCheck,
  Barcode,
  Clock,
  Play,
  Square,
  Wrench,
  BookOpen,
  ClipboardList,
  Settings
} from 'lucide-react';
import { useAuth, usePermission, usePendingCount, useLogout, useTimeClock } from '../state';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  permission?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Plus, label: 'New Item', path: '/new-item', permission: 'inventory.add' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: PackageCheck, label: 'Receive', path: '/receive', permission: 'inventory.add' },
  { icon: Barcode, label: 'Scanner', path: '/scan' },
  { icon: Cable, label: 'Wire Diagrams', path: '/wire-diagrams' },
  { icon: Calendar, label: 'Jobs', path: '/jobs' },
  { icon: Wrench, label: 'Builder', path: '/builder' },
  { icon: BookOpen, label: 'Recipes', path: '/recipes' },
  { icon: Tag, label: 'Labels', path: '/labels' },
  { icon: ClipboardList, label: 'Timesheets', path: '/timesheets' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

// Helper function to format elapsed time
function formatElapsedTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const pendingCount = usePendingCount();
  const logout = useLogout();
  const { isClockedIn, clockIn, clockOut, getElapsedMinutes } = useTimeClock();

  // Update elapsed time every minute
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  useEffect(() => {
    if (isClockedIn) {
      setElapsedMinutes(getElapsedMinutes());
      const interval = setInterval(() => {
        setElapsedMinutes(getElapsedMinutes());
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isClockedIn, getElapsedMinutes]);

  const filteredNavItems = navItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission as any);
  });

  return (
    <aside className="
      w-56
      bg-slate-950
      border-r-2 border-slate-800
      min-h-screen
      p-4
      flex flex-col
    ">
      {/* Logo - Industrial style */}
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 led-indicator" />
          <h1 className="font-mono text-blue-400 text-xl tracking-widest font-bold">
            NEON<span className="text-amber-400">OS</span>
          </h1>
        </div>
        <p className="text-slate-600 text-xs font-mono tracking-widest uppercase pl-4">
          Control System
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {filteredNavItems.map(item => {
          // Compare base path without query params
          const currentBasePath = currentPath.split('?')[0];
          const isActive = currentBasePath === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`
                w-full
                flex items-center gap-3
                px-3 py-2.5
                rounded-sm
                font-mono text-sm
                transition-all
                ${isActive
                  ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500 pl-[10px]'
                  : 'text-slate-400 hover:text-blue-400 hover:bg-slate-900 border-l-2 border-transparent'
                }
              `}
            >
              <Icon size={18} />
              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}

        {/* User Management - Owner Only */}
        {hasPermission('users.manage') && (
          <button
            onClick={() => onNavigate('/users')}
            className={`
              w-full
              flex items-center gap-3
              px-3 py-2.5
              rounded-sm
              font-mono text-sm
              transition-all
              ${currentPath.split('?')[0] === '/users'
                ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500 pl-[10px]'
                : 'text-slate-400 hover:text-blue-400 hover:bg-slate-900 border-l-2 border-transparent'
              }
            `}
          >
            <Users size={18} />
            <span className="flex-1 text-left tracking-wide">Users</span>
            {pendingCount > 0 && (
              <span className="
                min-w-5 h-5
                px-1.5
                bg-amber-500
                text-black
                text-xs
                font-bold
                rounded-sm
                flex items-center justify-center
              ">
                {pendingCount}
              </span>
            )}
          </button>
        )}
      </nav>

      {/* User section at bottom */}
      <div className="pt-4 border-t-2 border-slate-800 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-3 px-2">
          <div className="relative">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-8 h-8 rounded-sm border border-slate-700"
            />
            <div className={`
              absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-950
              ${isClockedIn ? 'bg-emerald-500' : 'bg-slate-600'}
            `} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-slate-200 font-mono text-sm truncate font-semibold">
              {user?.name}
            </div>
            <div className="text-slate-500 text-xs font-mono capitalize tracking-wide">
              {user?.role}
            </div>
          </div>
        </div>

        {/* Time Clock - Industrial panel */}
        <div className="px-2">
          {isClockedIn ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 px-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 led-indicator" />
                <Clock size={14} />
                <span className="font-mono text-sm font-semibold tabular-nums">{formatElapsedTime(elapsedMinutes)}</span>
              </div>
              <button
                onClick={clockOut}
                className="
                  w-full
                  flex items-center justify-center gap-2
                  px-3 py-2
                  rounded-sm
                  font-mono text-sm font-semibold
                  bg-red-500/10 border-2 border-red-500/50
                  text-red-400 hover:bg-red-500/20 hover:border-red-500
                  transition-all
                  uppercase tracking-wider
                "
              >
                <Square size={14} />
                Clock Out
              </button>
            </div>
          ) : (
            <button
              onClick={clockIn}
              className="
                w-full
                flex items-center justify-center gap-2
                px-3 py-2
                rounded-sm
                font-mono text-sm font-semibold
                bg-blue-500/10 border-2 border-blue-500/50
                text-blue-400 hover:bg-blue-500/20 hover:border-blue-500
                transition-all
                uppercase tracking-wider
              "
            >
              <Play size={14} />
              Clock In
            </button>
          )}
        </div>

        <button
          onClick={logout}
          className="
            w-full
            flex items-center gap-3
            px-3 py-2
            rounded-sm
            font-mono text-sm
            text-slate-500 hover:text-red-400 hover:bg-slate-900
            transition-colors
            border border-transparent hover:border-slate-700
          "
        >
          <LogOut size={16} />
          <span className="tracking-wide">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
