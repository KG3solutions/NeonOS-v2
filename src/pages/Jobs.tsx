import { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Trash2,
  Package,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  ClipboardList,
  User,
} from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button, StatusBadge, Input, Select } from '../components';
import { Modal } from '../components/Modal';
import { useJobs, useInventory, usePermission, useCustomers } from '../state';
import { Job, JobType, JobStatus, JobItem } from '../types';

// Job type colors for calendar
const jobTypeColors: Record<JobType, { bg: string; border: string; text: string; dot: string }> = {
  rental: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', dot: 'bg-cyan-500' },
  install: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', dot: 'bg-purple-500' },
  build: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', dot: 'bg-amber-500' },
  service: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', dot: 'bg-emerald-500' },
};

const jobTypeLabels: Record<JobType, string> = {
  rental: 'Rental',
  install: 'Install',
  build: 'Build',
  service: 'Service',
};

const jobStatusLabels: Record<JobStatus, string> = {
  planning: 'Planning',
  ready: 'Ready',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface NewJobForm {
  type: JobType;
  name: string;
  customerId: string | null;
  customerName: string;
  startDate: string;
  endDate: string;
  items: { itemId: string; quantity: number }[];
  notes: string;
  // Install-specific
  installAddress: string;
  installContact: string;
  // Service-specific
  serviceType: string;
}

const emptyForm: NewJobForm = {
  type: 'rental',
  name: '',
  customerId: null,
  customerName: '',
  startDate: '',
  endDate: '',
  items: [],
  notes: '',
  installAddress: '',
  installContact: '',
  serviceType: '',
};

type JobsTab = 'calendar' | 'list' | 'pull-lists';

export function Jobs() {
  const { jobs, jobsByStatus, jobsByType, createJob, updateJobStatus } = useJobs();
  const { items } = useInventory();
  const { customers } = useCustomers();
  const { hasPermission } = usePermission();

  const [activeTab, setActiveTab] = useState<JobsTab>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedDayJobs, setSelectedDayJobs] = useState<Job[]>([]);
  const [typeFilter, setTypeFilter] = useState<JobType | ''>('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');

  // New Job Modal state
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJob, setNewJob] = useState<NewJobForm>(emptyForm);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Job Detail Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailJob, setDetailJob] = useState<Job | null>(null);

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
      setNewJob(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
      }));
      setCustomerSearch('');
      setShowCustomerDropdown(false);
    }
  };

  const clearCustomer = () => {
    setNewJob(prev => ({
      ...prev,
      customerId: null,
      customerName: '',
    }));
    setCustomerSearch('');
  };

  // Read filter from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') as JobType | null;
    const status = params.get('status') as JobStatus | null;
    if (type && ['rental', 'install', 'build', 'service'].includes(type)) {
      setTypeFilter(type);
    }
    if (status && ['planning', 'ready', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      setStatusFilter(status);
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
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Helper to format date as YYYY-MM-DD in local time
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to parse date string as local date
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Get jobs for a specific date
  const getJobsForDate = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return Object.values(jobs).filter(job => {
      const start = job.startDate;
      const end = job.endDate || job.startDate;
      const inRange = dateStr >= start && dateStr <= end;
      const matchesType = !typeFilter || job.type === typeFilter;
      return inRange && matchesType;
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
      const jobsOnDay = getJobsForDate(date);
      days.push({ date, day, jobs: jobsOnDay });
    }

    return days;
  }, [year, month, daysInMonth, startingDayOfWeek, jobs, typeFilter]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Stats by type
  const stats = {
    rental: jobsByType.rental.length,
    install: jobsByType.install.length,
    build: jobsByType.build.length,
    service: jobsByType.service.length,
    inProgress: jobsByStatus['in-progress'].length,
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get filtered jobs based on filters
  const filteredJobs = useMemo(() => {
    let result = Object.values(jobs);
    if (typeFilter) {
      result = result.filter(job => job.type === typeFilter);
    }
    if (statusFilter) {
      result = result.filter(job => job.status === statusFilter);
    }
    return result.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [jobs, typeFilter, statusFilter]);

  const clearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    window.history.replaceState({}, '', window.location.pathname);
  };

  // New Job functions
  const itemOptions = Object.values(items).map(item => ({
    value: item.id,
    label: `${item.sku} - ${item.name} (${item.availableQuantity} available)`,
  }));

  const addItemToJob = () => {
    setNewJob(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', quantity: 1 }]
    }));
  };

  const removeItemFromJob = (index: number) => {
    setNewJob(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateJobItem = (index: number, field: 'itemId' | 'quantity', value: string | number) => {
    setNewJob(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleCreateJob = () => {
    // Validate form
    if (!newJob.name || !newJob.startDate) {
      return;
    }

    // Create job items
    const jobItems: JobItem[] = newJob.items
      .filter(ji => ji.itemId && ji.quantity > 0)
      .map(ji => {
        const item = items[ji.itemId];
        return {
          sku: item?.sku || '',
          itemId: ji.itemId,
          itemName: item?.name || 'Unknown',
          quantity: ji.quantity,
          willReturn: newJob.type === 'rental', // Rentals return items, installs/builds don't
        };
      });

    const job: Job = {
      id: `job-${Date.now()}`,
      type: newJob.type,
      name: newJob.name,
      customerId: newJob.customerId || undefined,
      customerName: newJob.customerName || undefined,
      status: 'planning',
      startDate: newJob.startDate,
      endDate: newJob.endDate || undefined,
      items: jobItems,
      notes: newJob.notes || undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user',
      lastModified: new Date().toISOString(),
      lastModifiedBy: 'current-user',
      // Type-specific fields
      ...(newJob.type === 'install' && {
        venue: newJob.installAddress || undefined,
      }),
    };

    createJob(job);
    setShowNewJobModal(false);
    setNewJob(emptyForm);
  };

  const openDetailModal = (job: Job) => {
    setDetailJob(job);
    setShowDetailModal(true);
  };

  const handleStatusChange = (jobId: string, newStatus: JobStatus) => {
    updateJobStatus(jobId, newStatus);
    // Update local state
    if (detailJob?.id === jobId) {
      setDetailJob(prev => prev ? { ...prev, status: newStatus } : null);
    }
    if (selectedJob?.id === jobId) {
      setSelectedJob(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const getStatusBadgeVariant = (status: JobStatus): 'info' | 'warning' | 'success' | 'error' | 'default' => {
    switch (status) {
      case 'planning': return 'default';
      case 'ready': return 'info';
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <PageTemplate
      title="Jobs"
      actions={
        hasPermission('rentals.create') && (
          <Button variant="primary" icon={Plus} onClick={() => setShowNewJobModal(true)}>
            New Job
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
          onClick={() => setActiveTab('list')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-colors
            ${activeTab === 'list'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-emerald-400'
            }
          `}
        >
          <ClipboardList size={16} />
          List View
        </button>
      </div>

      {/* Type Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setTypeFilter(typeFilter === '' ? '' : '')}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors
            ${typeFilter === ''
              ? 'bg-slate-700 text-slate-200'
              : 'bg-slate-800/50 border border-slate-700 text-slate-500 hover:text-slate-300'
            }
          `}
        >
          All Types
        </button>
        {(['rental', 'install', 'build', 'service'] as JobType[]).map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors
              ${typeFilter === type
                ? `${jobTypeColors[type].bg} ${jobTypeColors[type].border} border ${jobTypeColors[type].text}`
                : 'bg-slate-800/50 border border-slate-700 text-slate-500 hover:text-slate-300'
              }
            `}
          >
            <div className={`w-2 h-2 rounded-full ${jobTypeColors[type].dot}`} />
            {jobTypeLabels[type]}
            <span className="text-slate-600">({stats[type]})</span>
          </button>
        ))}
      </div>

      {activeTab === 'calendar' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {(['rental', 'install', 'build', 'service'] as JobType[]).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
                className={`
                  bg-slate-900/50 border rounded-lg p-4 text-left transition-all
                  ${typeFilter === type
                    ? `${jobTypeColors[type].border} ring-2 ring-opacity-20`
                    : `${jobTypeColors[type].border.replace('/50', '/30')} hover:${jobTypeColors[type].border}`
                  }
                `}
                style={{
                  boxShadow: typeFilter === type
                    ? `0 0 0 2px ${type === 'rental' ? 'rgba(34,211,238,0.2)' : type === 'install' ? 'rgba(168,85,247,0.2)' : type === 'build' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`
                    : undefined
                }}
              >
                <div className={`text-2xl font-mono ${jobTypeColors[type].text}`}>{stats[type]}</div>
                <div className="text-sm text-slate-500 font-mono">{jobTypeLabels[type]}s</div>
              </button>
            ))}
          </div>

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

                    const { date, day, jobs: dayJobs } = dayData;
                    const hasJobs = dayJobs.length > 0;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (dayJobs.length > 0) {
                            setSelectedDayJobs(dayJobs);
                            setSelectedJob(dayJobs[0]);
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
                          ${hasJobs ? 'hover:bg-slate-700 cursor-pointer' : ''}
                        `}
                      >
                        <span className={`
                          text-sm font-mono
                          ${isToday(date) ? 'text-emerald-400' : 'text-slate-400'}
                        `}>
                          {day}
                        </span>
                        {hasJobs && (
                          <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                            {dayJobs.slice(0, 4).map((job) => (
                              <div
                                key={job.id}
                                className={`w-1.5 h-1.5 rounded-full ${jobTypeColors[job.type].dot}`}
                                title={`${jobTypeLabels[job.type]}: ${job.name}`}
                              />
                            ))}
                            {dayJobs.length > 4 && (
                              <span className="text-[8px] text-slate-500 ml-0.5">+{dayJobs.length - 4}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-700">
                  {(['rental', 'install', 'build', 'service'] as JobType[]).map(type => (
                    <div key={type} className="flex items-center gap-2 text-xs font-mono text-slate-500">
                      <div className={`w-2 h-2 rounded-full ${jobTypeColors[type].dot}`} />
                      {jobTypeLabels[type]}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar - Job Details */}
            <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
              {selectedDayJobs.length > 0 ? (
                <Card title={`Jobs (${selectedDayJobs.length})`} icon={Clock}>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {/* Job List for Day */}
                    {selectedDayJobs.length > 1 && (
                      <div className="space-y-2 pb-3 border-b border-slate-700">
                        {selectedDayJobs.map(job => (
                          <button
                            key={job.id}
                            onClick={() => setSelectedJob(job)}
                            className={`
                              w-full text-left p-2 rounded-lg transition-all text-sm
                              ${selectedJob?.id === job.id
                                ? `${jobTypeColors[job.type].bg} ${jobTypeColors[job.type].border} border`
                                : 'bg-slate-800/30 border border-slate-700 hover:border-emerald-500/30'
                              }
                            `}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${jobTypeColors[job.type].dot}`} />
                                <span className="font-mono text-slate-200 truncate">
                                  {job.name}
                                </span>
                              </div>
                              <StatusBadge status={job.status} variant={getStatusBadgeVariant(job.status)} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected Job Details */}
                    {selectedJob && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${jobTypeColors[selectedJob.type].dot}`} />
                          <span className={`text-xs font-mono uppercase ${jobTypeColors[selectedJob.type].text}`}>
                            {jobTypeLabels[selectedJob.type]}
                          </span>
                        </div>

                        <div>
                          <div className="text-lg font-mono text-emerald-400">
                            {selectedJob.name}
                          </div>
                          {selectedJob.customerName && (
                            <div className="text-slate-500 text-sm font-mono">
                              {selectedJob.customerName}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                          <div>
                            <span className="text-slate-500">Start</span>
                            <div className="text-slate-300">
                              {parseLocalDate(selectedJob.startDate).toLocaleDateString()}
                            </div>
                          </div>
                          {selectedJob.endDate && (
                            <div>
                              <span className="text-slate-500">End</span>
                              <div className="text-slate-300">
                                {parseLocalDate(selectedJob.endDate).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-500 text-sm font-mono">Status</span>
                          <div className="mt-1">
                            <StatusBadge status={selectedJob.status} variant={getStatusBadgeVariant(selectedJob.status)} />
                          </div>
                        </div>

                        {selectedJob.items.length > 0 && (
                          <div>
                            <span className="text-slate-500 text-sm font-mono">Items</span>
                            <div className="mt-1 space-y-1">
                              {selectedJob.items.map((item, idx) => (
                                <div key={idx} className="text-sm font-mono text-slate-300">
                                  {item.quantity}x {items[item.itemId]?.name || 'Unknown'}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Eye}
                            onClick={() => openDetailModal(selectedJob)}
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedJob(null);
                              setSelectedDayJobs([]);
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
                <Card title="Upcoming Jobs" icon={Clock}>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {Object.values(jobs)
                      .filter(j => j.status === 'planning' || j.status === 'ready' || j.status === 'in-progress')
                      .sort((a, b) => a.startDate.localeCompare(b.startDate))
                      .slice(0, 5)
                      .map(job => (
                        <button
                          key={job.id}
                          onClick={() => {
                            setSelectedJob(job);
                            setSelectedDayJobs([job]);
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
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${jobTypeColors[job.type].dot}`} />
                              <span className="font-mono text-slate-200 text-sm">
                                {job.name}
                              </span>
                            </div>
                            <StatusBadge status={job.status} variant={getStatusBadgeVariant(job.status)} />
                          </div>
                          <div className="text-xs font-mono text-slate-500 mt-1 ml-4">
                            {parseLocalDate(job.startDate).toLocaleDateString()}
                            {job.endDate && ` - ${parseLocalDate(job.endDate).toLocaleDateString()}`}
                          </div>
                        </button>
                      ))}
                    {Object.values(jobs).filter(j => j.status !== 'completed' && j.status !== 'cancelled').length === 0 && (
                      <p className="text-slate-500 font-mono text-sm text-center py-4">
                        No upcoming jobs
                      </p>
                    )}
                  </div>
                </Card>
              )}

              {/* In Progress Alert */}
              {stats.inProgress > 0 && (
                <Card variant="warning">
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-mono text-amber-400 mb-1">
                        {stats.inProgress} Job{stats.inProgress > 1 ? 's' : ''} In Progress
                      </div>
                      <p className="text-slate-400 text-sm font-mono">
                        Active work underway
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'list' && (
        <>
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setStatusFilter('')}
              className={`
                px-3 py-1.5 rounded-lg font-mono text-xs transition-colors
                ${statusFilter === ''
                  ? 'bg-slate-700 text-slate-200'
                  : 'bg-slate-800/50 border border-slate-700 text-slate-500 hover:text-slate-300'
                }
              `}
            >
              All Status
            </button>
            {(['planning', 'ready', 'in-progress', 'completed', 'cancelled'] as JobStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                className={`
                  px-3 py-1.5 rounded-lg font-mono text-xs transition-colors
                  ${statusFilter === status
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-slate-800/50 border border-slate-700 text-slate-500 hover:text-slate-300'
                  }
                `}
              >
                {jobStatusLabels[status]}
              </button>
            ))}
            {(typeFilter || statusFilter) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-lg font-mono text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <X size={14} className="inline mr-1" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Job List */}
          <Card>
            <div className="space-y-3">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-500 font-mono">No jobs found</p>
                  {(typeFilter || statusFilter) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                filteredJobs.map(job => (
                  <button
                    key={job.id}
                    onClick={() => openDetailModal(job)}
                    className="
                      w-full text-left p-4 rounded-lg border transition-all
                      border-slate-700 bg-slate-800/30 hover:border-emerald-500/50
                    "
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1 ${jobTypeColors[job.type].dot}`} />
                        <div>
                          <div className="font-mono text-slate-200">{job.name}</div>
                          {job.customerName && (
                            <div className="text-sm font-mono text-slate-500">{job.customerName}</div>
                          )}
                          <div className="text-xs font-mono text-slate-600 mt-1">
                            {parseLocalDate(job.startDate).toLocaleDateString()}
                            {job.endDate && ` - ${parseLocalDate(job.endDate).toLocaleDateString()}`}
                            {' '}&bull;{' '}{job.items.length} item{job.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono ${jobTypeColors[job.type].text}`}>
                          {jobTypeLabels[job.type]}
                        </span>
                        <StatusBadge status={job.status} variant={getStatusBadgeVariant(job.status)} />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </>
      )}

      {/* New Job Modal */}
      <Modal
        isOpen={showNewJobModal}
        onClose={() => {
          setShowNewJobModal(false);
          setNewJob(emptyForm);
        }}
        title="New Job"
        size="lg"
      >
        <div className="space-y-6">
          {/* Job Type */}
          <div>
            <label className="block text-sm font-mono text-slate-400 mb-3">Job Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['rental', 'install', 'build', 'service'] as JobType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setNewJob(prev => ({ ...prev, type }))}
                  className={`
                    p-3 rounded-lg border font-mono text-sm transition-all
                    ${newJob.type === type
                      ? `${jobTypeColors[type].bg} ${jobTypeColors[type].border} ${jobTypeColors[type].text}`
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }
                  `}
                >
                  <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${jobTypeColors[type].dot}`} />
                  {jobTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Job Name */}
          <Input
            label="Job Name *"
            value={newJob.name}
            onChange={(e) => setNewJob(prev => ({ ...prev, name: e.target.value }))}
            placeholder={`Enter ${jobTypeLabels[newJob.type].toLowerCase()} name`}
          />

          {/* Customer (for rental, install, service) */}
          {newJob.type !== 'build' && (
            <div>
              <h3 className="text-sm font-mono text-slate-400 mb-3">Customer</h3>

              {!newJob.customerId && (
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Search customers..."
                    className="
                      w-full
                      bg-slate-800/50
                      border border-slate-700
                      rounded-lg
                      px-4 py-2.5
                      font-mono text-slate-200
                      placeholder:text-slate-600
                      focus:outline-none focus:border-emerald-500/50
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
                          <div className="text-xs font-mono text-slate-500">{customer.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {newJob.customerId && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex justify-between items-center">
                  <span className="font-mono text-emerald-400">{newJob.customerName}</span>
                  <button onClick={clearCustomer} className="text-slate-500 hover:text-red-400">
                    <X size={16} />
                  </button>
                </div>
              )}

              {!newJob.customerId && (
                <Input
                  label="Or Enter Customer Name"
                  value={newJob.customerName}
                  onChange={(e) => setNewJob(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Customer name"
                />
              )}
            </div>
          )}

          {/* Install-specific fields */}
          {newJob.type === 'install' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Install Address"
                value={newJob.installAddress}
                onChange={(e) => setNewJob(prev => ({ ...prev, installAddress: e.target.value }))}
                placeholder="Installation address"
              />
              <Input
                label="Site Contact"
                value={newJob.installContact}
                onChange={(e) => setNewJob(prev => ({ ...prev, installContact: e.target.value }))}
                placeholder="Contact name/phone"
              />
            </div>
          )}

          {/* Service-specific fields */}
          {newJob.type === 'service' && (
            <Select
              label="Service Type"
              value={newJob.serviceType}
              onChange={(value) => setNewJob(prev => ({ ...prev, serviceType: value }))}
              options={[
                { value: '', label: 'Select service type...' },
                { value: 'repair', label: 'Repair' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'inspection', label: 'Inspection' },
                { value: 'upgrade', label: 'Upgrade' },
              ]}
            />
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="date"
              value={newJob.startDate}
              onChange={(e) => setNewJob(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <Input
              label={newJob.type === 'rental' ? 'End Date *' : 'End Date'}
              type="date"
              value={newJob.endDate}
              onChange={(e) => setNewJob(prev => ({ ...prev, endDate: e.target.value }))}
              min={newJob.startDate}
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-mono text-slate-400">Items</h3>
              <Button variant="ghost" size="sm" icon={Plus} onClick={addItemToJob}>
                Add Item
              </Button>
            </div>

            {newJob.items.length === 0 ? (
              <div className="text-center py-6 bg-slate-800/30 border border-slate-700 rounded-lg">
                <p className="text-slate-500 font-mono text-sm">No items added</p>
              </div>
            ) : (
              <div className="space-y-3">
                {newJob.items.map((jobItem, index) => (
                  <div key={index} className="flex items-end gap-3 p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                    <div className="flex-1">
                      <Select
                        label="Item"
                        value={jobItem.itemId}
                        onChange={(value) => updateJobItem(index, 'itemId', value)}
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
                        value={jobItem.quantity.toString()}
                        onChange={(e) => updateJobItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItemFromJob(index)}
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
              value={newJob.notes}
              onChange={(e) => setNewJob(prev => ({ ...prev, notes: e.target.value }))}
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowNewJobModal(false);
                setNewJob(emptyForm);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateJob}
              disabled={!newJob.name || !newJob.startDate}
            >
              Create Job
            </Button>
          </div>
        </div>
      </Modal>

      {/* Job Detail Modal */}
      {detailJob && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setDetailJob(null);
          }}
          title="Job Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Job Type Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${jobTypeColors[detailJob.type].bg} ${jobTypeColors[detailJob.type].border} border`}>
              <div className={`w-2 h-2 rounded-full ${jobTypeColors[detailJob.type].dot}`} />
              <span className={`font-mono text-sm ${jobTypeColors[detailJob.type].text}`}>
                {jobTypeLabels[detailJob.type]}
              </span>
            </div>

            {/* Job Name & Customer */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-mono text-emerald-400 mb-2">{detailJob.name}</h3>
              {detailJob.customerName && (
                <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
                  <User size={14} className="text-slate-500" />
                  {detailJob.customerName}
                </div>
              )}
            </div>

            {/* Status & Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <span className="text-slate-500 text-xs font-mono uppercase">Status</span>
                <div className="mt-1">
                  <StatusBadge status={detailJob.status} variant={getStatusBadgeVariant(detailJob.status)} />
                </div>
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <span className="text-slate-500 text-xs font-mono uppercase">Start Date</span>
                <div className="text-slate-200 font-mono mt-1">
                  {parseLocalDate(detailJob.startDate).toLocaleDateString()}
                </div>
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <span className="text-slate-500 text-xs font-mono uppercase">End Date</span>
                <div className="text-slate-200 font-mono mt-1">
                  {detailJob.endDate ? parseLocalDate(detailJob.endDate).toLocaleDateString() : '-'}
                </div>
              </div>
            </div>

            {/* Install-specific info */}
            {detailJob.type === 'install' && detailJob.venue && (
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <span className="text-slate-500 text-xs font-mono uppercase">Venue</span>
                <div className="text-slate-200 font-mono mt-1 text-sm">{detailJob.venue}</div>
              </div>
            )}

            {/* Items */}
            {detailJob.items.length > 0 && (
              <div>
                <h3 className="text-sm font-mono text-slate-400 mb-3 flex items-center gap-2">
                  <Package size={14} />
                  Job Items
                </h3>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-xs font-mono text-slate-500 uppercase p-3">Item</th>
                        <th className="text-center text-xs font-mono text-slate-500 uppercase p-3">Qty</th>
                        <th className="text-right text-xs font-mono text-slate-500 uppercase p-3">Returns</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailJob.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-700/50 last:border-0">
                          <td className="p-3">
                            <div className="font-mono text-slate-200">
                              {item.itemName || items[item.itemId]?.name || 'Unknown Item'}
                            </div>
                            <div className="text-xs font-mono text-slate-500">
                              {item.sku || items[item.itemId]?.sku}
                            </div>
                          </td>
                          <td className="text-center font-mono text-slate-300 p-3">{item.quantity}</td>
                          <td className="text-right p-3">
                            <span className={`
                              text-xs font-mono px-2 py-0.5 rounded
                              ${item.willReturn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}
                            `}>
                              {item.willReturn ? 'YES' : 'NO'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes */}
            {detailJob.notes && (
              <div>
                <h3 className="text-sm font-mono text-slate-400 mb-2">Notes</h3>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <p className="font-mono text-sm text-slate-300">{detailJob.notes}</p>
                </div>
              </div>
            )}

            {/* Status Actions */}
            {hasPermission('rentals.edit') && (
              <div>
                <h3 className="text-sm font-mono text-slate-400 mb-3">Change Status</h3>
                <div className="flex flex-wrap gap-2">
                  {detailJob.status === 'planning' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => handleStatusChange(detailJob.id, 'ready')}
                    >
                      Mark Ready
                    </Button>
                  )}
                  {detailJob.status === 'ready' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Play}
                      onClick={() => handleStatusChange(detailJob.id, 'in-progress')}
                    >
                      Start Job
                    </Button>
                  )}
                  {detailJob.status === 'in-progress' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => handleStatusChange(detailJob.id, 'completed')}
                    >
                      Complete Job
                    </Button>
                  )}
                  {detailJob.status !== 'completed' && detailJob.status !== 'cancelled' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={XCircle}
                      onClick={() => handleStatusChange(detailJob.id, 'cancelled')}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      Cancel Job
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
                  setDetailJob(null);
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
