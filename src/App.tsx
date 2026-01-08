import { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar, BottomNav } from './layout';
import { useAuth } from './state';
import { ClockInModal } from './components';
import {
  Dashboard,
  NewItem,
  Inventory,
  ItemDetail,
  WireDiagrams,
  Rentals,
  Jobs,
  Labels,
  UserManagement,
  Receive,
  Scanner,
  Builder,
  Recipes,
  Timesheets,
  Settings,
} from './pages';

// Login Screen for unauthenticated users
function LoginScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 border-2 border-blue-500/30 rounded-sm p-8 max-w-md w-full mx-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 led-indicator" />
          <h1 className="font-mono text-blue-400 text-2xl font-bold tracking-widest">
            NEON<span className="text-amber-400">OS</span>
          </h1>
        </div>
        <p className="text-slate-500 text-sm font-mono mb-6 pl-4">
          Industrial Control System
        </p>

        <button
          className="
            w-full
            bg-slate-800 hover:bg-slate-700
            border-2 border-slate-700
            text-slate-200
            font-mono
            py-3 px-4
            rounded-sm
            flex items-center justify-center gap-3
            transition-colors
          "
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="text-slate-600 text-xs font-mono text-center mt-4">
          Demo mode: Auto-logged in as Kenny (Owner)
        </p>
      </div>
    </div>
  );
}

// Pending Approval Screen
function PendingApprovalScreen() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 border-2 border-amber-500/30 rounded-sm p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-500/30 rounded-sm flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-slate-100 font-mono text-xl mb-2 font-bold">
          Welcome, {user?.name}!
        </h2>

        <p className="text-slate-400 font-mono text-sm mb-4">
          Your account is pending approval by an administrator.
        </p>

        <div className="bg-slate-950 border-2 border-slate-700 rounded-sm p-4 text-left mb-4">
          <div className="text-slate-500 text-xs font-mono mb-1 uppercase tracking-wider">Account:</div>
          <div className="text-slate-100 font-mono text-sm">{user?.email}</div>
        </div>

        <button
          className="
            text-slate-500 hover:text-red-400
            font-mono text-sm
            transition-colors
          "
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// Blocked User Screen
function BlockedUserScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 border-2 border-red-500/30 rounded-sm p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500/30 rounded-sm flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        <h2 className="text-red-400 font-mono text-xl mb-2 font-bold">
          Access Denied
        </h2>

        <p className="text-slate-400 font-mono text-sm">
          Your account has been blocked. Please contact an administrator.
        </p>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const { user, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize from browser URL or default to '/'
  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.pathname + window.location.search;
    return path || '/';
  });

  // Navigate function that updates browser history
  const navigate = useCallback((path: string) => {
    if (path !== currentPath) {
      window.history.pushState({ path }, '', path);
      setCurrentPath(path);
      // Close sidebar on mobile after navigation
      setSidebarOpen(false);
    }
  }, [currentPath]);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const path = event.state?.path || (window.location.pathname + window.location.search) || '/';
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);

    // Set initial state if not already set
    if (!window.history.state) {
      window.history.replaceState({ path: currentPath }, '', currentPath);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPath]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Pending approval
  if (user?.status === 'pending') {
    return <PendingApprovalScreen />;
  }

  // Blocked
  if (user?.status === 'blocked') {
    return <BlockedUserScreen />;
  }

  // Render current page
  const renderPage = () => {
    // Extract pathname (without query params) for routing
    const pathname = currentPath.split('?')[0];

    // Handle item detail routes like /item/item-123
    if (pathname.startsWith('/item/')) {
      const itemId = pathname.replace('/item/', '');
      return <ItemDetail itemId={itemId} onNavigate={navigate} />;
    }

    switch (pathname) {
      case '/':
        return <Dashboard onNavigate={navigate} />;
      case '/new-item':
        return <NewItem onNavigate={navigate} />;
      case '/inventory':
        // Use key to force remount when query params change
        return <Inventory key={currentPath} onNavigate={navigate} />;
      case '/receive':
        return <Receive onNavigate={navigate} />;
      case '/scan':
        return <Scanner onNavigate={navigate} />;
      case '/wire-diagrams':
        return <WireDiagrams />;
      case '/rentals':
        // Use key to force remount when query params change
        return <Rentals key={currentPath} />;
      case '/jobs':
        // Use key to force remount when query params change
        return <Jobs key={currentPath} />;
      case '/builder':
        return <Builder />;
      case '/recipes':
        return <Recipes />;
      case '/labels':
        return <Labels />;
      case '/users':
        return <UserManagement />;
      case '/timesheets':
        return <Timesheets />;
      case '/settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile Header with hamburger menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-950 border-b-2 border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 led-indicator" />
          <h1 className="font-mono text-blue-400 text-lg font-bold tracking-widest">
            NEON<span className="text-amber-400">OS</span>
          </h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown on desktop */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <Sidebar
          currentPath={currentPath}
          onNavigate={navigate}
        />
      </div>

      {/* Main content - add top/bottom padding on mobile for header/nav */}
      <main className="flex-1 overflow-auto pt-14 pb-20 lg:pt-0 lg:pb-0">
        {renderPage()}
      </main>

      {/* Bottom Navigation - mobile only */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={navigate}
        onMenuOpen={() => setSidebarOpen(true)}
      />

      <ClockInModal />
    </div>
  );
}

export default App;
