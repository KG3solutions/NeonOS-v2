import { useState, useMemo, useEffect } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, AlertTriangle, X, Trash2, Mail, Phone, Package, Eye, Play, CheckCircle, XCircle, ClipboardList, User } from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button, StatusBadge, Input, Select } from '../components';
import { Modal } from '../components/Modal';
import { useRentals, useInventory, usePermission, useAppDispatch, useCustomers } from '../state';
import { Rental, RentalItem, PullList, PullListStatus } from '../types';

interface NewRentalForm {
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  items: { itemId: string; quantity: number }[];
  notes: string;
}

const emptyForm: NewRentalForm = {
  customerId: null,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  startDate: '',
  endDate: '',
  items: [],
  notes: '',
};

type RentalsTab = 'calendar' | 'pull-lists';

export function Rentals() {
  const { rentals, rentalsByStatus, pullLists, pullListsByStatus, updatePullList, updatePullListItem } = useRentals();
  const { items } = useInventory();
  const { customers } = useCustomers();
  const { hasPermission } = usePermission();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<RentalsTab>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [selectedDayRentals, setSelectedDayRentals] = useState<Rental[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedPullList, setSelectedPullList] = useState<PullList | null>(null);

  // New Rental Modal state
  const [showNewRentalModal, setShowNewRentalModal] = useState(false);
  const [newRental, setNewRental] = useState<NewRentalForm>(emptyForm);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Filter customers based on search
  const filteredCustomers = Object.values(customers).filter(customer =>
    customerSearch &&
    (customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
     customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
     customer.company?.toLowerCase().includes(customerSearch.toLowerCase()))
  ).slice(0, 5);

  const selectCustomer = (customerId: string) => {
    const customer = customers[customerId];
    if (customer) {
      setNewRental(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
      }));
      setCustomerSearch('');
      setShowCustomerDropdown(false);
    }
  };

  const clearCustomer = () => {
    setNewRental(prev => ({
      ...prev,
      customerId: null,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
    }));
    setCustomerSearch('');
  };

  // Rental Detail Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRental, setDetailRental] = useState<Rental | null>(null);

  const openDetailModal = (rental: Rental) => {
    setDetailRental(rental);
    setShowDetailModal(true);
  };

  const handleStatusChange = (rentalId: string, newStatus: 'active' | 'returned' | 'cancelled' | 'overdue') => {
    dispatch({ type: 'RENTAL_UPDATE_STATUS', payload: { id: rentalId, status: newStatus } });
    // Update the detail rental if it's the same one
    if (detailRental?.id === rentalId) {
      setDetailRental(prev => prev ? { ...prev, status: newStatus } : null);
    }
    // Update selectedRental if it's the same one
    if (selectedRental?.id === rentalId) {
      setSelectedRental(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Read filter from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    if (filter === 'overdue') {
      setStatusFilter('overdue');
    } else if (filter === 'active') {
      setStatusFilter('active');
    } else if (filter === 'reserved') {
      setStatusFilter('reserved');
    }
  }, []);

  // Get current month info
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to format date as YYYY-MM-DD in local time
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to parse date string as local date (avoids timezone issues)
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Get rentals for a specific date
  const getRentalsForDate = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return Object.values(rentals).filter(rental => {
      const start = rental.startDate;
      const end = rental.endDate;
      return dateStr >= start && dateStr <= end;
    });
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const rentalsOnDay = getRentalsForDate(date);
      days.push({ date, day, rentals: rentalsOnDay });
    }

    return days;
  }, [year, month, daysInMonth, startingDayOfWeek, rentals]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const stats = {
    active: rentalsByStatus.active.length,
    reserved: rentalsByStatus.reserved.length,
    overdue: rentalsByStatus.overdue.length,
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get filtered rentals based on status filter
  const filteredRentals = useMemo(() => {
    if (!statusFilter) return [];
    const rentalIds = rentalsByStatus[statusFilter as keyof typeof rentalsByStatus] || [];
    return rentalIds.map(id => rentals[id]).filter(Boolean);
  }, [statusFilter, rentalsByStatus, rentals]);

  const clearFilter = () => {
    setStatusFilter('');
    // Update URL without filter
    window.history.replaceState({}, '', window.location.pathname);
  };

  // New Rental functions
  const itemOptions = Object.values(items).map(item => ({
    value: item.id,
    label: `${item.sku} - ${item.name} (${item.availableQuantity} available)`,
  }));

  const addItemToRental = () => {
    setNewRental(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', quantity: 1 }]
    }));
  };

  const removeItemFromRental = (index: number) => {
    setNewRental(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateRentalItem = (index: number, field: 'itemId' | 'quantity', value: string | number) => {
    setNewRental(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    if (newRental.startDate && newRental.endDate) {
      const start = new Date(newRental.startDate);
      const end = new Date(newRental.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      newRental.items.forEach(ri => {
        const item = items[ri.itemId];
        if (item) {
          total += item.rentalRate.amount * ri.quantity * days;
        }
      });
    }
    return total;
  };

  const handleCreateRental = () => {
    // Validate form
    if (!newRental.customerName || !newRental.startDate || !newRental.endDate || newRental.items.length === 0) {
      return;
    }

    // Create rental items
    const rentalItems: RentalItem[] = newRental.items
      .filter(ri => ri.itemId && ri.quantity > 0)
      .map(ri => {
        const item = items[ri.itemId];
        const rate = item?.rentalRate.amount || 0;
        const days = Math.ceil((new Date(newRental.endDate).getTime() - new Date(newRental.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return {
          itemId: ri.itemId,
          quantity: ri.quantity,
          rate: { currency: 'USD' as const, amount: rate },
          subtotal: { currency: 'USD' as const, amount: rate * ri.quantity * days },
        };
      });

    if (rentalItems.length === 0) return;

    const rental: Rental = {
      id: `rental-${Date.now()}`,
      customerId: newRental.customerId || undefined,
      customerName: newRental.customerName,
      customerEmail: newRental.customerEmail || null,
      customerPhone: newRental.customerPhone || null,
      startDate: newRental.startDate,
      endDate: newRental.endDate,
      actualReturnDate: null,
      status: 'reserved',
      items: rentalItems,
      totalCost: { currency: 'USD', amount: calculateTotal() },
      depositAmount: { currency: 'USD', amount: 0 },
      depositReturned: false,
      paymentStatus: 'unpaid',
      notes: newRental.notes || null,
      internalNotes: null,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user',
      lastModified: new Date().toISOString(),
      lastModifiedBy: 'current-user',
    };

    dispatch({ type: 'RENTAL_CREATE', payload: rental });
    setShowNewRentalModal(false);
    setNewRental(emptyForm);
  };

  // Pull List helpers
  const getPullListStatusBadge = (status: PullListStatus) => {
    const variants: Record<PullListStatus, 'info' | 'warning' | 'success' | 'default'> = {
      draft: 'default',
      ready: 'info',
      'in-progress': 'warning',
      completed: 'success',
    };
    return <StatusBadge status={status} variant={variants[status]} />;
  };

  const handleStartPullList = (pullListId: string) => {
    updatePullList(pullListId, {
      status: 'in-progress',
      startedAt: new Date().toISOString(),
    });
    // Update selected pull list if it's the same one
    if (selectedPullList?.id === pullListId) {
      setSelectedPullList(prev => prev ? { ...prev, status: 'in-progress', startedAt: new Date().toISOString() } : null);
    }
  };

  const handleCompletePullList = (pullListId: string) => {
    updatePullList(pullListId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
    if (selectedPullList?.id === pullListId) {
      setSelectedPullList(prev => prev ? { ...prev, status: 'completed', completedAt: new Date().toISOString() } : null);
    }
  };

  const handlePullItem = (pullListId: string, itemSku: string, quantityPulled: number) => {
    updatePullListItem(pullListId, itemSku, {
      quantityPulled,
      pulledAt: new Date().toISOString(),
    });
    // Update local state for immediate feedback
    if (selectedPullList?.id === pullListId) {
      setSelectedPullList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.sku === itemSku
              ? { ...item, quantityPulled, pulledAt: new Date().toISOString() }
              : item
          ),
        };
      });
    }
  };

  const pullListStats = {
    ready: pullListsByStatus.ready.length,
    inProgress: pullListsByStatus['in-progress'].length,
    completed: pullListsByStatus.completed.length,
  };

  return (
    <PageTemplate
      title="Rentals"
      actions={
        hasPermission('rentals.create') && (
          <Button variant="primary" icon={Plus} onClick={() => setShowNewRentalModal(true)}>
            New Rental
          </Button>
        )
      }
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-colors
            ${activeTab === 'calendar'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-emerald-400'
            }
          `}
        >
          <Calendar size={16} />
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('pull-lists')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-colors
            ${activeTab === 'pull-lists'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-emerald-400'
            }
          `}
        >
          <ClipboardList size={16} />
          Pull Lists
          {pullListStats.ready + pullListStats.inProgress > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500 text-black rounded-full">
              {pullListStats.ready + pullListStats.inProgress}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'calendar' && (
        <>
          {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter(statusFilter === 'reserved' ? '' : 'reserved')}
          className={`bg-slate-900/50 border rounded-lg p-4 text-left transition-all ${
            statusFilter === 'reserved' ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-cyan-500/30 hover:border-cyan-500/50'
          }`}
        >
          <div className="text-2xl font-mono text-cyan-400">{stats.reserved}</div>
          <div className="text-sm text-slate-500 font-mono">Reserved</div>
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'active' ? '' : 'active')}
          className={`bg-slate-900/50 border rounded-lg p-4 text-left transition-all ${
            statusFilter === 'active' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-emerald-500/30 hover:border-emerald-500/50'
          }`}
        >
          <div className="text-2xl font-mono text-emerald-400">{stats.active}</div>
          <div className="text-sm text-slate-500 font-mono">Active</div>
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? '' : 'overdue')}
          className={`bg-slate-900/50 border rounded-lg p-4 text-left transition-all ${
            statusFilter === 'overdue' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-red-500/30 hover:border-red-500/50'
          }`}
        >
          <div className="text-2xl font-mono text-red-400">{stats.overdue}</div>
          <div className="text-sm text-slate-500 font-mono">Overdue</div>
        </button>
      </div>

      {/* Filtered Rentals List */}
      {statusFilter && filteredRentals.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-lg text-emerald-400 capitalize">
              {statusFilter} Rentals ({filteredRentals.length})
            </h3>
            <button
              onClick={clearFilter}
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3">
            {filteredRentals.map(rental => (
              <button
                key={rental.id}
                onClick={() => setSelectedRental(rental)}
                className={`
                  w-full text-left p-4 rounded-lg border transition-all
                  ${selectedRental?.id === rental.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50'
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-slate-200">{rental.customerName}</div>
                    <div className="text-sm font-mono text-slate-500 mt-1">
                      {parseLocalDate(rental.startDate).toLocaleDateString()} - {parseLocalDate(rental.endDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs font-mono text-slate-600 mt-1">
                      {rental.items.length} item{rental.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <StatusBadge status={rental.status} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {statusFilter && filteredRentals.length === 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-lg text-emerald-400 capitalize">
              {statusFilter} Rentals
            </h3>
            <button
              onClick={clearFilter}
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-slate-500 font-mono text-center py-4">
            No {statusFilter} rentals found
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card icon={Calendar}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <h2 className="text-lg font-mono text-emerald-400">
                {monthNames[month]} {year}
              </h2>

              <button
                onClick={nextMonth}
                className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div
                  key={day}
                  className="text-center text-xs font-mono text-slate-500 uppercase py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayData, idx) => {
                if (!dayData) {
                  return <div key={idx} className="aspect-square" />;
                }

                const { date, day, rentals: dayRentals } = dayData;
                const hasRentals = dayRentals.length > 0;
                const hasOverdue = dayRentals.some(r => r.status === 'overdue');

                // Check for item overlaps (same item in multiple active/reserved rentals)
                const itemCounts: Record<string, number> = {};
                dayRentals
                  .filter(r => r.status === 'active' || r.status === 'reserved')
                  .forEach(r => {
                    r.items.forEach(item => {
                      itemCounts[item.itemId] = (itemCounts[item.itemId] || 0) + item.quantity;
                    });
                  });
                const hasOverlap = Object.entries(itemCounts).some(([itemId, count]) => {
                  const available = items[itemId]?.availableQuantity || 0;
                  return count > available + items[itemId]?.quantity - available;
                });

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (dayRentals.length > 0) {
                        setSelectedDayRentals(dayRentals);
                        setSelectedRental(dayRentals[0]);
                      }
                    }}
                    className={`
                      aspect-square
                      rounded-lg
                      p-1
                      flex flex-col
                      items-center
                      justify-center
                      transition-colors
                      relative
                      ${isToday(date) ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-800/30'}
                      ${hasRentals ? 'hover:bg-slate-700 cursor-pointer' : ''}
                      ${hasOverdue ? 'border border-red-500/50' : ''}
                      ${hasOverlap ? 'ring-2 ring-amber-500/50 ring-inset' : ''}
                    `}
                    title={hasOverlap ? 'Equipment overlap conflict!' : undefined}
                  >
                    {/* Overlap warning indicator */}
                    {hasOverlap && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-black">!</span>
                      </div>
                    )}
                    <span className={`
                      text-sm font-mono
                      ${isToday(date) ? 'text-emerald-400' : 'text-slate-400'}
                    `}>
                      {day}
                    </span>
                    {hasRentals && (
                      <div className="flex gap-0.5 mt-1">
                        {dayRentals.slice(0, 3).map((rental) => (
                          <div
                            key={rental.id}
                            className={`
                              w-1.5 h-1.5 rounded-full
                              ${rental.status === 'active' ? 'bg-emerald-500' : ''}
                              ${rental.status === 'reserved' ? 'bg-cyan-500' : ''}
                              ${rental.status === 'overdue' ? 'bg-red-500' : ''}
                            `}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar - Rental Details or Upcoming */}
        <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {selectedDayRentals.length > 0 ? (
            <Card title={`Rentals (${selectedDayRentals.length})`} icon={Clock}>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {/* Rental List for Day */}
                {selectedDayRentals.length > 1 && (
                  <div className="space-y-2 pb-3 border-b border-slate-700">
                    {selectedDayRentals.map(rental => (
                      <button
                        key={rental.id}
                        onClick={() => setSelectedRental(rental)}
                        className={`
                          w-full text-left p-2 rounded-lg transition-all text-sm
                          ${selectedRental?.id === rental.id
                            ? 'bg-emerald-500/20 border border-emerald-500/50'
                            : 'bg-slate-800/30 border border-slate-700 hover:border-emerald-500/30'
                          }
                        `}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-slate-200 truncate">
                            {rental.customerName}
                          </span>
                          <StatusBadge status={rental.status} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Rental Details */}
                {selectedRental && (
                  <>
                    <div>
                      <div className="text-lg font-mono text-emerald-400">
                        {selectedRental.customerName}
                      </div>
                      <div className="text-slate-500 text-sm font-mono">
                        {selectedRental.customerEmail}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                      <div>
                        <span className="text-slate-500">Start</span>
                        <div className="text-slate-300">
                          {parseLocalDate(selectedRental.startDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">End</span>
                        <div className="text-slate-300">
                          {parseLocalDate(selectedRental.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 text-sm font-mono">Status</span>
                      <div className="mt-1">
                        <StatusBadge status={selectedRental.status} />
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 text-sm font-mono">Items</span>
                      <div className="mt-1 space-y-1">
                        {selectedRental.items.map((item, idx) => (
                          <div key={idx} className="text-sm font-mono text-slate-300">
                            {item.quantity}x {items[item.itemId]?.name || 'Unknown'}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                      <span className="text-slate-500 font-mono">Total</span>
                      <span className="text-emerald-400 font-mono text-lg">
                        ${selectedRental.totalCost.amount}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Eye}
                        onClick={() => openDetailModal(selectedRental)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRental(null);
                          setSelectedDayRentals([]);
                        }}
                        className="flex-1"
                      >
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ) : (
            <Card title="Upcoming" icon={Clock}>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {Object.values(rentals)
                  .filter(r => r.status === 'reserved' || r.status === 'active')
                  .slice(0, 5)
                  .map(rental => (
                    <button
                      key={rental.id}
                      onClick={() => {
                        setSelectedRental(rental);
                        setSelectedDayRentals([rental]);
                      }}
                      className="
                        w-full
                        p-3
                        bg-slate-800/30
                        border border-slate-700
                        rounded-lg
                        text-left
                        hover:border-emerald-500/30
                        transition-colors
                      "
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-slate-200 text-sm">
                          {rental.customerName}
                        </span>
                        <StatusBadge status={rental.status} />
                      </div>
                      <div className="text-xs font-mono text-slate-500 mt-1">
                        {parseLocalDate(rental.startDate).toLocaleDateString()} - {parseLocalDate(rental.endDate).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
              </div>
            </Card>
          )}

          {/* Overdue Alert */}
          {stats.overdue > 0 && (
            <Card variant="danger">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono text-red-400 mb-1">
                    {stats.overdue} Overdue Rental{stats.overdue > 1 ? 's' : ''}
                  </div>
                  <p className="text-slate-400 text-sm font-mono">
                    Equipment not returned on time
                  </p>
                  <Button variant="danger" size="sm" className="mt-3">
                    View Overdue
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
        </>
      )}

      {activeTab === 'pull-lists' && (
        <>
          {/* Pull List Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-4">
              <div className="text-2xl font-mono text-cyan-400">{pullListStats.ready}</div>
              <div className="text-sm text-slate-500 font-mono">Ready to Pull</div>
            </div>
            <div className="bg-slate-900/50 border border-amber-500/30 rounded-lg p-4">
              <div className="text-2xl font-mono text-amber-400">{pullListStats.inProgress}</div>
              <div className="text-sm text-slate-500 font-mono">In Progress</div>
            </div>
            <div className="bg-slate-900/50 border border-emerald-500/30 rounded-lg p-4">
              <div className="text-2xl font-mono text-emerald-400">{pullListStats.completed}</div>
              <div className="text-sm text-slate-500 font-mono">Completed</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pull Lists */}
            <div className="lg:col-span-2 space-y-4">
              {/* Ready Pull Lists */}
              {pullListsByStatus.ready.length > 0 && (
                <Card title="Ready to Pull" icon={ClipboardList}>
                  <div className="space-y-3">
                    {pullListsByStatus.ready.map(id => {
                      const pullList = pullLists[id];
                      if (!pullList) return null;
                      const rental = rentals[pullList.rentalId];
                      return (
                        <button
                          key={id}
                          onClick={() => setSelectedPullList(pullList)}
                          className={`
                            w-full text-left p-4 rounded-lg border transition-all
                            ${selectedPullList?.id === id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50'
                            }
                          `}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-mono text-slate-200">{rental?.customerName || 'Unknown'}</div>
                              <div className="text-sm font-mono text-slate-500 mt-1">
                                {pullList.items.length} items to pull
                              </div>
                            </div>
                            {getPullListStatusBadge(pullList.status)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* In Progress Pull Lists */}
              {pullListsByStatus['in-progress'].length > 0 && (
                <Card title="In Progress" icon={ClipboardList}>
                  <div className="space-y-3">
                    {pullListsByStatus['in-progress'].map(id => {
                      const pullList = pullLists[id];
                      if (!pullList) return null;
                      const rental = rentals[pullList.rentalId];
                      const pulledCount = pullList.items.filter(i => i.quantityPulled >= i.quantityNeeded).length;
                      return (
                        <button
                          key={id}
                          onClick={() => setSelectedPullList(pullList)}
                          className={`
                            w-full text-left p-4 rounded-lg border transition-all
                            ${selectedPullList?.id === id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50'
                            }
                          `}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-mono text-slate-200">{rental?.customerName || 'Unknown'}</div>
                              <div className="text-sm font-mono text-slate-500 mt-1">
                                {pulledCount}/{pullList.items.length} items pulled
                              </div>
                            </div>
                            {getPullListStatusBadge(pullList.status)}
                          </div>
                          <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${(pulledCount / pullList.items.length) * 100}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* No Pull Lists */}
              {pullListsByStatus.ready.length === 0 && pullListsByStatus['in-progress'].length === 0 && (
                <Card>
                  <div className="text-center py-8">
                    <ClipboardList size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-500 font-mono">No active pull lists</p>
                    <p className="text-slate-600 text-sm font-mono mt-1">
                      Pull lists are created from reservations
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Pull List Detail */}
            <div>
              {selectedPullList ? (
                <Card title="Pull List Detail" icon={ClipboardList}>
                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-500 text-xs font-mono uppercase">Rental</span>
                      <div className="text-lg font-mono text-emerald-400">
                        {rentals[selectedPullList.rentalId]?.customerName || 'Unknown'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-xs font-mono uppercase">Status</span>
                      {getPullListStatusBadge(selectedPullList.status)}
                    </div>

                    {selectedPullList.assignedTo && (
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-500" />
                        <span className="text-slate-400 text-sm font-mono">
                          Assigned to: {selectedPullList.assignedTo}
                        </span>
                      </div>
                    )}

                    {/* Items */}
                    <div>
                      <span className="text-slate-500 text-xs font-mono uppercase mb-2 block">Items</span>
                      <div className="space-y-2">
                        {selectedPullList.items.map((item) => {
                          const isPulled = item.quantityPulled >= item.quantityNeeded;
                          return (
                            <div
                              key={item.sku}
                              className={`
                                p-3 rounded-lg border
                                ${isPulled ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/30'}
                              `}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-mono text-sm text-slate-200">{item.itemName}</div>
                                  <div className="text-xs font-mono text-slate-500">{item.sku}</div>
                                  {item.binLocation && (
                                    <div className="text-xs font-mono text-emerald-400 mt-1">
                                      Bin: {item.binLocation}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className={`font-mono text-lg ${isPulled ? 'text-emerald-400' : 'text-slate-300'}`}>
                                    {item.quantityPulled}/{item.quantityNeeded}
                                  </div>
                                </div>
                              </div>
                              {selectedPullList.status === 'in-progress' && !isPulled && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handlePullItem(selectedPullList.id, item.sku, Math.min(item.quantityPulled + 1, item.quantityNeeded))}
                                    className="flex-1 py-1.5 bg-emerald-500/20 text-emerald-400 rounded font-mono text-sm hover:bg-emerald-500/30 transition-colors"
                                  >
                                    Pull +1
                                  </button>
                                  <button
                                    onClick={() => handlePullItem(selectedPullList.id, item.sku, item.quantityNeeded)}
                                    className="flex-1 py-1.5 bg-emerald-500 text-black rounded font-mono text-sm hover:bg-emerald-400 transition-colors"
                                  >
                                    Pull All
                                  </button>
                                </div>
                              )}
                              {isPulled && (
                                <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-mono">
                                  <CheckCircle size={12} />
                                  Pulled
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-700 space-y-2">
                      {selectedPullList.status === 'ready' && (
                        <Button
                          variant="primary"
                          icon={Play}
                          onClick={() => handleStartPullList(selectedPullList.id)}
                          className="w-full"
                        >
                          Start Pulling
                        </Button>
                      )}
                      {selectedPullList.status === 'in-progress' && (
                        <Button
                          variant="primary"
                          icon={CheckCircle}
                          onClick={() => handleCompletePullList(selectedPullList.id)}
                          className="w-full"
                          disabled={selectedPullList.items.some(i => i.quantityPulled < i.quantityNeeded)}
                        >
                          Complete Pull List
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedPullList(null)}
                        className="w-full"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card title="Pull List Detail" icon={ClipboardList}>
                  <div className="text-center py-8">
                    <p className="text-slate-500 font-mono text-sm">
                      Select a pull list to view details
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* New Rental Modal */}
      <Modal
        isOpen={showNewRentalModal}
        onClose={() => {
          setShowNewRentalModal(false);
          setNewRental(emptyForm);
        }}
        title="New Rental"
        size="lg"
      >
        <div className="space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-mono text-slate-400 mb-3">Customer Information</h3>

            {/* Customer Search / Autocomplete */}
            {!newRental.customerId && (
              <div className="relative mb-4">
                <label className="block text-sm font-mono text-slate-400 mb-1.5 uppercase tracking-wide">
                  Search Existing Customer
                </label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Type to search customers..."
                  className="
                    w-full
                    bg-slate-800/50
                    border border-slate-700
                    rounded-lg
                    px-4 py-2.5
                    font-mono text-slate-200
                    placeholder:text-slate-600
                    focus:outline-none focus:border-emerald-500/50
                    focus:ring-1 focus:ring-emerald-500/20
                    transition-colors
                  "
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
                    {filteredCustomers.map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => selectCustomer(customer.id)}
                        className="
                          w-full text-left px-4 py-3
                          hover:bg-emerald-500/10
                          transition-colors
                          border-b border-slate-700 last:border-0
                        "
                      >
                        <div className="font-mono text-slate-200">{customer.name}</div>
                        <div className="text-xs font-mono text-slate-500 flex gap-3">
                          <span>{customer.email}</span>
                          {customer.company && <span>{customer.company}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs font-mono text-slate-600 mt-1">
                  Or enter a new customer below
                </p>
              </div>
            )}

            {/* Selected Customer Display */}
            {newRental.customerId && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-emerald-400">{newRental.customerName}</div>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      {newRental.customerEmail} | {newRental.customerPhone}
                    </div>
                  </div>
                  <button
                    onClick={clearCustomer}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Customer Name *"
                value={newRental.customerName}
                onChange={(e) => setNewRental(prev => ({ ...prev, customerId: null, customerName: e.target.value }))}
                placeholder="Enter customer name"
                disabled={!!newRental.customerId}
              />
              <Input
                label="Email"
                type="email"
                value={newRental.customerEmail}
                onChange={(e) => setNewRental(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="customer@email.com"
                disabled={!!newRental.customerId}
              />
              <Input
                label="Phone"
                type="tel"
                value={newRental.customerPhone}
                onChange={(e) => setNewRental(prev => ({ ...prev, customerPhone: e.target.value }))}
                placeholder="(555) 123-4567"
                disabled={!!newRental.customerId}
              />
            </div>
          </div>

          {/* Rental Dates */}
          <div>
            <h3 className="text-sm font-mono text-slate-400 mb-3">Rental Period</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date *"
                type="date"
                value={newRental.startDate}
                onChange={(e) => setNewRental(prev => ({ ...prev, startDate: e.target.value }))}
              />
              <Input
                label="End Date *"
                type="date"
                value={newRental.endDate}
                onChange={(e) => setNewRental(prev => ({ ...prev, endDate: e.target.value }))}
                min={newRental.startDate}
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-mono text-slate-400">Items *</h3>
              <Button variant="ghost" size="sm" icon={Plus} onClick={addItemToRental}>
                Add Item
              </Button>
            </div>

            {newRental.items.length === 0 ? (
              <div className="text-center py-8 bg-slate-800/30 border border-slate-700 rounded-lg">
                <p className="text-slate-500 font-mono text-sm">No items added</p>
                <Button variant="ghost" size="sm" icon={Plus} onClick={addItemToRental} className="mt-2">
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {newRental.items.map((rentalItem, index) => (
                  <div key={index} className="flex items-end gap-3 p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                    <div className="flex-1">
                      <Select
                        label="Item"
                        value={rentalItem.itemId}
                        onChange={(value) => updateRentalItem(index, 'itemId', value)}
                        options={[
                          { value: '', label: 'Select an item...' },
                          ...itemOptions
                        ]}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        label="Qty"
                        type="number"
                        min={1}
                        value={rentalItem.quantity.toString()}
                        onChange={(e) => updateRentalItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItemFromRental(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mb-0.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-mono text-slate-400 mb-2">Notes</label>
            <textarea
              value={newRental.notes}
              onChange={(e) => setNewRental(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
              className="
                w-full
                bg-slate-800/50
                border border-slate-700
                rounded-lg
                px-4 py-3
                font-mono text-sm text-slate-200
                placeholder:text-slate-600
                focus:outline-none focus:border-emerald-500/50
                transition-colors
                resize-none
              "
            />
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-4 border-t border-slate-700">
            <span className="text-slate-400 font-mono">Estimated Total</span>
            <span className="text-2xl font-mono text-emerald-400">${calculateTotal().toFixed(2)}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowNewRentalModal(false);
                setNewRental(emptyForm);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRental}
              disabled={
                !newRental.customerName ||
                !newRental.startDate ||
                !newRental.endDate ||
                newRental.items.length === 0 ||
                newRental.items.some(i => !i.itemId)
              }
            >
              Create Rental
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rental Detail Modal */}
      {detailRental && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setDetailRental(null);
          }}
          title="Rental Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-mono text-emerald-400 mb-3">{detailRental.customerName}</h3>
              <div className="space-y-2">
                {detailRental.customerEmail && (
                  <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
                    <Mail size={14} className="text-slate-500" />
                    {detailRental.customerEmail}
                  </div>
                )}
                {detailRental.customerPhone && (
                  <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
                    <Phone size={14} className="text-slate-500" />
                    {detailRental.customerPhone}
                  </div>
                )}
              </div>
            </div>

            {/* Status & Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <span className="text-slate-500 text-xs font-mono uppercase">Status</span>
                <div className="mt-1">
                  <StatusBadge status={detailRental.status} />
                </div>
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <span className="text-slate-500 text-xs font-mono uppercase">Start Date</span>
                <div className="text-slate-200 font-mono mt-1">
                  {parseLocalDate(detailRental.startDate).toLocaleDateString()}
                </div>
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <span className="text-slate-500 text-xs font-mono uppercase">End Date</span>
                <div className="text-slate-200 font-mono mt-1">
                  {parseLocalDate(detailRental.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-sm font-mono text-slate-400 mb-3 flex items-center gap-2">
                <Package size={14} />
                Rental Items
              </h3>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-xs font-mono text-slate-500 uppercase p-3">Item</th>
                      <th className="text-center text-xs font-mono text-slate-500 uppercase p-3">Qty</th>
                      <th className="text-right text-xs font-mono text-slate-500 uppercase p-3">Rate</th>
                      <th className="text-right text-xs font-mono text-slate-500 uppercase p-3">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailRental.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-700/50 last:border-0">
                        <td className="p-3">
                          <div className="font-mono text-slate-200">
                            {items[item.itemId]?.name || 'Unknown Item'}
                          </div>
                          <div className="text-xs font-mono text-slate-500">
                            {items[item.itemId]?.sku}
                          </div>
                        </td>
                        <td className="text-center font-mono text-slate-300 p-3">{item.quantity}</td>
                        <td className="text-right font-mono text-slate-400 p-3">${item.rate.amount}/day</td>
                        <td className="text-right font-mono text-emerald-400 p-3">${item.subtotal.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment & Total */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <span className="text-slate-500 text-xs font-mono uppercase">Payment Status</span>
                <div className="mt-1">
                  <span className={`
                    text-sm font-mono px-2 py-0.5 rounded
                    ${detailRental.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                    ${detailRental.paymentStatus === 'partial' ? 'bg-amber-500/20 text-amber-400' : ''}
                    ${detailRental.paymentStatus === 'unpaid' ? 'bg-slate-500/20 text-slate-400' : ''}
                    ${detailRental.paymentStatus === 'overdue' ? 'bg-red-500/20 text-red-400' : ''}
                  `}>
                    {detailRental.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="bg-slate-800/30 border border-emerald-500/30 rounded-lg p-4">
                <span className="text-slate-500 text-xs font-mono uppercase">Total</span>
                <div className="text-2xl font-mono text-emerald-400 mt-1">
                  ${detailRental.totalCost.amount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Notes */}
            {detailRental.notes && (
              <div>
                <h3 className="text-sm font-mono text-slate-400 mb-2">Notes</h3>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <p className="font-mono text-sm text-slate-300">{detailRental.notes}</p>
                </div>
              </div>
            )}

            {/* Status Actions */}
            {hasPermission('rentals.edit') && (
              <div>
                <h3 className="text-sm font-mono text-slate-400 mb-3">Change Status</h3>
                <div className="flex flex-wrap gap-2">
                  {detailRental.status === 'reserved' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Play}
                      onClick={() => handleStatusChange(detailRental.id, 'active')}
                    >
                      Start Rental
                    </Button>
                  )}
                  {(detailRental.status === 'active' || detailRental.status === 'overdue') && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => handleStatusChange(detailRental.id, 'returned')}
                    >
                      Mark Returned
                    </Button>
                  )}
                  {detailRental.status === 'active' && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={AlertTriangle}
                      onClick={() => handleStatusChange(detailRental.id, 'overdue')}
                    >
                      Mark Overdue
                    </Button>
                  )}
                  {(detailRental.status === 'reserved' || detailRental.status === 'active') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={XCircle}
                      onClick={() => handleStatusChange(detailRental.id, 'cancelled')}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      Cancel Rental
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Close */}
            <div className="flex justify-end pt-2 border-t border-slate-700">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailRental(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}
