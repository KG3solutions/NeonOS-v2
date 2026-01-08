# NeonOS Architecture Document

> Cyber-Industrial Inventory/Rental ERP System
> Single-file React artifact evolving to full-stack application

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [State Management](#2-state-management)
3. [Data Model](#3-data-model)
4. [User Management System](#4-user-management-system)
5. [Wire Diagram System](#5-wire-diagram-system)
6. [UI/UX Design System](#6-uiux-design-system)
7. [Component Architecture](#7-component-architecture)
8. [Permission System](#8-permission-system)
9. [Migration Path](#9-migration-path)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Executive Summary

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Lucide React
- **State**: Context API + Reducers (feature-sliced)
- **Persistence**: localStorage (MVP) → PostgreSQL (production)
- **Auth**: Real Google OAuth 2.0 with user approval workflow

### Core Features
1. **Multi-user system** with role-based access (Owner → Manager → Staff)
2. **Real Google OAuth** with user approval workflow for new users
3. **User Management Page** (Owner-only) for managing roles/permissions
4. **Inventory Management** with audit trails and Add/Remove with Balance
5. **Wire Diagram System** - interactive connector mapper (unique differentiator)
6. **Rental Calendar** with conflict detection
7. **Label Studio** - visual label designer with QR codes
8. **AI Command Parser** - natural language actions

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Management | Context + Reducers | Simpler than Redux, clean extraction path |
| Data Structure | Normalized + Indexed | DB-ready, fast lookups |
| Permissions | Hook-based RBAC | No prop drilling |
| Wire Diagrams | Declarative mappings | Flexible strategies, SVG output |
| Organization | Feature slices | Copy-paste extraction |
| Styling | Tailwind + Terminal theme | Rapid development, consistent aesthetic |

---

## 2. State Management

### Decision: Context API + Feature-Sliced Reducers

**Why not Redux?** For a single-file artifact that evolves to a larger app, Context + Reducers provides Redux-like predictability without the boilerplate. Clean extraction path to separate modules.

### Root State Shape

```typescript
type AppState = {
  auth: AuthState;
  inventory: InventoryState;
  rentals: RentalState;
  wireDiagrams: WireDiagramState;
  labels: LabelState;
};
```

### Context Pattern

```typescript
// Separate contexts for state and dispatch (performance optimization)
const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<React.Dispatch<Action> | null>(null);

// Custom hooks prevent prop drilling
function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
}

function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) throw new Error('useAppDispatch must be used within AppProvider');
  return context;
}

// Feature-specific hooks (clean abstraction)
function useInventory() { return useAppState().inventory; }
function useAuth() { return useAppState().auth; }
function useRentals() { return useAppState().rentals; }
```

### Action Types

```typescript
type Action =
  // Auth
  | { type: 'AUTH_LOGIN'; payload: User }
  | { type: 'AUTH_LOGOUT' }
  // Inventory
  | { type: 'INVENTORY_ADD_ITEM'; payload: InventoryItem }
  | { type: 'INVENTORY_UPDATE_ITEM'; payload: { id: string; changes: Partial<InventoryItem> } }
  | { type: 'INVENTORY_REMOVE_ITEM'; payload: { id: string; reason: RemovalReason; removedBy: string } }
  | { type: 'INVENTORY_BULK_IMPORT'; payload: InventoryItem[] }
  // Rentals
  | { type: 'RENTAL_CREATE'; payload: Rental }
  | { type: 'RENTAL_UPDATE_STATUS'; payload: { id: string; status: RentalStatus } }
  // Wire Diagrams
  | { type: 'WIRE_DIAGRAM_ADD'; payload: WireDiagram }
  // Labels
  | { type: 'LABEL_SAVE_DESIGN'; payload: LabelDesign };
```

### Feature-Sliced Reducer Pattern

```typescript
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // Auth slice
    case 'AUTH_LOGIN':
    case 'AUTH_LOGOUT':
      return { ...state, auth: authReducer(state.auth, action) };

    // Inventory slice
    case 'INVENTORY_ADD_ITEM':
    case 'INVENTORY_UPDATE_ITEM':
    case 'INVENTORY_REMOVE_ITEM':
      return { ...state, inventory: inventoryReducer(state.inventory, action) };

    // Rental slice
    case 'RENTAL_CREATE':
    case 'RENTAL_UPDATE_STATUS':
      return { ...state, rentals: rentalReducer(state.rentals, action) };

    default:
      return state;
  }
}

// Each sub-reducer handles its own domain
function inventoryReducer(state: InventoryState, action: Action): InventoryState {
  switch (action.type) {
    case 'INVENTORY_ADD_ITEM': {
      const item = action.payload;
      return {
        ...state,
        items: { ...state.items, [item.id]: item },
        itemsByLocation: {
          ...state.itemsByLocation,
          [item.locationId]: [...(state.itemsByLocation[item.locationId] || []), item.id]
        },
        itemsByCategory: {
          ...state.itemsByCategory,
          [item.categoryId]: [...(state.itemsByCategory[item.categoryId] || []), item.id]
        }
      };
    }
    // ... other cases
    default:
      return state;
  }
}
```

### Root Provider

```typescript
function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Persistence layer (localStorage for MVP, API later)
  useEffect(() => {
    localStorage.setItem('neonos_state', JSON.stringify(state));
  }, [state]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
```

### Migration Path

| Phase | State Strategy |
|-------|---------------|
| Phase 1 | All reducers in single file, localStorage persistence |
| Phase 2 | Extract each reducer to `src/state/*.ts` |
| Phase 3 | Replace with React Query for server state, keep hooks interface |
| Phase 4 | Full API integration with optimistic updates |

---

## 3. Data Model

### Core Entity Types

#### User & Auth

```typescript
type Role = 'owner' | 'manager' | 'staff';

type UserStatus = 'pending' | 'active' | 'blocked';

// Full user record with Google OAuth and permission management
type UserRecord = {
  id: string;
  googleId: string;                    // From Google OAuth
  email: string;
  name: string;
  avatar: string;
  role: Role;
  permissions: Permission[];           // Granular permissions (can override role defaults)
  status: UserStatus;                  // pending = awaiting approval
  requestedPermissions: Permission[];  // Permissions user has requested
  createdAt: string;                   // ISO 8601
  lastLoginAt: string;
};

// Permission request for the approval queue
type PermissionRequest = {
  id: string;
  userId: string;
  permission: Permission;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
};

type AuthState = {
  user: UserRecord | null;
  isAuthenticated: boolean;
  permissions: Set<Permission>;        // Computed from role + custom permissions
  pendingRequestCount: number;         // For notification badge (owners only)
};

// User management state
type UserManagementState = {
  users: Record<string, UserRecord>;
  usersByStatus: Record<UserStatus, string[]>;
  permissionRequests: Record<string, PermissionRequest>;
  pendingRequests: string[];           // Request IDs awaiting review
};
```

#### Inventory Item

```typescript
type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  locationId: string;

  // Quantity tracking
  quantity: number;
  availableQuantity: number; // quantity - rented quantity
  unit: 'each' | 'ft' | 'meter' | 'box' | 'set';

  // Rental info
  rentalRate: Money;
  rentalPeriod: 'day' | 'week' | 'month';

  // Media
  images: string[]; // URLs or base64 for MVP
  primaryImage: string | null;

  // Assignment (for permission-based removal)
  assignedTo: string | null; // User ID

  // Audit trail
  createdAt: string;
  createdBy: string;
  lastModified: string;
  lastModifiedBy: string;

  // Metadata
  tags: string[];
  customFields: Record<string, string | number | boolean>;
};

type Money = {
  amount: number;
  currency: 'USD';
};
```

#### Location (Hierarchical)

```typescript
type Location = {
  id: string;
  name: string;
  type: 'building' | 'room' | 'shelf' | 'bin' | 'vehicle';
  parentId: string | null; // Hierarchical locations

  // Future: Spatial data for 2D/3D maps
  coordinates?: { x: number; y: number; z?: number };
  mapImageUrl?: string;

  // Metadata
  capacity?: number;
  description?: string;
  color: string; // For visual coding in UI
};
```

#### Category

```typescript
type Category = {
  id: string;
  name: string;
  parentId: string | null; // Hierarchical categories
  icon: string; // Lucide icon name
  color: string; // Hex color for UI
  order: number;
};
```

#### Inventory Transaction (Audit Trail)

```typescript
type InventoryTransaction = {
  id: string;
  itemId: string;
  type: 'add' | 'remove' | 'adjust' | 'audit' | 'transfer';

  // Quantity changes
  quantityBefore: number;
  quantityAfter: number;
  quantityDelta: number;

  // Context
  reason: RemovalReason | AdditionReason | 'audit' | 'transfer';
  notes: string | null;

  // Location changes (for transfers)
  locationIdBefore?: string;
  locationIdAfter?: string;

  // Audit mode tracking (Add/Remove with Balance feature)
  isAuditMode?: boolean;
  expectedQuantity?: number; // Pre-audit expected count
  actualQuantity?: number;   // Post-audit actual count

  // Audit trail
  timestamp: string;
  userId: string;
};

type RemovalReason =
  | 'rental'
  | 'damaged'
  | 'lost'
  | 'stolen'
  | 'sold'
  | 'disposed'
  | 'transferred'
  | 'audit_correction';

type AdditionReason =
  | 'purchase'
  | 'return'
  | 'found'
  | 'transfer'
  | 'audit_correction';
```

#### Rental

```typescript
type Rental = {
  id: string;

  // Customer info
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;

  // Rental period
  startDate: string; // ISO 8601 date
  endDate: string;
  actualReturnDate: string | null;

  // Items
  items: RentalItem[];

  // Financial
  totalCost: Money;
  depositAmount: Money;
  depositReturned: boolean;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overdue';

  // Status
  status: RentalStatus;

  // Notes
  notes: string | null;
  internalNotes: string | null;

  // Audit trail
  createdAt: string;
  createdBy: string;
  lastModified: string;
  lastModifiedBy: string;
};

type RentalItem = {
  itemId: string;
  quantity: number;
  rate: Money;
  subtotal: Money;
};

type RentalStatus =
  | 'draft'
  | 'reserved'
  | 'active'
  | 'overdue'
  | 'returned'
  | 'cancelled';
```

### State Shape (Normalized + Indexed)

```typescript
type InventoryState = {
  items: Record<string, InventoryItem>;      // Normalized by ID
  locations: Record<string, Location>;
  categories: Record<string, Category>;
  transactions: Record<string, InventoryTransaction>;
  itemsByLocation: Record<string, string[]>; // Index: locationId → itemIds
  itemsByCategory: Record<string, string[]>; // Index: categoryId → itemIds
};

type RentalState = {
  rentals: Record<string, Rental>;
  rentalsByStatus: Record<RentalStatus, string[]>;
  rentalsByCustomer: Record<string, string[]>;
};
```

### Why Normalized?

1. **Direct database mapping**: Each entity maps to a SQL table
2. **Fast lookups**: O(1) access by ID
3. **Index maps**: Pre-computed relationships for common queries
4. **Immutable IDs**: UUIDs now, database PKs later
5. **Audit fields**: `createdAt`, `createdBy` already in place

---

## 4. User Management System

### Overview

NeonOS implements a complete user management system with real Google OAuth authentication and a permission request workflow. First-time users receive "pending" status with minimal permissions until approved by an Owner.

### Authentication Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Google OAuth   │────▶│  NeonOS Backend  │────▶│  User Database  │
│   Sign-In       │     │  (verify token)  │     │  (lookup/create)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Is existing user?     │
                    └───────────────────────┘
                         │           │
                        Yes          No
                         │           │
                         ▼           ▼
               ┌─────────────┐  ┌──────────────────┐
               │ Update      │  │ Create user with │
               │ lastLoginAt │  │ status='pending' │
               └─────────────┘  └──────────────────┘
                         │           │
                         ▼           ▼
                    ┌───────────────────────┐
                    │ Return JWT + user data│
                    └───────────────────────┘
```

### User Status Flow

```
       ┌────────────┐
       │  PENDING   │ ◄──── First-time login (minimal permissions)
       └────────────┘
             │
    Owner Approves│ Owner Blocks
             │         │
             ▼         ▼
       ┌────────────┐  ┌────────────┐
       │   ACTIVE   │  │  BLOCKED   │
       └────────────┘  └────────────┘
             │              ▲
             └──────────────┘
                Owner Blocks
```

### Google OAuth Implementation

```typescript
// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Frontend: Trigger Google OAuth
async function signInWithGoogle(): Promise<UserRecord> {
  const { credential } = await google.accounts.id.prompt();

  // Send credential to backend for verification
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });

  const { user, token } = await response.json();

  // Store JWT for subsequent requests
  localStorage.setItem('neonos_token', token);

  return user;
}

// Backend: Verify Google credential and create/update user
async function handleGoogleAuth(credential: string): Promise<{ user: UserRecord; token: string }> {
  // Verify the Google credential
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name;
  const avatar = payload.picture;

  // Check if user exists
  let user = await db.users.findByGoogleId(googleId);

  if (user) {
    // Update last login
    user = await db.users.update(user.id, { lastLoginAt: new Date().toISOString() });
  } else {
    // Create new user with pending status
    user = await db.users.create({
      googleId,
      email,
      name,
      avatar,
      role: 'staff',                    // Default role
      permissions: ['inventory.view'],  // Minimal default permissions
      status: 'pending',
      requestedPermissions: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
  }

  // Generate JWT
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  return { user, token };
}
```

### User Management Page (Owner Only)

```typescript
function UserManagementPage() {
  // Only accessible to owners
  const { hasPermission } = usePermission();
  if (!hasPermission('users.manage')) {
    return <AccessDenied />;
  }

  const { users, permissionRequests, pendingRequests } = useUserManagement();
  const dispatch = useAppDispatch();

  return (
    <div className="space-y-6">
      {/* Pending Approval Queue */}
      <TerminalPanel title="Pending Approvals">
        {users.filter(u => u.status === 'pending').map(user => (
          <UserApprovalCard
            key={user.id}
            user={user}
            onApprove={() => dispatch({ type: 'USER_APPROVE', payload: user.id })}
            onBlock={() => dispatch({ type: 'USER_BLOCK', payload: user.id })}
          />
        ))}
      </TerminalPanel>

      {/* Permission Requests */}
      <TerminalPanel title="Permission Requests">
        {pendingRequests.map(requestId => {
          const request = permissionRequests[requestId];
          const user = users[request.userId];
          return (
            <PermissionRequestCard
              key={requestId}
              request={request}
              user={user}
              onApprove={() => dispatch({
                type: 'PERMISSION_REQUEST_APPROVE',
                payload: { requestId, reviewNotes: '' }
              })}
              onDeny={(notes) => dispatch({
                type: 'PERMISSION_REQUEST_DENY',
                payload: { requestId, reviewNotes: notes }
              })}
            />
          );
        })}
      </TerminalPanel>

      {/* All Users Table */}
      <TerminalPanel title="All Users">
        <table className="w-full">
          <thead>
            <tr className="text-emerald-400 font-mono text-sm">
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(users).map(user => (
              <UserRow
                key={user.id}
                user={user}
                onRoleChange={(role) => dispatch({
                  type: 'USER_UPDATE_ROLE',
                  payload: { userId: user.id, role }
                })}
                onPermissionToggle={(permission, enabled) => dispatch({
                  type: 'USER_UPDATE_PERMISSIONS',
                  payload: { userId: user.id, permission, enabled }
                })}
                onStatusChange={(status) => dispatch({
                  type: 'USER_UPDATE_STATUS',
                  payload: { userId: user.id, status }
                })}
              />
            ))}
          </tbody>
        </table>
      </TerminalPanel>
    </div>
  );
}
```

### User Management Components

```typescript
// User row in management table
function UserRow({ user, onRoleChange, onPermissionToggle, onStatusChange }: UserRowProps) {
  const [showPermissions, setShowPermissions] = useState(false);

  return (
    <>
      <tr className="border-b border-slate-800">
        <td className="py-3">
          <div className="flex items-center gap-3">
            <img src={user.avatar} className="w-8 h-8 rounded-full" />
            <div>
              <div className="text-emerald-100 font-mono">{user.name}</div>
              <div className="text-slate-500 text-xs">{user.email}</div>
            </div>
          </div>
        </td>
        <td>
          <Select
            value={user.role}
            onChange={onRoleChange}
            options={[
              { value: 'owner', label: 'Owner' },
              { value: 'manager', label: 'Manager' },
              { value: 'staff', label: 'Staff' }
            ]}
          />
        </td>
        <td>
          <StatusBadge status={user.status} />
        </td>
        <td>
          <Button size="sm" variant="ghost" onClick={() => setShowPermissions(!showPermissions)}>
            {user.permissions.length} permissions
          </Button>
        </td>
        <td>
          <div className="flex gap-2">
            {user.status === 'pending' && (
              <Button size="sm" variant="primary" onClick={() => onStatusChange('active')}>
                Approve
              </Button>
            )}
            {user.status === 'active' && (
              <Button size="sm" variant="danger" onClick={() => onStatusChange('blocked')}>
                Block
              </Button>
            )}
            {user.status === 'blocked' && (
              <Button size="sm" variant="secondary" onClick={() => onStatusChange('active')}>
                Unblock
              </Button>
            )}
          </div>
        </td>
      </tr>
      {showPermissions && (
        <tr>
          <td colSpan={5} className="bg-slate-950 p-4">
            <PermissionCheckboxGrid
              permissions={user.permissions}
              onToggle={onPermissionToggle}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// Permission checkbox grid
function PermissionCheckboxGrid({ permissions, onToggle }: PermissionCheckboxGridProps) {
  const ALL_PERMISSIONS: { category: string; perms: Permission[] }[] = [
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

  return (
    <div className="grid grid-cols-5 gap-4">
      {ALL_PERMISSIONS.map(group => (
        <div key={group.category}>
          <h4 className="text-emerald-400 font-mono text-sm mb-2">{group.category}</h4>
          {group.perms.map(perm => (
            <label key={perm} className="flex items-center gap-2 text-sm text-slate-300 py-1">
              <input
                type="checkbox"
                checked={permissions.includes(perm)}
                onChange={(e) => onToggle(perm, e.target.checked)}
                className="rounded bg-slate-900 border-emerald-500/30 text-emerald-500"
              />
              {perm.split('.')[1]}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Permission Request Flow

```typescript
// User sees "Request Access" button when lacking permission
function PermissionRequestButton({ permission }: { permission: Permission }) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    dispatch({
      type: 'PERMISSION_REQUEST_CREATE',
      payload: {
        userId: user.id,
        permission,
        reason,
        requestedAt: new Date().toISOString()
      }
    });
    setShowModal(false);
    setReason('');
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
        <Lock size={14} /> Request Access
      </Button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Request Permission">
        <div className="space-y-4">
          <div className="text-emerald-100 font-mono">
            Requesting: <span className="text-amber-400">{permission}</span>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why do you need this permission?"
            className="w-full bg-slate-900 border border-emerald-500/30 text-emerald-100 p-3 rounded font-mono"
            rows={4}
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!reason.trim()}>
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// Modified PermissionGate to show request button for denied users
function PermissionGate({
  permission,
  fallback = null,
  showRequestButton = false,
  children
}: {
  permission: Permission | Permission[];
  fallback?: React.ReactNode;
  showRequestButton?: boolean;
  children: React.ReactNode;
}) {
  const { hasPermission, hasAnyPermission } = usePermission();
  const { user } = useAuth();

  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);

  if (allowed) return <>{children}</>;

  if (showRequestButton && user?.status === 'active') {
    return (
      <div className="inline-flex items-center gap-2">
        {fallback}
        <PermissionRequestButton permission={perms[0]} />
      </div>
    );
  }

  return <>{fallback}</>;
}
```

### User Management Actions

```typescript
type UserAction =
  | { type: 'USER_LOGIN'; payload: UserRecord }
  | { type: 'USER_LOGOUT' }
  | { type: 'USER_APPROVE'; payload: string }
  | { type: 'USER_BLOCK'; payload: string }
  | { type: 'USER_UPDATE_ROLE'; payload: { userId: string; role: Role } }
  | { type: 'USER_UPDATE_PERMISSIONS'; payload: { userId: string; permission: Permission; enabled: boolean } }
  | { type: 'USER_UPDATE_STATUS'; payload: { userId: string; status: UserStatus } }
  | { type: 'PERMISSION_REQUEST_CREATE'; payload: Omit<PermissionRequest, 'id' | 'status' | 'reviewedAt' | 'reviewedBy' | 'reviewNotes'> }
  | { type: 'PERMISSION_REQUEST_APPROVE'; payload: { requestId: string; reviewNotes: string } }
  | { type: 'PERMISSION_REQUEST_DENY'; payload: { requestId: string; reviewNotes: string } };

function userManagementReducer(state: UserManagementState, action: UserAction): UserManagementState {
  switch (action.type) {
    case 'USER_APPROVE': {
      const userId = action.payload;
      const user = state.users[userId];
      return {
        ...state,
        users: {
          ...state.users,
          [userId]: { ...user, status: 'active' }
        },
        usersByStatus: {
          ...state.usersByStatus,
          pending: state.usersByStatus.pending.filter(id => id !== userId),
          active: [...state.usersByStatus.active, userId]
        }
      };
    }

    case 'USER_UPDATE_ROLE': {
      const { userId, role } = action.payload;
      const user = state.users[userId];
      // Get base permissions for new role
      const basePermissions = ROLE_PERMISSIONS[role];
      return {
        ...state,
        users: {
          ...state.users,
          [userId]: {
            ...user,
            role,
            permissions: basePermissions // Reset to role defaults
          }
        }
      };
    }

    case 'USER_UPDATE_PERMISSIONS': {
      const { userId, permission, enabled } = action.payload;
      const user = state.users[userId];
      const newPermissions = enabled
        ? [...user.permissions, permission]
        : user.permissions.filter(p => p !== permission);
      return {
        ...state,
        users: {
          ...state.users,
          [userId]: { ...user, permissions: newPermissions }
        }
      };
    }

    case 'PERMISSION_REQUEST_CREATE': {
      const requestId = `req-${Date.now()}`;
      const request: PermissionRequest = {
        id: requestId,
        ...action.payload,
        status: 'pending',
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: null
      };
      return {
        ...state,
        permissionRequests: {
          ...state.permissionRequests,
          [requestId]: request
        },
        pendingRequests: [...state.pendingRequests, requestId]
      };
    }

    case 'PERMISSION_REQUEST_APPROVE': {
      const { requestId, reviewNotes } = action.payload;
      const request = state.permissionRequests[requestId];
      const user = state.users[request.userId];

      return {
        ...state,
        users: {
          ...state.users,
          [request.userId]: {
            ...user,
            permissions: [...user.permissions, request.permission],
            requestedPermissions: user.requestedPermissions.filter(p => p !== request.permission)
          }
        },
        permissionRequests: {
          ...state.permissionRequests,
          [requestId]: {
            ...request,
            status: 'approved',
            reviewedAt: new Date().toISOString(),
            reviewNotes
          }
        },
        pendingRequests: state.pendingRequests.filter(id => id !== requestId)
      };
    }

    // ... other cases
    default:
      return state;
  }
}
```

### Notification Badge for Owners

```typescript
function Header() {
  const { user } = useAuth();
  const { pendingRequests } = useUserManagement();
  const { hasPermission } = usePermission();

  const pendingCount = hasPermission('users.manage')
    ? pendingRequests.length
    : 0;

  return (
    <header className="bg-slate-900 border-b border-emerald-500/30 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* ... other header content ... */}

        {hasPermission('users.manage') && (
          <NavLink to="/users" className="relative">
            <Users size={20} className="text-slate-400 hover:text-emerald-400" />
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        )}

        <UserMenu />
      </div>
    </header>
  );
}
```

### Pending User Experience

```typescript
// Component shown to pending users
function PendingApprovalScreen() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <TerminalPanel title="Account Pending Approval">
        <div className="text-center space-y-4 p-8">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
            <Clock size={40} className="text-amber-400" />
          </div>

          <h2 className="text-emerald-100 font-mono text-xl">
            Welcome, {user?.name}!
          </h2>

          <p className="text-slate-400 font-mono">
            Your account is pending approval by an administrator.
            You'll receive access once your account is approved.
          </p>

          <div className="bg-slate-900 rounded p-4 text-left">
            <div className="text-slate-500 text-sm font-mono mb-2">Account Details:</div>
            <div className="text-emerald-100 font-mono">{user?.email}</div>
            <div className="text-slate-500 text-xs font-mono mt-1">
              Registered: {new Date(user?.createdAt || '').toLocaleDateString()}
            </div>
          </div>

          <Button variant="secondary" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </TerminalPanel>
    </div>
  );
}

// App wrapper that checks user status
function AppWithAuth() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (user?.status === 'pending') {
    return <PendingApprovalScreen />;
  }

  if (user?.status === 'blocked') {
    return <BlockedUserScreen />;
  }

  return <MainApp />;
}
```

---

## 5. Wire Diagram System

### Overview

The Wire Diagram System is NeonOS's unique differentiator - something Notion/Airtable can't do. It provides:

1. **Connector Library**: Pre-loaded diagrams for XLR, Phoenix, RJ45, DMX, PowerCon
2. **Interactive Matcher**: Select source + wire colors → generate termination map
3. **Multi-Diagram Combiner**: Chain connectors for complete signal paths
4. **Visual SVG Generator**: Create printable wire diagrams

### Data Model

#### Connector

```typescript
type Connector = {
  id: string;
  name: string; // "XLR Male 3-Pin", "Phoenix 5-pin Terminal"
  type: ConnectorType;
  manufacturer: string | null;
  partNumber: string | null;

  // Pin/terminal configuration
  pins: Pin[];

  // Visual representation
  diagramSvg: string; // SVG markup
  thumbnailUrl: string;

  // Metadata
  category: 'audio' | 'video' | 'power' | 'data' | 'lighting';
  tags: string[];
};

type ConnectorType = 'xlr' | 'phoenix' | 'rj45' | 'dmx' | 'powercon' | 'ethercon' | 'custom';

type Pin = {
  id: string;
  number: number | string; // "1", "A", "TIP"
  label: string;           // "Ground", "Hot", "Data+"
  function: string | null; // Descriptive function
  color: string | null;    // Standard wire color (if applicable)
  position: { x: number; y: number }; // Position in SVG diagram
};
```

#### Wire Mapping

```typescript
type WireMapping = {
  id: string;
  name: string; // "XLR to Phoenix - Standard Audio"
  description: string | null;

  sourceConnectorId: string;
  destinationConnectorId: string;

  // Pin mappings
  pinMappings: PinMapping[];

  // Wire specification
  wireSpec: WireSpec;

  // Metadata
  createdAt: string;
  createdBy: string;
  isStandard: boolean; // Pre-defined vs custom
  category: string;
  tags: string[];
};

type PinMapping = {
  sourcePin: string;      // Pin ID from source connector
  destinationPin: string; // Pin ID from destination connector
  wireColor: string;      // Physical wire color to use
  wireFunction: string;   // "Audio Left", "Ground", "Data+"
  notes: string | null;
};

type WireSpec = {
  gauge: string;      // "22 AWG", "16 AWG"
  type: 'stranded' | 'solid';
  shielded: boolean;
  cableType: string | null; // "Cat6", "Audio Snake"
  manufacturer: string | null;
};
```

#### Wire Diagram (Saved Output)

```typescript
type WireDiagram = {
  id: string;
  name: string;
  description: string | null;

  // Can be single mapping or chain
  type: 'simple' | 'chain';
  mapping?: WireMapping;     // For simple diagrams
  chain?: ChainSegment[];    // For chained diagrams

  // Visual output
  diagramSvg: string;        // Generated SVG
  printLayout: 'portrait' | 'landscape';

  // Metadata
  createdAt: string;
  createdBy: string;
  tags: string[];
};

type ChainSegment = {
  id: string;
  mapping: WireMapping;
  order: number;
};
```

### Wire Diagram Engine

```typescript
class WireDiagramEngine {
  /**
   * Generate pin mappings from interactive selection
   */
  static generateMapping(
    sourceConnector: Connector,
    wireSelections: WireColorSelection[],
    destinationConnector: Connector,
    strategy: MappingStrategy
  ): PinMapping[] {
    switch (strategy) {
      case 'sequential':
        // Map wires in order to pins in order
        return wireSelections.map((wire, index) => ({
          sourcePin: sourceConnector.pins[index]?.id,
          destinationPin: destinationConnector.pins[index]?.id,
          wireColor: wire.wireColor,
          wireFunction: wire.sourceFunction || sourceConnector.pins[index]?.label,
          notes: null
        })).filter(m => m.sourcePin && m.destinationPin);

      case 'function-based':
        // Match pins by function/label
        return wireSelections.map(wire => {
          const sourcePin = sourceConnector.pins.find(p =>
            p.function === wire.sourceFunction || p.label === wire.sourceFunction
          );
          const destPin = destinationConnector.pins.find(p =>
            p.function === wire.sourceFunction || p.label === wire.sourceFunction
          );
          return sourcePin && destPin ? {
            sourcePin: sourcePin.id,
            destinationPin: destPin.id,
            wireColor: wire.wireColor,
            wireFunction: wire.sourceFunction || sourcePin.label,
            notes: null
          } : null;
        }).filter(Boolean);

      case 'color-based':
        // Match pins by standard wire color
        return wireSelections.map(wire => {
          const sourcePin = sourceConnector.pins.find(p => p.color === wire.wireColor);
          const destPin = destinationConnector.pins.find(p => p.color === wire.wireColor);
          return sourcePin && destPin ? {
            sourcePin: sourcePin.id,
            destinationPin: destPin.id,
            wireColor: wire.wireColor,
            wireFunction: sourcePin.label,
            notes: null
          } : null;
        }).filter(Boolean);
    }
  }

  /**
   * Generate visual SVG diagram from mapping
   */
  static generateDiagramSVG(
    mapping: WireMapping,
    connectors: { source: Connector; dest: Connector }
  ): string {
    // SVG generation logic - draws connectors on each side
    // with bezier curves connecting mapped pins
    // Color-coded by wire color
  }

  /**
   * Chain multiple mappings together
   */
  static chainMappings(mappings: WireMapping[]): WireDiagram {
    // Validate: each dest connector must match next source connector
    // Create chain segments with order
  }
}

type MappingStrategy = 'sequential' | 'function-based' | 'color-based';

type WireColorSelection = {
  wireColor: string;
  sourceFunction: string | null;
};
```

### Pre-loaded Connector Library

```typescript
const INITIAL_CONNECTORS: Connector[] = [
  {
    id: 'xlr-male-3pin',
    name: 'XLR Male 3-Pin',
    type: 'xlr',
    pins: [
      { id: 'pin1', number: 1, label: 'Ground', function: 'Shield/Ground', color: 'black', position: { x: 100, y: 150 } },
      { id: 'pin2', number: 2, label: 'Hot (+)', function: 'Signal Hot', color: 'red', position: { x: 80, y: 100 } },
      { id: 'pin3', number: 3, label: 'Cold (-)', function: 'Signal Cold', color: 'white', position: { x: 120, y: 100 } }
    ],
    diagramSvg: '...',
    category: 'audio',
    tags: ['xlr', 'balanced', 'audio']
  },
  {
    id: 'phoenix-5pin',
    name: 'Phoenix 5-Pin Terminal',
    type: 'phoenix',
    pins: [
      { id: 'term1', number: 1, label: 'Term 1', function: 'Configurable', position: { x: 20, y: 50 } },
      { id: 'term2', number: 2, label: 'Term 2', function: 'Configurable', position: { x: 50, y: 50 } },
      // ... more terminals
    ],
    diagramSvg: '...',
    category: 'data',
    tags: ['phoenix', 'terminal', 'screw']
  },
  // RJ45, DMX 5-pin, PowerCon, etc.
];
```

### User Flow

```
1. Select Source Connector (dropdown with visual preview)
      ↓
2. Pick Wire Colors (color picker + function annotation)
      ↓
3. Select Destination Connector (dropdown with visual preview)
      ↓
4. Choose Mapping Strategy (sequential/function-based/color-based)
      ↓
5. Generate Termination Map (table view + SVG preview)
      ↓
6. Save/Print/Chain to another segment
```

---

## 6. UI/UX Design System

### Overview

This section defines the visual design standards, spacing rules, and layout patterns to ensure a consistent, polished UI across all NeonOS pages. All components must follow these guidelines.

### Global Layout Rules

#### Page Structure

Every page MUST follow this structure:

```typescript
function PageTemplate({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Fixed Header */}
      <Header />

      {/* Sidebar + Content */}
      <div className="flex">
        <Sidebar />

        {/* Main Content Area - ALWAYS has padding */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-mono text-emerald-400 tracking-wide">
              {title}
            </h1>
          </div>

          {/* Page Content - with max-width for readability */}
          <div className="max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

#### Spacing Constants

```typescript
const SPACING = {
  // Page padding
  page: 'p-6 lg:p-8',

  // Section spacing
  sectionGap: 'space-y-8',        // Between major sections
  cardGap: 'gap-4 lg:gap-6',      // Between cards in a grid

  // Card internal padding
  cardPadding: 'p-4 lg:p-5',
  cardPaddingLarge: 'p-5 lg:p-6',

  // Element spacing
  elementGap: 'space-y-4',        // Between form elements
  inlineGap: 'gap-3',             // Between inline elements

  // Margins
  sectionMargin: 'mb-6',
  headerMargin: 'mb-4',
};
```

### Card Component Standards

#### Base Card

ALL cards must have:
- Border with subtle glow
- Proper padding
- Header section with background
- Never touch screen edges

```typescript
function Card({
  title,
  icon: Icon,
  headerAction,
  children,
  variant = 'default'
}: CardProps) {
  const variants = {
    default: 'border-emerald-500/30',
    highlight: 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    warning: 'border-amber-500/30',
    danger: 'border-red-500/30',
  };

  return (
    <div className={`
      bg-slate-900/50
      border ${variants[variant]}
      rounded-lg
      overflow-hidden
    `}>
      {/* Card Header - ALWAYS has background */}
      {title && (
        <div className="
          bg-slate-900
          border-b border-emerald-500/20
          px-4 py-3
          flex items-center justify-between
        ">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="text-emerald-500" />}
            <h3 className="font-mono text-emerald-400 text-sm uppercase tracking-wider">
              {title}
            </h3>
          </div>
          {headerAction}
        </div>
      )}

      {/* Card Content - consistent padding */}
      <div className="p-4 lg:p-5">
        {children}
      </div>
    </div>
  );
}
```

#### Stat Card (Dashboard)

```typescript
function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'emerald'
}: StatCardProps) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  };

  return (
    <div className={`
      bg-slate-900/50
      border border-slate-700/50
      rounded-lg
      p-5
      hover:border-emerald-500/30
      transition-colors
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={`text-xs font-mono ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      <div className="text-2xl font-mono text-white mb-1">
        {value}
      </div>

      <div className="text-sm text-slate-500 font-mono uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
```

### Dashboard Layout

The dashboard uses a grid-based layout with clear sections:

```typescript
function Dashboard() {
  return (
    <PageTemplate title="Dashboard">
      {/* Stats Row - 4 columns on large screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Low Stock" value={6} color="amber" />
        <StatCard icon={Calendar} label="Active Rentals" value={3} color="cyan" />
        <StatCard icon={ClipboardList} label="Pending Tasks" value={5} color="emerald" />
        <StatCard icon={AlertTriangle} label="Overdue" value={1} color="red" />
      </div>

      {/* Two-column layout for main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <Card title="Recent Activity" icon={Activity}>
          <ActivityList items={recentActivity} />
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" icon={Zap}>
          <QuickActionGrid />
        </Card>
      </div>

      {/* Full-width sections */}
      <div className="space-y-6">
        <Card title="Upcoming Rentals" icon={Calendar}>
          <RentalTable rentals={upcomingRentals} />
        </Card>

        <Card title="Pending Tasks" icon={ClipboardList}>
          <TaskList tasks={pendingTasks} />
        </Card>
      </div>
    </PageTemplate>
  );
}
```

### Wire Diagram Page Layout

The wire diagram page needs clear visual separation between sections:

```typescript
function WireDiagramPage() {
  return (
    <PageTemplate title="Wire Diagram System">
      <div className="space-y-8">
        {/* Section 1: Source Connector Selection */}
        <Card title="1. Source Connector" icon={Cable}>
          <ConnectorSelector
            selected={sourceConnector}
            onSelect={setSourceConnector}
          />
        </Card>

        {/* Section 2: Wire Color Selection - FIXED LAYOUT */}
        <Card title="2. Wire Colors" icon={Palette}>
          <p className="text-slate-400 text-sm mb-4">
            Click to select wires found in your cable:
          </p>

          {/* Wire Color Grid - 4 columns, proper spacing */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {WIRE_COLORS.map(color => (
              <WireColorCheckbox
                key={color.name}
                color={color}
                checked={selectedColors.includes(color.name)}
                onChange={() => toggleColor(color.name)}
              />
            ))}
          </div>
        </Card>

        {/* Section 3: Destination Connector */}
        <Card title="3. Destination Connector" icon={Cable}>
          <ConnectorSelector
            selected={destConnector}
            onSelect={setDestConnector}
          />
        </Card>

        {/* Generate Button - Centered, prominent */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            icon={Sparkles}
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            Generate Termination Map
          </Button>
        </div>

        {/* Section 4: Results */}
        {terminationMap && (
          <Card title="Termination Map" icon={Table} variant="highlight">
            <TerminationMapTable mapping={terminationMap} />
          </Card>
        )}

        {/* Connector Library - Bottom section */}
        <Card title="Connector Library" icon={Library}>
          <ConnectorLibraryGrid connectors={connectors} />
        </Card>
      </div>
    </PageTemplate>
  );
}
```

#### Wire Color Checkbox Component

```typescript
function WireColorCheckbox({
  color,
  checked,
  onChange
}: WireColorCheckboxProps) {
  return (
    <button
      onClick={onChange}
      className={`
        flex items-center gap-2
        p-3
        rounded-lg
        border
        transition-all
        ${checked
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
        }
      `}
    >
      {/* Color swatch */}
      <div
        className="w-5 h-5 rounded-full border border-slate-600"
        style={{ backgroundColor: color.hex }}
      />

      {/* Label */}
      <span className={`
        text-sm font-mono
        ${checked ? 'text-emerald-400' : 'text-slate-400'}
      `}>
        {color.name}
      </span>

      {/* Checkmark */}
      {checked && (
        <Check size={14} className="text-emerald-400 ml-auto" />
      )}
    </button>
  );
}
```

#### Connector Library Grid

```typescript
function ConnectorLibraryGrid({ connectors }: { connectors: Connector[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {connectors.map(connector => (
        <div
          key={connector.id}
          className="
            bg-slate-800/50
            border border-slate-700/50
            rounded-lg
            p-4
            hover:border-emerald-500/30
            transition-colors
            cursor-pointer
          "
        >
          {/* Connector thumbnail */}
          <div className="
            bg-slate-900
            rounded
            p-4
            mb-3
            flex
            items-center
            justify-center
            min-h-[80px]
          ">
            <img
              src={connector.thumbnailUrl}
              alt={connector.name}
              className="max-h-16 object-contain"
            />
          </div>

          {/* Connector info */}
          <h4 className="font-mono text-emerald-400 text-sm mb-1">
            {connector.name}
          </h4>
          <p className="text-slate-500 text-xs font-mono">
            {connector.pins.length} pins • {connector.category}
          </p>
        </div>
      ))}
    </div>
  );
}
```

#### Termination Map Table

```typescript
function TerminationMapTable({ mapping }: { mapping: PinMapping[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-emerald-400 font-mono text-sm uppercase tracking-wide">
              Source Pin
            </th>
            <th className="text-left py-3 px-4 text-emerald-400 font-mono text-sm uppercase tracking-wide">
              Wire Color
            </th>
            <th className="text-left py-3 px-4 text-emerald-400 font-mono text-sm uppercase tracking-wide">
              Function
            </th>
            <th className="text-left py-3 px-4 text-emerald-400 font-mono text-sm uppercase tracking-wide">
              Dest Pin
            </th>
          </tr>
        </thead>
        <tbody>
          {mapping.map((pin, idx) => (
            <tr
              key={idx}
              className="border-b border-slate-800 hover:bg-slate-800/30"
            >
              <td className="py-3 px-4 font-mono text-slate-300">
                {pin.sourcePin}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-slate-600"
                    style={{ backgroundColor: pin.wireColor }}
                  />
                  <span className="font-mono text-slate-300 text-sm">
                    {pin.wireColorName}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 font-mono text-amber-400 text-sm">
                {pin.wireFunction}
              </td>
              <td className="py-3 px-4 font-mono text-slate-300">
                {pin.destinationPin}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Table Standards

All tables must follow this pattern:

```typescript
function DataTable<T>({
  columns,
  data,
  onRowClick
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* Header - subtle background, uppercase labels */}
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900/50">
            {columns.map(col => (
              <th
                key={col.key}
                className="
                  text-left
                  py-3 px-4
                  text-emerald-400
                  font-mono
                  text-xs
                  uppercase
                  tracking-wider
                "
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body - proper row spacing and hover states */}
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className="
                border-b border-slate-800/50
                hover:bg-slate-800/30
                transition-colors
                cursor-pointer
              "
            >
              {columns.map(col => (
                <td key={col.key} className="py-3 px-4">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### List Component Standards

```typescript
function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="
            flex items-start gap-3
            p-3
            bg-slate-800/30
            rounded-lg
            border border-slate-800
          "
        >
          {/* Icon */}
          <div className={`
            p-2 rounded-lg
            ${item.type === 'add' ? 'bg-emerald-500/10 text-emerald-400' : ''}
            ${item.type === 'rental' ? 'bg-cyan-500/10 text-cyan-400' : ''}
            ${item.type === 'adjust' ? 'bg-amber-500/10 text-amber-400' : ''}
          `}>
            <item.icon size={16} />
          </div>

          {/* Content */}
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
  );
}
```

### Button Standards

```typescript
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled,
  onClick
}: ButtonProps) {
  const variants = {
    primary: `
      bg-emerald-500 hover:bg-emerald-400
      text-slate-900 font-semibold
      shadow-[0_0_15px_rgba(16,185,129,0.3)]
      hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]
    `,
    secondary: `
      bg-slate-800 hover:bg-slate-700
      text-emerald-400
      border border-emerald-500/30
    `,
    ghost: `
      bg-transparent hover:bg-slate-800
      text-slate-400 hover:text-emerald-400
    `,
    danger: `
      bg-red-500/10 hover:bg-red-500/20
      text-red-400
      border border-red-500/30
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        font-mono uppercase tracking-wider
        rounded-lg
        transition-all
        flex items-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  );
}
```

### Sidebar Navigation

```typescript
function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Plus, label: 'New Item', path: '/new-item' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Cable, label: 'Wire Diagrams', path: '/wire-diagrams' },
    { icon: Calendar, label: 'Rentals', path: '/rentals' },
    { icon: Tag, label: 'Labels', path: '/labels' },
  ];

  return (
    <aside className="
      w-56
      bg-slate-900
      border-r border-slate-800
      min-h-screen
      p-4
    ">
      {/* Logo */}
      <div className="mb-8 px-2">
        <h1 className="font-mono text-emerald-400 text-xl tracking-wider">
          NEON<span className="text-amber-400">OS</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3
              px-3 py-2.5
              rounded-lg
              font-mono text-sm
              transition-colors
              ${isActive
                ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
              }
            `}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section at bottom */}
      <div className="absolute bottom-4 left-4 right-4">
        <UserMenuCompact />
      </div>
    </aside>
  );
}
```

### Form Input Standards

```typescript
function Input({
  label,
  value,
  onChange,
  placeholder,
  error,
  icon: Icon
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-mono text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
        )}
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full
            bg-slate-800/50
            border ${error ? 'border-red-500/50' : 'border-slate-700'}
            rounded-lg
            px-4 py-2.5
            ${Icon ? 'pl-10' : ''}
            font-mono text-slate-200
            placeholder:text-slate-600
            focus:outline-none focus:border-emerald-500/50
            focus:ring-1 focus:ring-emerald-500/20
            transition-colors
          `}
        />
      </div>
      {error && (
        <p className="text-red-400 text-xs font-mono">{error}</p>
      )}
    </div>
  );
}
```

### Color Palette Reference

```typescript
const COLORS = {
  // Backgrounds
  bgPrimary: 'bg-slate-950',      // Main page background
  bgSecondary: 'bg-slate-900',    // Cards, sidebar
  bgTertiary: 'bg-slate-800',     // Inputs, hover states

  // Borders
  borderSubtle: 'border-slate-800',
  borderDefault: 'border-slate-700',
  borderAccent: 'border-emerald-500/30',
  borderHighlight: 'border-emerald-500/50',

  // Text
  textPrimary: 'text-slate-200',
  textSecondary: 'text-slate-400',
  textMuted: 'text-slate-500',
  textAccent: 'text-emerald-400',
  textWarning: 'text-amber-400',
  textDanger: 'text-red-400',
  textInfo: 'text-cyan-400',

  // Accent colors for data visualization
  accent1: '#10b981', // emerald-500
  accent2: '#f59e0b', // amber-500
  accent3: '#06b6d4', // cyan-500
  accent4: '#ef4444', // red-500
  accent5: '#8b5cf6', // violet-500
};
```

### Responsive Breakpoints

```typescript
const BREAKPOINTS = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};

// Usage in Tailwind classes:
// - Default (mobile-first): base styles
// - sm: styles for 640px+
// - lg: styles for 1024px+
// Example: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
```

### Critical Layout Rules Checklist

- [ ] All pages use `PageTemplate` wrapper with `p-6` padding
- [ ] Cards have `rounded-lg border` with proper padding
- [ ] Grid gaps are consistent: `gap-4` or `gap-6`
- [ ] Tables have header backgrounds and row hover states
- [ ] Section headers use uppercase tracking-wider style
- [ ] Buttons have proper variants and sizes
- [ ] Forms have labeled inputs with focus states
- [ ] Lists have item spacing with `space-y-3`
- [ ] Colors follow the palette - no random hex values
- [ ] Responsive: grid columns adjust at breakpoints

---

## 7. Component Architecture

### Single-File Organization Strategy

The single-file artifact uses clear comment boundaries that map directly to future file structure. Each section can be copy-pasted to its own file with zero logic changes.

```typescript
// ============================================================================
// NeonOS - Cyber-Industrial Inventory/Rental ERP
// Single-file MVP - Organized for easy extraction
// ============================================================================

import React, { createContext, useContext, useReducer, useState, useCallback, useEffect } from 'react';
import { Package, Calendar, Cable, Tag, Terminal, User, LogOut, Plus, Search, Filter } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
// Future: src/types/index.ts

type User = { /* ... */ };
type Permission = /* ... */;
type InventoryItem = { /* ... */ };
type Rental = { /* ... */ };
type Connector = { /* ... */ };
type WireMapping = { /* ... */ };
type LabelDesign = { /* ... */ };
// ... all types

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
// Future: src/config/index.ts

const ROLE_PERMISSIONS: Record<Role, Permission[]> = { /* ... */ };
const INITIAL_STATE: AppState = { /* ... */ };
const INITIAL_CONNECTORS: Connector[] = [ /* ... */ ];

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// --- Auth State ---
// Future: src/state/auth.ts
type AuthState = { /* ... */ };
function authReducer(state: AuthState, action: Action): AuthState { /* ... */ }

// --- Inventory State ---
// Future: src/state/inventory.ts
type InventoryState = { /* ... */ };
function inventoryReducer(state: InventoryState, action: Action): InventoryState { /* ... */ }

// --- Rental State ---
// Future: src/state/rentals.ts

// --- Wire Diagram State ---
// Future: src/state/wireDiagrams.ts

// --- Label State ---
// Future: src/state/labels.ts

// --- Root Reducer ---
function appReducer(state: AppState, action: Action): AppState { /* ... */ }

// ============================================================================
// CONTEXT PROVIDERS
// ============================================================================
// Future: src/context/

const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<React.Dispatch<Action> | null>(null);

function AppProvider({ children }: { children: React.ReactNode }) { /* ... */ }

// ============================================================================
// CUSTOM HOOKS
// ============================================================================
// Future: src/hooks/

function useAppState() { /* ... */ }
function useAppDispatch() { /* ... */ }
function useInventory() { /* ... */ }
function useAuth() { /* ... */ }
function usePermission() { /* ... */ }
function useSecureDispatch() { /* ... */ }

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
// Future: src/utils/

function generateId(): string { /* ... */ }
function formatDate(date: string): string { /* ... */ }
function formatMoney(money: Money): string { /* ... */ }

// ============================================================================
// UI COMPONENTS - SHARED
// ============================================================================
// Future: src/components/shared/

function Button({ children, variant, onClick, disabled }: ButtonProps) { /* ... */ }
function Card({ children, title }: CardProps) { /* ... */ }
function Input({ label, value, onChange }: InputProps) { /* ... */ }
function Select({ label, options, value, onChange }: SelectProps) { /* ... */ }
function Modal({ isOpen, onClose, title, children }: ModalProps) { /* ... */ }
function TerminalHeader({ children }: { children: React.ReactNode }) { /* ... */ }
function TerminalPanel({ title, children }: { title: string; children: React.ReactNode }) { /* ... */ }

// ============================================================================
// FEATURE: AUTHENTICATION
// ============================================================================
// Future: src/features/auth/

function LoginScreen() { /* ... */ }
function UserMenu() { /* ... */ }

// ============================================================================
// FEATURE: INVENTORY
// ============================================================================
// Future: src/features/inventory/

function InventoryList() { /* ... */ }
function InventoryItemCard({ item }: { item: InventoryItem }) { /* ... */ }
function ItemFormModal({ item, isOpen, onClose }: ItemFormModalProps) { /* ... */ }
function InventoryToolbar() { /* ... */ }
function AuditModePanel() { /* ... */ }

// ============================================================================
// FEATURE: RENTALS
// ============================================================================
// Future: src/features/rentals/

function RentalCalendar() { /* ... */ }
function RentalForm() { /* ... */ }
function RentalList() { /* ... */ }
function ConflictWarning({ conflicts }: { conflicts: RentalConflict[] }) { /* ... */ }

// ============================================================================
// FEATURE: WIRE DIAGRAMS
// ============================================================================
// Future: src/features/wireDiagrams/

function WireDiagramLibrary() { /* ... */ }
function ConnectorSelector({ selected, onSelect }: ConnectorSelectorProps) { /* ... */ }
function WireColorPicker({ selections, onChange }: WireColorPickerProps) { /* ... */ }
function WireMatcherTool() { /* ... */ }
function WireDiagramEditor() { /* ... */ }
function TerminationMapTable({ mapping }: { mapping: PinMapping[] }) { /* ... */ }

// ============================================================================
// FEATURE: LABELS
// ============================================================================
// Future: src/features/labels/

function LabelStudio() { /* ... */ }
function LabelCanvas({ design, onUpdate }: LabelCanvasProps) { /* ... */ }
function LabelElementToolbar() { /* ... */ }
function QRCodeElement({ data }: { data: string }) { /* ... */ }

// ============================================================================
// FEATURE: AI COMMAND PARSER
// ============================================================================
// Future: src/features/aiCommands/

function CommandBar() { /* ... */ }
function parseCommand(input: string): ParsedCommand { /* ... */ }

// ============================================================================
// LAYOUT & NAVIGATION
// ============================================================================
// Future: src/components/layout/

function MainLayout({ children }: { children: React.ReactNode }) { /* ... */ }
function Navbar() { /* ... */ }
function NavTab({ tab, active, onClick, children }: NavTabProps) { /* ... */ }

// ============================================================================
// ROOT APP COMPONENT
// ============================================================================

function App() { /* ... */ }

// ============================================================================
// ROOT RENDER
// ============================================================================

function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

export default Root;
```

### Future File Structure (Phase 2)

```
src/
├── types/
│   └── index.ts           # All TypeScript types
├── config/
│   └── index.ts           # Constants, initial data
├── state/
│   ├── auth.ts            # Auth reducer + actions
│   ├── inventory.ts       # Inventory reducer + actions
│   ├── rentals.ts         # Rentals reducer + actions
│   ├── wireDiagrams.ts    # Wire diagram reducer + actions
│   ├── labels.ts          # Labels reducer + actions
│   └── store.ts           # Root reducer + provider
├── hooks/
│   ├── usePermission.ts
│   ├── useSecureDispatch.ts
│   └── useDebounce.ts
├── utils/
│   ├── id.ts              # ID generation
│   ├── date.ts            # Date formatting
│   └── money.ts           # Currency formatting
├── components/
│   ├── shared/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   └── Terminal.tsx   # TerminalHeader, TerminalPanel
│   └── layout/
│       ├── MainLayout.tsx
│       └── Navbar.tsx
├── features/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── UserMenu.tsx
│   ├── inventory/
│   │   ├── InventoryList.tsx
│   │   ├── InventoryItemCard.tsx
│   │   ├── ItemFormModal.tsx
│   │   └── AuditModePanel.tsx
│   ├── rentals/
│   │   ├── RentalCalendar.tsx
│   │   ├── RentalForm.tsx
│   │   └── RentalList.tsx
│   ├── wireDiagrams/
│   │   ├── WireDiagramLibrary.tsx
│   │   ├── WireMatcherTool.tsx
│   │   ├── WireDiagramEditor.tsx
│   │   └── engine.ts      # WireDiagramEngine class
│   ├── labels/
│   │   ├── LabelStudio.tsx
│   │   └── LabelCanvas.tsx
│   └── aiCommands/
│       ├── CommandBar.tsx
│       └── parser.ts
├── App.tsx
└── main.tsx
```

### Terminal Aesthetic Components

```typescript
// Terminal-themed shared components

function TerminalHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black border-b border-cyan-500 px-4 py-2 font-mono text-cyan-400">
      <span className="text-green-400">$</span> {children}
    </div>
  );
}

function TerminalPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
      <TerminalHeader>{title}</TerminalHeader>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Button({ children, variant = 'primary', onClick, disabled }: ButtonProps) {
  const baseStyles = "px-4 py-2 font-mono uppercase tracking-wider transition-colors";
  const variants = {
    primary: "bg-cyan-500 hover:bg-cyan-400 text-black",
    secondary: "bg-gray-700 hover:bg-gray-600 text-cyan-400 border border-cyan-500",
    danger: "bg-red-500 hover:bg-red-400 text-white"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

---

## 8. Permission System

### Role Hierarchy

```
Owner (full access)
  └── Manager (operational access)
       └── Staff (limited access)
```

### Permission Types

```typescript
type Role = 'owner' | 'manager' | 'staff';

type Permission =
  // Inventory
  | 'inventory.view'
  | 'inventory.add'
  | 'inventory.edit'
  | 'inventory.remove.any'      // Can remove any item
  | 'inventory.remove.assigned' // Can only remove own assigned items
  | 'inventory.audit'
  // Rentals
  | 'rentals.view'
  | 'rentals.create'
  | 'rentals.edit'
  | 'rentals.cancel'
  // Wire Diagrams
  | 'wirediagrams.view'
  | 'wirediagrams.create'
  | 'wirediagrams.edit'
  | 'wirediagrams.delete'
  // Labels
  | 'labels.create'
  | 'labels.print'
  // Admin
  | 'users.manage'
  | 'settings.edit';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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
```

### Permission Hook (No Prop Drilling)

```typescript
function usePermission() {
  const { user, permissions } = useAuth();

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return permissions.has(permission);
  }, [user, permissions]);

  const hasAnyPermission = useCallback((perms: Permission[]): boolean => {
    return perms.some(p => hasPermission(p));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((perms: Permission[]): boolean => {
    return perms.every(p => hasPermission(p));
  }, [hasPermission]);

  // Special case: Can user remove this specific item?
  const canRemoveItem = useCallback((item: InventoryItem): boolean => {
    if (hasPermission('inventory.remove.any')) return true;
    if (hasPermission('inventory.remove.assigned')) {
      return item.assignedTo === user?.id;
    }
    return false;
  }, [hasPermission, user]);

  return { hasPermission, hasAnyPermission, hasAllPermissions, canRemoveItem };
}
```

### Permission Gate Component

```typescript
function PermissionGate({
  permission,
  fallback = null,
  children
}: {
  permission: Permission | Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasPermission, hasAnyPermission } = usePermission();

  const allowed = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
```

### Usage Examples

```typescript
function InventoryToolbar() {
  return (
    <div className="flex gap-2">
      <PermissionGate permission="inventory.add">
        <Button variant="primary">+ Add Item</Button>
      </PermissionGate>

      <PermissionGate permission="inventory.audit">
        <Button variant="secondary">Start Audit</Button>
      </PermissionGate>

      {/* Multi-permission check */}
      <PermissionGate permission={['inventory.edit', 'inventory.remove.any']}>
        <Button variant="secondary">Bulk Edit</Button>
      </PermissionGate>
    </div>
  );
}

function InventoryItemCard({ item }: { item: InventoryItem }) {
  const { canRemoveItem } = usePermission();

  return (
    <Card title={item.name}>
      {/* ... item details ... */}

      {canRemoveItem(item) && (
        <Button variant="danger">Remove</Button>
      )}
    </Card>
  );
}
```

### Secure Dispatch Wrapper

```typescript
function useSecureDispatch() {
  const dispatch = useAppDispatch();
  const { hasPermission, canRemoveItem } = usePermission();
  const { items } = useInventory();

  const secureDispatch = useCallback((action: Action) => {
    // Validate permission before dispatching
    switch (action.type) {
      case 'INVENTORY_ADD_ITEM':
        if (!hasPermission('inventory.add')) {
          throw new PermissionError('Cannot add inventory items');
        }
        break;

      case 'INVENTORY_REMOVE_ITEM': {
        const item = items[action.payload.id];
        if (!canRemoveItem(item)) {
          throw new PermissionError('Cannot remove this item');
        }
        break;
      }

      case 'INVENTORY_UPDATE_ITEM':
        if (!hasPermission('inventory.edit')) {
          throw new PermissionError('Cannot edit inventory items');
        }
        break;
    }

    return dispatch(action);
  }, [dispatch, hasPermission, canRemoveItem, items]);

  return secureDispatch;
}

class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}
```

---

## 9. Migration Path

### Phase 1: Single-File MVP

**Status**: Demo-ready artifact

```
NeonOS/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── src/
    ├── main.tsx
    └── NeonOS.tsx  (~2000 lines)
```

**Characteristics**:
- All code in single `NeonOS.tsx` file
- localStorage for persistence
- Mock Google OAuth
- Demo data seeded
- Terminal aesthetic complete

### Phase 2: Multi-File React App

**Status**: Development-ready application

```
src/
├── types/index.ts
├── config/index.ts
├── state/{auth,inventory,rentals,wireDiagrams,labels}.ts
├── hooks/{usePermission,useSecureDispatch}.ts
├── utils/{id,date,money}.ts
├── components/shared/{Button,Card,Modal,Terminal}.tsx
├── components/layout/{MainLayout,Navbar}.tsx
├── features/{auth,inventory,rentals,wireDiagrams,labels}/
├── App.tsx
└── main.tsx
```

**Migration Steps**:
1. Create folder structure
2. Extract types to `src/types/index.ts`
3. Extract state slices to `src/state/*.ts`
4. Extract shared components
5. Extract feature components
6. Update imports throughout
7. Test each feature independently

### Phase 3: API Integration

**Status**: Connected application

**Backend Addition**:
```
api/
├── routes/
│   ├── auth.ts
│   ├── inventory.ts
│   ├── rentals.ts
│   └── wireDiagrams.ts
├── middleware/
│   ├── authenticate.ts
│   └── authorize.ts
├── services/
│   ├── inventoryService.ts
│   └── rentalService.ts
└── db/
    ├── schema.sql
    └── migrations/
```

**Frontend Changes**:
```typescript
// BEFORE (Phase 2): Local state
function useInventory() {
  const state = useAppState();
  return state.inventory;
}

// AFTER (Phase 3): Server state with React Query
function useInventory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await fetch('/api/inventory');
      return response.json();
    }
  });

  return {
    items: data?.items || {},
    locations: data?.locations || {},
    categories: data?.categories || {},
    isLoading,
    error
  };
}

// Mutations replace dispatch
function useAddInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: InventoryItem) => {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });
}
```

### Phase 4: Database & Real Auth

**Status**: Production-ready application

**Database Schema** (PostgreSQL):
```sql
-- Users with Google OAuth and permission management
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar TEXT,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- User permissions (many-to-many: users can have custom permissions beyond role defaults)
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID REFERENCES users(id),
  UNIQUE(user_id, permission)
);

-- Permission requests from users
CREATE TABLE permission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT
);

-- Indexes for permission system
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_permission_requests_status ON permission_requests(status);
CREATE INDEX idx_permission_requests_user ON permission_requests(user_id);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  location_id UUID REFERENCES locations(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  rental_rate_amount NUMERIC(10, 2) NOT NULL,
  rental_period VARCHAR(20) NOT NULL,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified_by UUID REFERENCES users(id)
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  parent_id UUID REFERENCES locations(id),
  color VARCHAR(7) NOT NULL,
  coordinates JSONB
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  icon VARCHAR(50),
  color VARCHAR(7) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_return_date DATE,
  total_cost_amount NUMERIC(10, 2) NOT NULL,
  deposit_amount NUMERIC(10, 2) NOT NULL,
  deposit_returned BOOLEAN DEFAULT FALSE,
  payment_status VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE TABLE rental_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  rate_amount NUMERIC(10, 2) NOT NULL,
  subtotal_amount NUMERIC(10, 2) NOT NULL
);

CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES inventory_items(id),
  type VARCHAR(20) NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  quantity_delta INTEGER NOT NULL,
  reason VARCHAR(50),
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES users(id)
);

-- Performance indexes
CREATE INDEX idx_items_location ON inventory_items(location_id);
CREATE INDEX idx_items_category ON inventory_items(category_id);
CREATE INDEX idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_transactions_item ON inventory_transactions(item_id);
```

**Auth & User Management**:
- Google OAuth 2.0 with credential verification
- JWT token management with 7-day expiration
- Refresh token rotation
- Session management
- User approval workflow (pending → active)
- Permission request/approval system
- User management API endpoints:
  - `POST /api/auth/google` - Google OAuth sign-in
  - `GET /api/users` - List all users (owner only)
  - `PATCH /api/users/:id/status` - Approve/block user
  - `PATCH /api/users/:id/role` - Change user role
  - `POST /api/users/:id/permissions` - Grant permission
  - `DELETE /api/users/:id/permissions/:perm` - Revoke permission
  - `GET /api/permission-requests` - List pending requests
  - `PATCH /api/permission-requests/:id` - Approve/deny request

---

## 10. Implementation Checklist

### Phase 1: Foundation

- [ ] Set up Vite + React + TypeScript project
- [ ] Install dependencies (Tailwind CSS, Lucide React, Google OAuth)
- [ ] Configure Tailwind with terminal theme colors
- [ ] Define all TypeScript types (including UserRecord, PermissionRequest)
- [ ] Implement state management (reducers, contexts, hooks)
- [ ] Create shared UI components
- [ ] Implement terminal aesthetic styling
- [ ] Build Google OAuth authentication system
- [ ] Implement user status flow (pending → active → blocked)
- [ ] Implement permission system (hooks, guards)
- [ ] Create main layout & navigation

### Phase 2: Core Features

**User Management Module** (Owner-only)
- [ ] User Management page with access control
- [ ] Pending user approval queue
- [ ] User table with all users (active/pending/blocked)
- [ ] Role dropdown (Owner/Manager/Staff)
- [ ] Permission checkbox grid per user
- [ ] Approve/Block/Unblock buttons
- [ ] Permission request queue
- [ ] Approve/Deny request workflow
- [ ] Notification badge showing pending request count
- [ ] Pending user screen (shown to unapproved users)
- [ ] Blocked user screen

**Permission Request Flow**
- [ ] "Request Access" button in PermissionGate fallback
- [ ] Request modal with reason field
- [ ] PermissionRequest creation/storage
- [ ] Request notification for owners
- [ ] Request approval/denial actions
- [ ] Permission granted on approval

**Inventory Module**
- [ ] Item list view with search/filters
- [ ] Item card component
- [ ] Add/edit item modal
- [ ] Remove item with reason selection
- [ ] Add/Remove with Balance (audit mode)
- [ ] Location management
- [ ] Category management
- [ ] Image upload (base64 for MVP)

**Rental Module**
- [ ] Rental calendar view (Gantt-style)
- [ ] Create rental form
- [ ] Item selector with availability check
- [ ] Conflict detection & warnings
- [ ] Rental status management
- [ ] Return processing

**Wire Diagram Module**
- [ ] Connector library (pre-load XLR, Phoenix, RJ45, DMX)
- [ ] Connector selector with visual preview
- [ ] Wire color picker
- [ ] Wire matcher tool UI
- [ ] Mapping generation logic (3 strategies)
- [ ] Termination map table view
- [ ] SVG diagram generator
- [ ] Multi-diagram chain builder
- [ ] Save/load diagrams

**Label Studio**
- [ ] Canvas component
- [ ] Element toolbar (text, QR, image, shape)
- [ ] Drag-drop element positioning
- [ ] Rotation & sizing controls
- [ ] Dynamic field binding
- [ ] Export to PDF/image

### Phase 3: Polish

- [ ] AI command parser (pattern matching)
- [ ] Command bar UI
- [ ] Error boundaries
- [ ] Loading states
- [ ] Empty states
- [ ] Confirmation dialogs
- [ ] Toast notifications
- [ ] LocalStorage persistence
- [ ] Demo data seeding
- [ ] Keyboard shortcuts

---

## Appendix: Color Palette

Terminal aesthetic colors for Tailwind:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'terminal': {
          'bg': '#0a0a0a',
          'panel': '#111111',
          'border': '#06b6d4', // cyan-500
          'text': '#06b6d4',
          'accent': '#22c55e', // green-500
          'warning': '#eab308', // yellow-500
          'error': '#ef4444', // red-500
          'muted': '#6b7280', // gray-500
        }
      },
      boxShadow: {
        'glow': '0 0 10px rgba(6, 182, 212, 0.3)',
        'glow-strong': '0 0 20px rgba(6, 182, 212, 0.5)',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    }
  }
}
```
