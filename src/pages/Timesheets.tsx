import { useState, useMemo } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Trash2,
  User
} from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button } from '../components';
import { Select } from '../components/Input';
import { useTimeClock, useAuth, useUserManagement, usePermission } from '../state';
import { TimeEntry } from '../types';

// Helper to get start of week (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to format date range
function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}, ${year}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
}

// Helper to format time (9:00 AM)
function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Helper to format duration
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}

// Helper to get day name
function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

// Helper to format date (1/7)
function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function Timesheets() {
  const { entries, entriesByUser } = useTimeClock();
  const { user } = useAuth();
  const { users } = useUserManagement();
  const { hasPermission } = usePermission();

  const canManage = hasPermission('users.manage');

  // State
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.id || '');

  // Get week days
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  }, [weekStart]);

  // Get entries for selected user and week
  const weekEntries = useMemo(() => {
    const userEntryIds = entriesByUser[selectedUserId] || [];
    const result: Record<string, TimeEntry[]> = {};

    weekDays.forEach(day => {
      const dateStr = day.toISOString().split('T')[0];
      result[dateStr] = [];
    });

    userEntryIds.forEach(entryId => {
      const entry = entries[entryId];
      if (entry) {
        const entryDate = entry.date;
        if (result[entryDate]) {
          result[entryDate].push(entry);
        }
      }
    });

    return result;
  }, [entries, entriesByUser, selectedUserId, weekDays]);

  // Calculate totals
  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(weekEntries).forEach(([date, dayEntries]) => {
      totals[date] = dayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    });
    return totals;
  }, [weekEntries]);

  const weeklyTotal = useMemo(() => {
    return Object.values(dailyTotals).reduce((sum, mins) => sum + mins, 0);
  }, [dailyTotals]);

  // User options for filter
  const userOptions = useMemo(() => {
    if (!canManage) {
      return [{ value: user?.id || '', label: user?.name || 'Me' }];
    }
    return Object.values(users)
      .filter(u => u.status === 'active')
      .map(u => ({ value: u.id, label: u.name }));
  }, [users, canManage, user]);

  // Navigation
  const goToPrevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };

  const goToThisWeek = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  // Export to CSV
  const exportCSV = () => {
    const selectedUser = users[selectedUserId];
    const rows = ['User,Date,Clock In,Clock Out,Hours'];

    Object.entries(weekEntries).forEach(([date, dayEntries]) => {
      dayEntries.forEach(entry => {
        const clockIn = formatTime(entry.clockIn);
        const clockOut = entry.clockOut ? formatTime(entry.clockOut) : 'Active';
        const hours = entry.duration ? (entry.duration / 60).toFixed(2) : '0';
        rows.push(`"${selectedUser?.name || 'Unknown'}","${date}","${clockIn}","${clockOut}","${hours}"`);
      });
    });

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-${selectedUser?.name || 'user'}-${weekStart.toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageTemplate
      title="Timesheets"
      actions={
        <Button variant="secondary" icon={Download} onClick={exportCSV}>
          Export CSV
        </Button>
      }
    >
      {/* Controls */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Week Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevWeek}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-sm transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="text-center min-w-[180px]">
              <div className="text-blue-400 font-mono font-bold">
                {formatWeekRange(weekStart)}
              </div>
            </div>

            <button
              onClick={goToNextWeek}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-sm transition-colors"
            >
              <ChevronRight size={20} />
            </button>

            <Button variant="ghost" size="sm" onClick={goToThisWeek}>
              This Week
            </Button>
          </div>

          {/* User Filter & Total */}
          <div className="flex items-center gap-4">
            {canManage && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-500" />
                <Select
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  options={userOptions}
                  className="w-40"
                />
              </div>
            )}

            <div className="text-right">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Weekly Total</div>
              <div className="text-xl font-mono font-bold text-blue-400">
                {formatDuration(weeklyTotal)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Weekly View */}
      <Card title="Time Entries" icon={Clock}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-700">
                <th className="text-left py-3 px-4 text-blue-400 font-mono text-xs uppercase tracking-widest font-bold w-24">
                  Day
                </th>
                <th className="text-left py-3 px-4 text-blue-400 font-mono text-xs uppercase tracking-widest font-bold">
                  Clock In
                </th>
                <th className="text-left py-3 px-4 text-blue-400 font-mono text-xs uppercase tracking-widest font-bold">
                  Clock Out
                </th>
                <th className="text-left py-3 px-4 text-blue-400 font-mono text-xs uppercase tracking-widest font-bold">
                  Hours
                </th>
                {canManage && (
                  <th className="text-right py-3 px-4 text-blue-400 font-mono text-xs uppercase tracking-widest font-bold w-24">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {weekDays.map(day => {
                const dateStr = day.toISOString().split('T')[0];
                const dayEntries = weekEntries[dateStr] || [];
                const dayTotal = dailyTotals[dateStr] || 0;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <tr
                    key={dateStr}
                    className={`border-b border-slate-800 ${isToday ? 'bg-blue-500/5' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 led-indicator" />
                        )}
                        <div>
                          <div className="font-mono font-bold text-slate-200">
                            {getDayName(day)}
                          </div>
                          <div className="font-mono text-xs text-slate-500">
                            {formatShortDate(day)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {dayEntries.length === 0 ? (
                          <span className="text-slate-600 font-mono text-sm">—</span>
                        ) : (
                          dayEntries.map(entry => (
                            <div key={entry.id} className="font-mono text-slate-300">
                              {formatTime(entry.clockIn)}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {dayEntries.length === 0 ? (
                          <span className="text-slate-600 font-mono text-sm">—</span>
                        ) : (
                          dayEntries.map(entry => (
                            <div key={entry.id} className="font-mono text-slate-300">
                              {entry.clockOut ? (
                                formatTime(entry.clockOut)
                              ) : (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 led-indicator" />
                                  Active
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {dayEntries.length === 0 ? (
                          <span className="text-slate-600 font-mono text-sm">—</span>
                        ) : (
                          dayEntries.map(entry => (
                            <div key={entry.id} className="font-mono text-slate-300">
                              {entry.duration ? formatDuration(entry.duration) : '—'}
                            </div>
                          ))
                        )}
                        {dayEntries.length > 1 && dayTotal > 0 && (
                          <div className="font-mono text-xs text-blue-400 pt-1 border-t border-slate-800">
                            Total: {formatDuration(dayTotal)}
                          </div>
                        )}
                      </div>
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right">
                        <div className="space-y-1">
                          {dayEntries.map(entry => (
                            <div key={entry.id} className="flex justify-end gap-1">
                              <button
                                className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                                title="Edit entry"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 border-t-2 border-slate-700">
                <td colSpan={3} className="py-3 px-4 text-right">
                  <span className="font-mono text-sm text-slate-400 uppercase tracking-wider">
                    Weekly Total
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-blue-400 text-lg">
                    {formatDuration(weeklyTotal)}
                  </span>
                  <span className="font-mono text-slate-500 text-sm ml-2">
                    ({(weeklyTotal / 60).toFixed(1)} hrs)
                  </span>
                </td>
                {canManage && <td />}
              </tr>
            </tfoot>
          </table>
        </div>

        {weeklyTotal === 0 && (
          <div className="text-center py-8 text-slate-500 font-mono">
            No time entries for this week
          </div>
        )}
      </Card>
    </PageTemplate>
  );
}
