import {
  LayoutDashboard,
  Package,
  Barcode,
  Calendar,
  Menu
} from 'lucide-react';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onMenuOpen: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: Barcode, label: 'Scan', path: '/scan' },
  { icon: Calendar, label: 'Jobs', path: '/jobs' },
];

export function BottomNav({ currentPath, onNavigate, onMenuOpen }: BottomNavProps) {
  const currentBasePath = currentPath.split('?')[0];

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-40
      bg-slate-950 border-t-2 border-slate-800
      lg:hidden
      pb-[env(safe-area-inset-bottom)]
    ">
      <div className="flex items-stretch justify-around h-16">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentBasePath === item.path;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1
                transition-colors
                ${isActive
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-slate-500 active:text-blue-400 active:bg-slate-800'
                }
              `}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-mono text-[10px] tracking-wide uppercase">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}

        {/* More menu button */}
        <button
          onClick={onMenuOpen}
          className="
            flex-1 flex flex-col items-center justify-center gap-1
            text-slate-500 active:text-blue-400 active:bg-slate-800
            transition-colors
          "
        >
          <Menu size={20} />
          <span className="font-mono text-[10px] tracking-wide uppercase">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
