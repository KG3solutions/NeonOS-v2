import { Permission, Role, WireColor } from './types';

// Role Permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'inventory.view', 'inventory.add', 'inventory.edit', 'inventory.remove.any', 'inventory.audit',
    'rentals.view', 'rentals.create', 'rentals.edit', 'rentals.cancel',
    'wirediagrams.view', 'wirediagrams.create', 'wirediagrams.edit', 'wirediagrams.delete',
    'labels.create', 'labels.print',
    'users.manage', 'settings.edit'
  ],
  manager: [
    'inventory.view', 'inventory.add', 'inventory.edit', 'inventory.remove.any',
    'rentals.view', 'rentals.create', 'rentals.edit', 'rentals.cancel',
    'wirediagrams.view', 'wirediagrams.create', 'wirediagrams.edit',
    'labels.create', 'labels.print'
  ],
  staff: [
    'inventory.view', 'inventory.remove.assigned',
    'rentals.view',
    'wirediagrams.view',
    'labels.create'
  ]
};

// Wire Colors
export const WIRE_COLORS: WireColor[] = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#f5f5f5' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Brown', hex: '#78350f' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Gray', hex: '#6b7280' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Shield', hex: '#a8a29e' },
  { name: 'Drain', hex: '#71717a' },
];

// All Permissions for UI
export const ALL_PERMISSIONS: { category: string; perms: Permission[] }[] = [
  {
    category: 'Inventory',
    perms: ['inventory.view', 'inventory.add', 'inventory.edit', 'inventory.remove.any', 'inventory.remove.assigned', 'inventory.audit']
  },
  {
    category: 'Rentals',
    perms: ['rentals.view', 'rentals.create', 'rentals.edit', 'rentals.cancel']
  },
  {
    category: 'Wire Diagrams',
    perms: ['wirediagrams.view', 'wirediagrams.create', 'wirediagrams.edit', 'wirediagrams.delete']
  },
  {
    category: 'Labels',
    perms: ['labels.create', 'labels.print']
  },
  {
    category: 'Admin',
    perms: ['users.manage', 'settings.edit']
  }
];

// Navigation Items
export const NAV_ITEMS = [
  { icon: 'LayoutDashboard', label: 'Dashboard', path: '/' },
  { icon: 'Plus', label: 'New Item', path: '/new-item' },
  { icon: 'Package', label: 'Inventory', path: '/inventory' },
  { icon: 'Cable', label: 'Wire Diagrams', path: '/wire-diagrams' },
  { icon: 'Calendar', label: 'Rentals', path: '/rentals' },
  { icon: 'Tag', label: 'Labels', path: '/labels' },
];
