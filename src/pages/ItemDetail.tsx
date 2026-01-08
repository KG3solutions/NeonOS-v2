import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Edit2,
  Package,
  MapPin,
  Calendar,
  Tag,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  X,
  Save,
  Plus,
  Barcode,
  Trash2,
  Copy,
  Printer,
  RefreshCw
} from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button, StatusBadge, Input, Select } from '../components';
import { useInventory, useRentals, useAuth } from '../state';

interface ItemDetailProps {
  itemId: string;
  onNavigate: (path: string) => void;
}

export function ItemDetail({ itemId, onNavigate }: ItemDetailProps) {
  const { items, categories, locations, updateItem } = useInventory();
  const { rentals } = useRentals();
  const { user } = useAuth();

  const item = items[itemId];
  const canSeeFinancials = user?.role === 'owner' || user?.role === 'manager';

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    quantity: item?.quantity || 0,
    categoryId: item?.categoryId || '',
    locationId: item?.locationId || '',
    rentalRate: item?.rentalRate.amount || 0,
    rentalPeriod: item?.rentalPeriod || 'day',
    barcodes: item?.barcodes || [],
    binCode: item?.binCode || '',
  });
  const [newBarcode, setNewBarcode] = useState('');

  // Current selected image index
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  // Get rentals that include this item
  const itemRentals = useMemo(() => {
    return Object.values(rentals).filter(rental =>
      rental.items.some(ri => ri.itemId === itemId)
    );
  }, [rentals, itemId]);

  // Helper to parse date string as local date
  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Helper to format date as YYYY-MM-DD
  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Check if item is rented on a specific date
  const getRentalForDate = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return itemRentals.find(rental => {
      return dateStr >= rental.startDate && dateStr <= rental.endDate;
    });
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (null | { date: Date; day: number; rental: typeof itemRentals[0] | undefined })[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const rental = getRentalForDate(date);
      days.push({ date, day, rental });
    }

    return days;
  }, [year, month, itemRentals]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Edit handlers
  const handleStartEdit = () => {
    setEditData({
      name: item?.name || '',
      description: item?.description || '',
      quantity: item?.quantity || 0,
      categoryId: item?.categoryId || '',
      locationId: item?.locationId || '',
      rentalRate: item?.rentalRate.amount || 0,
      rentalPeriod: item?.rentalPeriod || 'day',
      barcodes: item?.barcodes || [],
      binCode: item?.binCode || '',
    });
    setNewBarcode('');
    setIsEditing(true);
  };

  const handleAddBarcode = () => {
    if (newBarcode.trim() && !editData.barcodes.includes(newBarcode.trim())) {
      setEditData({
        ...editData,
        barcodes: [...editData.barcodes, newBarcode.trim()]
      });
      setNewBarcode('');
    }
  };

  const handleRemoveBarcode = (barcode: string) => {
    setEditData({
      ...editData,
      barcodes: editData.barcodes.filter(b => b !== barcode)
    });
  };

  const handleCopyBarcode = async (barcode: string) => {
    try {
      await navigator.clipboard.writeText(barcode);
    } catch {
      // Fallback if clipboard API fails
      console.log('Could not copy barcode');
    }
  };

  const handleGenerateBarcode = () => {
    // Generate a barcode based on SKU + random suffix
    const prefix = item?.sku?.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'ITEM';
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `${prefix}-${suffix}`;
    if (!editData.barcodes.includes(newCode)) {
      setEditData({
        ...editData,
        barcodes: [...editData.barcodes, newCode]
      });
    }
  };

  const handlePrintBarcode = (barcode: string) => {
    // Navigate to labels page with this barcode pre-filled
    onNavigate(`/labels?barcode=${encodeURIComponent(barcode)}&sku=${encodeURIComponent(item?.sku || '')}&name=${encodeURIComponent(item?.name || '')}`);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (item) {
      updateItem(item.id, {
        name: editData.name,
        description: editData.description,
        quantity: editData.quantity,
        categoryId: editData.categoryId,
        locationId: editData.locationId,
        rentalRate: { currency: 'USD', amount: editData.rentalRate },
        rentalPeriod: editData.rentalPeriod as 'day' | 'week' | 'month',
        barcodes: editData.barcodes,
        binCode: editData.binCode || undefined,
      });
      setIsEditing(false);
    }
  };

  // Get category and location options for edit form
  const categoryOptions = Object.values(categories).map(c => ({
    value: c.id,
    label: c.name
  }));

  const locationOptions = Object.values(locations).map(l => ({
    value: l.id,
    label: l.name
  }));

  const periodOptions = [
    { value: 'day', label: 'Per Day' },
    { value: 'week', label: 'Per Week' },
    { value: 'month', label: 'Per Month' },
  ];

  if (!item) {
    return (
      <PageTemplate title="Item Not Found">
        <Card>
          <div className="text-center py-8">
            <Package size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 font-mono">Item not found</p>
            <Button variant="secondary" className="mt-4" onClick={() => onNavigate('/inventory')}>
              Back to Inventory
            </Button>
          </div>
        </Card>
      </PageTemplate>
    );
  }

  const category = categories[item.categoryId];
  const location = locations[item.locationId];

  const getStockStatus = () => {
    if (item.quantity === 0) return { label: 'Out of Stock', variant: 'error' as const };
    if (item.quantity < 5) return { label: 'Low Stock', variant: 'warning' as const };
    return { label: 'In Stock', variant: 'success' as const };
  };

  const stockStatus = getStockStatus();

  return (
    <PageTemplate
      title={isEditing ? `Edit: ${item.name}` : item.name}
      actions={
        isEditing ? (
          <>
            <Button variant="ghost" icon={X} onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" icon={ArrowLeft} onClick={() => onNavigate('/inventory')}>
              Back
            </Button>
            <Button variant="primary" icon={Edit2} onClick={handleStartEdit}>
              Edit Item
            </Button>
          </>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <div className="aspect-video bg-slate-800/50 rounded-lg flex items-center justify-center overflow-hidden">
              {item.images.length > 0 ? (
                <img
                  src={item.images[selectedImageIdx] || item.primaryImage || undefined}
                  alt={item.name}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : item.primaryImage ? (
                <img
                  src={item.primaryImage}
                  alt={item.name}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon size={64} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-slate-500 font-mono text-sm">No images</p>
                  {isEditing && (
                    <Button variant="secondary" size="sm" icon={Plus} className="mt-2">
                      Add Image
                    </Button>
                  )}
                </div>
              )}
            </div>
            {item.images.length > 0 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {item.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`
                      w-16 h-16 flex-shrink-0 rounded border-2 overflow-hidden transition-all
                      ${idx === selectedImageIdx
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-slate-700 hover:border-slate-500'
                      }
                    `}
                  >
                    <img src={img} alt={`${item.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                {isEditing && (
                  <button
                    className="
                      w-16 h-16 flex-shrink-0 rounded border-2 border-dashed border-slate-700
                      flex items-center justify-center
                      text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50
                      transition-colors
                    "
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
            )}
          </Card>

          {/* Item Details */}
          <Card title="Details" icon={Package}>
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  label="Item Name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    value={editData.categoryId}
                    onChange={(val) => setEditData({ ...editData, categoryId: val })}
                    options={categoryOptions}
                  />
                  <Select
                    label="Location"
                    value={editData.locationId}
                    onChange={(val) => setEditData({ ...editData, locationId: val })}
                    options={locationOptions}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Quantity"
                    type="number"
                    value={String(editData.quantity)}
                    onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    label="Rental Rate ($)"
                    type="number"
                    value={String(editData.rentalRate)}
                    onChange={(e) => setEditData({ ...editData, rentalRate: parseFloat(e.target.value) || 0 })}
                  />
                  <Select
                    label="Period"
                    value={editData.rentalPeriod}
                    onChange={(val) => setEditData({ ...editData, rentalPeriod: val as 'day' | 'week' | 'month' })}
                    options={periodOptions}
                  />
                </div>

                <div>
                  <label className="block text-sm font-mono text-slate-400 mb-2">Description</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                    className="
                      w-full
                      bg-slate-800
                      border border-slate-700
                      rounded-lg
                      px-4 py-3
                      font-mono text-slate-200
                      placeholder:text-slate-600
                      focus:outline-none focus:border-emerald-500/50
                      transition-colors
                      resize-none
                    "
                    placeholder="Item description..."
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 text-xs font-mono uppercase">SKU</span>
                    <p className="text-slate-200 font-mono">{item.sku}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-mono uppercase">Category</span>
                    <p className="text-slate-200 font-mono">{category?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-mono uppercase">Location</span>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-500" />
                      <span className="text-slate-200 font-mono">{location?.name || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-mono uppercase">Unit</span>
                    <p className="text-slate-200 font-mono capitalize">{item.unit}</p>
                  </div>
                </div>

                {item.description && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <span className="text-slate-500 text-xs font-mono uppercase">Description</span>
                    <p className="text-slate-300 font-mono text-sm mt-1">{item.description}</p>
                  </div>
                )}

                {item.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <span className="text-slate-500 text-xs font-mono uppercase">Tags</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-300"
                        >
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Barcodes & Location */}
          <Card title="Barcodes & Location" icon={Barcode}>
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  label="Bin Code"
                  value={editData.binCode}
                  onChange={(e) => setEditData({ ...editData, binCode: e.target.value })}
                  placeholder="e.g., A1, B2, C3"
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-mono text-slate-400">Barcodes</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={RefreshCw}
                      onClick={handleGenerateBarcode}
                    >
                      Generate
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editData.barcodes.map((barcode) => (
                      <div
                        key={barcode}
                        className="flex items-center gap-2 p-2 bg-slate-800/50 rounded border border-slate-700"
                      >
                        <Barcode size={14} className="text-slate-500" />
                        <span className="flex-1 font-mono text-sm text-slate-300">{barcode}</span>
                        <button
                          onClick={() => handleRemoveBarcode(barcode)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newBarcode}
                          onChange={(e) => setNewBarcode(e.target.value)}
                          placeholder="Enter barcode..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddBarcode();
                            }
                          }}
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
                      </div>
                      <Button
                        variant="secondary"
                        icon={Plus}
                        onClick={handleAddBarcode}
                        disabled={!newBarcode.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {item.binCode && (
                  <div>
                    <span className="text-slate-500 text-xs font-mono uppercase">Bin Location</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin size={14} className="text-emerald-500" />
                      <span className="font-mono text-emerald-400">{item.binCode}</span>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 text-xs font-mono uppercase">Barcodes</span>
                  {item.barcodes && item.barcodes.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {item.barcodes.map((barcode) => (
                        <div
                          key={barcode}
                          className="flex items-center gap-2 p-2 bg-slate-800/30 rounded border border-slate-700"
                        >
                          <Barcode size={14} className="text-slate-500" />
                          <span className="flex-1 font-mono text-sm text-slate-300">{barcode}</span>
                          <button
                            onClick={() => handlePrintBarcode(barcode)}
                            className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                            title="Print label"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            onClick={() => handleCopyBarcode(barcode)}
                            className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 font-mono text-sm mt-1">No barcodes assigned</p>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Rental History */}
          <Card title="Rental History" icon={Calendar}>
            {itemRentals.length === 0 ? (
              <p className="text-slate-500 font-mono text-center py-4">No rental history</p>
            ) : (
              <div className="space-y-2">
                {itemRentals.slice(0, 5).map(rental => (
                  <div
                    key={rental.id}
                    className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700"
                  >
                    <div>
                      <div className="font-mono text-slate-200 text-sm">{rental.customerName}</div>
                      <div className="text-slate-500 text-xs font-mono">
                        {parseLocalDate(rental.startDate).toLocaleDateString()} - {parseLocalDate(rental.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <StatusBadge status={rental.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Stats & Calendar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono text-sm">Stock Status</span>
                <StatusBadge status={stockStatus.label} variant={stockStatus.variant} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono text-sm">Quantity</span>
                <span className="text-2xl font-mono text-emerald-400">{item.quantity}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono text-sm">Available</span>
                <span className="text-2xl font-mono text-slate-200">{item.availableQuantity}</span>
              </div>

              {canSeeFinancials && (
                <>
                  <div className="pt-3 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-mono text-sm">Rental Rate</span>
                      <span className="font-mono text-emerald-400 flex items-center gap-1">
                        <DollarSign size={14} />
                        {item.rentalRate.amount}/{item.rentalPeriod}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-mono text-sm">Inventory Value</span>
                    <span className="font-mono text-emerald-400">
                      ${(item.rentalRate.amount * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Availability Calendar */}
          <Card title="Availability" icon={Calendar}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="p-1 text-slate-400 hover:text-emerald-400">
                <ChevronLeft size={18} />
              </button>
              <span className="font-mono text-emerald-400 text-sm">
                {monthNames[month]} {year}
              </span>
              <button onClick={nextMonth} className="p-1 text-slate-400 hover:text-emerald-400">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-mono text-slate-600 py-1">
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

                const { date, day, rental } = dayData;
                const today = isToday(date);
                const isRented = !!rental;

                return (
                  <div
                    key={idx}
                    className={`
                      aspect-square
                      rounded
                      flex items-center justify-center
                      text-xs font-mono
                      ${today ? 'ring-1 ring-emerald-500' : ''}
                      ${isRented ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800/30 text-slate-400'}
                    `}
                    title={rental ? `Rented: ${rental.customerName}` : 'Available'}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-slate-700">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <div className="w-3 h-3 rounded bg-slate-800/30" />
                <span className="text-slate-500">Available</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <div className="w-3 h-3 rounded bg-amber-500/20" />
                <span className="text-slate-500">Rented</span>
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Modified</span>
                <span className="text-slate-400">{new Date(item.lastModified).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}
