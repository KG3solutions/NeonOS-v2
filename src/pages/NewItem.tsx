import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Save, X, Upload, Trash2, GripVertical } from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button, Input, Select, Textarea } from '../components';
import { useInventory, useAppDispatch, useAuth } from '../state';
import { InventoryItem } from '../types';

interface NewItemProps {
  onNavigate: (path: string) => void;
}

export function NewItem({ onNavigate }: NewItemProps) {
  const { categories, locations } = useInventory();
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    locationId: '',
    quantity: '1',
    unit: 'each',
    rentalRate: '',
    rentalPeriod: 'day',
    tags: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach(file => {
      if (!validTypes.includes(file.type)) {
        return; // Skip invalid types
      }
      if (file.size > maxSize) {
        return; // Skip files over 5MB
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Image reordering with drag and drop
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);

  const handleImageDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set a transparent drag image
    const dragImg = new Image();
    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(dragImg, 0, 0);
  };

  const handleImageDragEnd = () => {
    if (draggedImageIndex !== null && dragOverImageIndex !== null && draggedImageIndex !== dragOverImageIndex) {
      setImages(prev => {
        const newImages = [...prev];
        const draggedItem = newImages[draggedImageIndex];
        newImages.splice(draggedImageIndex, 1);
        newImages.splice(dragOverImageIndex, 0, draggedItem);
        return newImages;
      });
    }
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  const handleImageDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedImageIndex !== null && index !== draggedImageIndex) {
      setDragOverImageIndex(index);
    }
  };

  const handleImageDragLeaveItem = () => {
    setDragOverImageIndex(null);
  };

  const categoryOptions = Object.values(categories).map(c => ({
    value: c.id,
    label: c.name,
  }));

  const locationOptions = Object.values(locations).map(l => ({
    value: l.id,
    label: l.name,
  }));

  const unitOptions = [
    { value: 'each', label: 'Each' },
    { value: 'ft', label: 'Feet' },
    { value: 'meter', label: 'Meters' },
    { value: 'box', label: 'Box' },
    { value: 'set', label: 'Set' },
  ];

  const periodOptions = [
    { value: 'day', label: 'Per Day' },
    { value: 'week', label: 'Per Week' },
    { value: 'month', label: 'Per Month' },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.locationId) newErrors.locationId = 'Location is required';
    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    if (formData.rentalRate && parseFloat(formData.rentalRate) < 0) {
      newErrors.rentalRate = 'Rate must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      sku: formData.sku,
      name: formData.name,
      description: formData.description || null,
      categoryId: formData.categoryId,
      locationId: formData.locationId,
      quantity: parseInt(formData.quantity),
      availableQuantity: parseInt(formData.quantity),
      unit: formData.unit as InventoryItem['unit'],
      rentalRate: {
        amount: parseFloat(formData.rentalRate) || 0,
        currency: 'USD',
      },
      rentalPeriod: formData.rentalPeriod as InventoryItem['rentalPeriod'],
      images: images,
      primaryImage: images.length > 0 ? images[0] : null,
      assignedTo: null,
      createdAt: new Date().toISOString(),
      createdBy: user?.id || '',
      lastModified: new Date().toISOString(),
      lastModifiedBy: user?.id || '',
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      customFields: {},
      barcodes: [],
    };

    dispatch({ type: 'INVENTORY_ADD_ITEM', payload: newItem });
    onNavigate('/inventory');
  };

  return (
    <PageTemplate
      title="New Item"
      actions={
        <>
          <Button variant="ghost" icon={X} onClick={() => onNavigate('/inventory')}>
            Cancel
          </Button>
          <Button variant="primary" icon={Save} onClick={handleSubmit}>
            Save Item
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Item Details">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="LED-001"
                  error={errors.sku}
                />
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Chauvet Par Can LED RGBW"
                  error={errors.name}
                />
              </div>

              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Professional LED fixture with..."
                rows={3}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={formData.categoryId}
                  onChange={(value) => setFormData({ ...formData, categoryId: value })}
                  options={categoryOptions}
                  placeholder="Select category"
                  error={errors.categoryId}
                />
                <Select
                  label="Location"
                  value={formData.locationId}
                  onChange={(value) => setFormData({ ...formData, locationId: value })}
                  options={locationOptions}
                  placeholder="Select location"
                  error={errors.locationId}
                />
              </div>

              <Input
                label="Tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="led, chauvet, par-can (comma separated)"
              />
            </div>
          </Card>

          <Card title="Quantity & Pricing">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  error={errors.quantity}
                />
                <Select
                  label="Unit"
                  value={formData.unit}
                  onChange={(value) => setFormData({ ...formData, unit: value })}
                  options={unitOptions}
                />
                <div /> {/* Spacer */}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Rental Rate ($)"
                  type="number"
                  value={formData.rentalRate}
                  onChange={(e) => setFormData({ ...formData, rentalRate: e.target.value })}
                  placeholder="25.00"
                  error={errors.rentalRate}
                />
                <Select
                  label="Rental Period"
                  value={formData.rentalPeriod}
                  onChange={(value) => setFormData({ ...formData, rentalPeriod: value })}
                  options={periodOptions}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Images">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Drop zone */}
            <div
              onClick={handleClickUpload}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed
                rounded-lg
                p-6
                text-center
                transition-colors
                cursor-pointer
                ${isDragging
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 hover:border-emerald-500/50'
                }
              `}
            >
              <Upload size={28} className={`mx-auto mb-2 ${isDragging ? 'text-emerald-400' : 'text-slate-500'}`} />
              <p className={`text-sm font-mono ${isDragging ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isDragging ? 'Drop images here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-slate-600 text-xs font-mono mt-1">
                PNG, JPG, WebP up to 5MB
              </p>
            </div>

            {/* Image previews */}
            {images.length > 0 && (
              <>
                <p className="text-slate-500 text-xs font-mono mt-4 mb-2">
                  Drag images to reorder. First image is primary.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {images.map((img, idx) => (
                    <div
                      key={`${idx}-${img.slice(0, 50)}`}
                      draggable
                      onDragStart={(e) => handleImageDragStart(e, idx)}
                      onDragEnd={handleImageDragEnd}
                      onDragOver={(e) => handleImageDragOver(e, idx)}
                      onDragLeave={handleImageDragLeaveItem}
                      className={`
                        relative group aspect-square rounded-lg overflow-hidden bg-slate-800
                        cursor-grab active:cursor-grabbing
                        transition-all duration-150
                        ${draggedImageIndex === idx ? 'opacity-50 scale-95' : ''}
                        ${dragOverImageIndex === idx ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900' : ''}
                      `}
                    >
                      <img
                        src={img}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      {/* Drag handle */}
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 p-1 bg-slate-900/80 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical size={14} className="text-slate-400" />
                      </div>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-emerald-500 text-xs font-mono rounded">
                          Primary
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        className="
                          absolute top-1 right-1
                          p-1
                          bg-red-500/80
                          rounded
                          opacity-0 group-hover:opacity-100
                          transition-opacity
                        "
                      >
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card title="Quick Info">
            <div className="space-y-3 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Created by</span>
                <span className="text-slate-300">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="text-slate-300">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}
