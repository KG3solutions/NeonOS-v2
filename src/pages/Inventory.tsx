import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Package, MapPin, Minus } from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button, Input, Select, DataTable, StatusBadge } from '../components';
import { useInventory, usePermission } from '../state';
import { InventoryItem } from '../types';

interface InventoryProps {
  onNavigate: (path: string) => void;
}

export function Inventory({ onNavigate }: InventoryProps) {
  const { items, categories, locations, adjustQuantity } = useInventory();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission('inventory.edit');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  // Read filter from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    if (filter === 'lowstock') {
      setStockFilter('low');
    } else if (filter === 'outofstock') {
      setStockFilter('out');
    }
  }, []);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...Object.values(categories).map(c => ({ value: c.id, label: c.name })),
  ];

  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...Object.values(locations).map(l => ({ value: l.id, label: l.name })),
  ];

  const stockFilterOptions = [
    { value: '', label: 'All Stock Levels' },
    { value: 'low', label: 'Low Stock' },
    { value: 'out', label: 'Out of Stock' },
    { value: 'ok', label: 'In Stock' },
  ];

  const filteredItems = useMemo(() => {
    return Object.values(items).filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = !categoryFilter || item.categoryId === categoryFilter;
      const matchesLocation = !locationFilter || item.locationId === locationFilter;

      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = item.quantity > 0 && item.quantity < 5;
      } else if (stockFilter === 'out') {
        matchesStock = item.quantity === 0;
      } else if (stockFilter === 'ok') {
        matchesStock = item.quantity >= 5;
      }

      return matchesSearch && matchesCategory && matchesLocation && matchesStock;
    });
  }, [items, searchQuery, categoryFilter, locationFilter, stockFilter]);

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Out', variant: 'error' as const };
    if (item.quantity < 5) return { label: 'Low', variant: 'warning' as const };
    return { label: 'OK', variant: 'success' as const };
  };

  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      render: (item: InventoryItem) => (
        <button
          onClick={() => onNavigate(`/item/${item.id}`)}
          className="font-mono text-slate-400 text-sm hover:text-emerald-400 transition-colors text-left"
        >
          {item.sku}
        </button>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (item: InventoryItem) => (
        <div>
          <button
            onClick={() => onNavigate(`/item/${item.id}`)}
            className="font-mono text-slate-200 hover:text-emerald-400 transition-colors text-left"
          >
            {item.name}
          </button>
          {item.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {item.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="text-xs font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (item: InventoryItem) => (
        <span className="font-mono text-sm text-slate-400">
          {categories[item.categoryId]?.name || '-'}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (item: InventoryItem) => (
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-slate-500" />
          <span className="font-mono text-sm text-slate-400">
            {locations[item.locationId]?.name || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      render: (item: InventoryItem) => {
        const status = getStockStatus(item);
        return (
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.quantity > 0) {
                    adjustQuantity(item.id, -1, 'audit_correction');
                  }
                }}
                disabled={item.quantity === 0}
                className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus size={12} />
              </button>
            )}
            <span className="font-mono text-slate-200 w-8 text-center">{item.quantity}</span>
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  adjustQuantity(item.id, 1, 'audit_correction');
                }}
                className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 transition-colors"
              >
                <Plus size={12} />
              </button>
            )}
            <StatusBadge status={status.label} variant={status.variant} />
          </div>
        );
      },
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (item: InventoryItem) => (
        <span className="font-mono text-emerald-400">
          ${item.rentalRate.amount}/{item.rentalPeriod}
        </span>
      ),
    },
  ];

  const stats = useMemo(() => {
    const itemList = Object.values(items);
    return {
      total: itemList.length,
      lowStock: itemList.filter(i => i.quantity < 5 && i.quantity > 0).length,
      outOfStock: itemList.filter(i => i.quantity === 0).length,
      totalValue: itemList.reduce((acc, i) => acc + i.rentalRate.amount * i.quantity, 0),
    };
  }, [items]);

  return (
    <PageTemplate
      title="Inventory"
      actions={
        hasPermission('inventory.add') && (
          <Button variant="primary" icon={Plus} onClick={() => onNavigate('/new-item')}>
            Add Item
          </Button>
        )
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
          <div className="text-2xl font-mono text-white">{stats.total}</div>
          <div className="text-sm text-slate-500 font-mono">Total Items</div>
        </div>
        <div className="bg-slate-900/50 border border-amber-500/30 rounded-lg p-4">
          <div className="text-2xl font-mono text-amber-400">{stats.lowStock}</div>
          <div className="text-sm text-slate-500 font-mono">Low Stock</div>
        </div>
        <div className="bg-slate-900/50 border border-red-500/30 rounded-lg p-4">
          <div className="text-2xl font-mono text-red-400">{stats.outOfStock}</div>
          <div className="text-sm text-slate-500 font-mono">Out of Stock</div>
        </div>
        <div className="bg-slate-900/50 border border-emerald-500/30 rounded-lg p-4">
          <div className="text-2xl font-mono text-emerald-400">${stats.totalValue.toLocaleString()}</div>
          <div className="text-sm text-slate-500 font-mono">Daily Value</div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, or tag..."
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
              className="w-40"
            />
            <Select
              value={locationFilter}
              onChange={setLocationFilter}
              options={locationOptions}
              className="w-40"
            />
            <Select
              value={stockFilter}
              onChange={setStockFilter}
              options={stockFilterOptions}
              className="w-40"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card title="Items" icon={Package}>
        <DataTable
          columns={columns}
          data={filteredItems}
          emptyMessage="No items found"
        />
      </Card>
    </PageTemplate>
  );
}
