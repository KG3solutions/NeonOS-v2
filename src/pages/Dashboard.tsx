import {
  Package,
  Calendar,
  ClipboardList,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  Zap,
  Plus,
  Cable,
  Tag,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, StatCard, Button } from '../components';
import { useInventory, useRentals, useUserManagement, useAuth } from '../state';
import { ActivityItem } from '../types';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { items } = useInventory();
  const { rentals, rentalsByStatus, pullListsByStatus } = useRentals();
  const { usersByStatus } = useUserManagement();
  const { user } = useAuth();

  // Check if user can see financial data (Owner or Manager)
  const canSeeFinancials = user?.role === 'owner' || user?.role === 'manager';

  // Calculate stats
  const totalItems = Object.keys(items).length;
  const lowStockItems = Object.values(items).filter(i => i.quantity < 5).length;
  const activeRentals = rentalsByStatus.active.length;
  const pendingPullLists = pullListsByStatus.draft.length + pullListsByStatus.ready.length + pullListsByStatus['in-progress'].length;
  const pendingUsers = usersByStatus.pending.length;

  // Calculate total revenue from rentals
  const totalRevenue = Object.values(rentals)
    .filter(r => r.status === 'returned' || r.status === 'active')
    .reduce((sum, r) => sum + r.totalCost.amount, 0);

  // Calculate inventory value
  const inventoryValue = Object.values(items)
    .reduce((sum, item) => sum + (item.rentalRate.amount * item.quantity), 0);

  // Mock recent activity
  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'add',
      description: 'Added 4x Chauvet Par Can LED RGBW',
      user: 'Kenny',
      timeAgo: '2 hours ago',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'rental',
      description: 'Rental started for Acme Productions',
      user: 'Zach',
      timeAgo: '5 hours ago',
      timestamp: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'adjust',
      description: 'Inventory adjustment: ADJ Wash LED RGB',
      user: 'Nathan',
      timeAgo: '1 day ago',
      timestamp: new Date().toISOString(),
    },
    {
      id: '4',
      type: 'user',
      description: 'NewUser1 registered and pending approval',
      user: 'System',
      timeAgo: '2 days ago',
      timestamp: new Date().toISOString(),
    },
  ];

  const upcomingRentals = Object.values(rentals)
    .filter(r => r.status === 'reserved' || r.status === 'active')
    .slice(0, 5);

  // Helper to parse date string as local date (avoids timezone issues)
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <PageTemplate title="Dashboard">
      {/* Stats Row - 4 columns on large screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div onClick={() => onNavigate('/inventory')} className="cursor-pointer">
          <StatCard
            icon={Package}
            label="Total Items"
            value={totalItems}
            color="blue"
            trend={5}
          />
        </div>
        <div onClick={() => onNavigate('/inventory?filter=lowstock')} className="cursor-pointer">
          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            value={lowStockItems}
            color="amber"
          />
        </div>
        <div onClick={() => onNavigate('/rentals')} className="cursor-pointer">
          <StatCard
            icon={Calendar}
            label="Active Rentals"
            value={activeRentals}
            color="cyan"
          />
        </div>
        <div onClick={() => onNavigate('/jobs')} className="cursor-pointer">
          <StatCard
            icon={ClipboardCheck}
            label="Pending Pulls"
            value={pendingPullLists}
            color="violet"
          />
        </div>
      </div>

      {/* Financial Stats - Only visible to Owner/Manager */}
      {canSeeFinancials && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="cursor-pointer">
            <StatCard
              icon={DollarSign}
              label="Revenue (Active)"
              value={`$${totalRevenue.toLocaleString()}`}
              color="emerald"
            />
          </div>
          <div className="cursor-pointer">
            <StatCard
              icon={DollarSign}
              label="Inventory Value"
              value={`$${inventoryValue.toLocaleString()}`}
              color="cyan"
            />
          </div>
        </div>
      )}

      {/* Two-column layout for main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <Card title="Recent Activity" icon={Activity}>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="
                  flex items-start gap-3
                  p-3
                  bg-slate-950/50
                  rounded-sm
                  border-2 border-slate-800
                "
              >
                <div className={`
                  p-2 rounded-sm
                  ${item.type === 'add' ? 'bg-blue-500/10 text-blue-400' : ''}
                  ${item.type === 'rental' ? 'bg-cyan-500/10 text-cyan-400' : ''}
                  ${item.type === 'adjust' ? 'bg-amber-500/10 text-amber-400' : ''}
                  ${item.type === 'user' ? 'bg-violet-500/10 text-violet-400' : ''}
                `}>
                  {item.type === 'add' && <Plus size={16} />}
                  {item.type === 'rental' && <Calendar size={16} />}
                  {item.type === 'adjust' && <TrendingUp size={16} />}
                  {item.type === 'user' && <ClipboardList size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-mono truncate">
                    {item.description}
                  </p>
                  <p className="text-slate-500 text-xs font-mono mt-1">
                    {item.user} • {item.timeAgo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" icon={Zap}>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => onNavigate('/new-item')}
              className="justify-start"
            >
              New Item
            </Button>
            <Button
              variant="secondary"
              icon={Calendar}
              onClick={() => onNavigate('/rentals')}
              className="justify-start"
            >
              New Rental
            </Button>
            <Button
              variant="secondary"
              icon={Cable}
              onClick={() => onNavigate('/wire-diagrams')}
              className="justify-start"
            >
              Wire Diagram
            </Button>
            <Button
              variant="secondary"
              icon={Tag}
              onClick={() => onNavigate('/labels')}
              className="justify-start"
            >
              Print Labels
            </Button>
          </div>

          {pendingUsers > 0 && (
            <div className="mt-4 p-3 bg-amber-500/10 border-2 border-amber-500/30 rounded-sm">
              <p className="text-amber-400 text-sm font-mono font-semibold">
                {pendingUsers} user{pendingUsers > 1 ? 's' : ''} pending approval
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('/users')}
                className="mt-2"
              >
                Review Now
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming Rentals - Full width */}
      <Card title="Upcoming Rentals" icon={Calendar}>
        {upcomingRentals.length === 0 ? (
          <p className="text-slate-500 font-mono text-center py-4">
            No upcoming rentals
          </p>
        ) : (
          <div className="overflow-x-auto border-2 border-slate-700 rounded-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-950 border-b-2 border-slate-700">
                  <th className="text-left py-3 px-4 text-blue-400 font-mono text-xs uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                      Customer
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-blue-400 font-mono text-xs uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                      Start Date
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-blue-400 font-mono text-xs uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                      End Date
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-blue-400 font-mono text-xs uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-500" />
                      Status
                    </div>
                  </th>
                  {canSeeFinancials && (
                    <th className="text-left py-3 px-4 text-blue-400 font-mono text-xs uppercase tracking-widest font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-500" />
                        Total
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {upcomingRentals.map((rental) => (
                  <tr
                    key={rental.id}
                    className="border-b border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {rental.customerName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-sm tabular-nums">
                      {parseLocalDate(rental.startDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-sm tabular-nums">
                      {parseLocalDate(rental.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`
                        inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs font-mono uppercase font-semibold border
                        ${rental.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50' : ''}
                        ${rental.status === 'reserved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/50' : ''}
                        ${rental.status === 'overdue' ? 'bg-red-500/10 text-red-400 border-red-500/50' : ''}
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          rental.status === 'active' ? 'bg-emerald-500' :
                          rental.status === 'reserved' ? 'bg-blue-500' :
                          'bg-red-500'
                        }`} />
                        {rental.status}
                      </span>
                    </td>
                    {canSeeFinancials && (
                      <td className="py-3 px-4 font-mono text-emerald-400 font-semibold tabular-nums">
                        ${rental.totalCost.amount}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageTemplate>
  );
}
