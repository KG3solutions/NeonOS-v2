import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import {
  AppState, Action, AuthState, UserManagementState, InventoryState, RentalState,
  WireDiagramState, LabelState, Permission, InventoryItem, CustomerState, Customer, PullList, InventoryTransaction,
  TimeClockState, TimeEntry, JobState, Job, BuildRecipe, ControllerBuilderState
} from './types';
import { ROLE_PERMISSIONS } from './constants';
import { mockUsers, mockInventoryItems, mockLocations, mockCategories, mockConnectors, mockRentals, mockCustomers, mockPullLists } from './mockData';

// ============================================================================
// Initial State
// ============================================================================

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  permissions: new Set(),
  pendingRequestCount: 0,
};

const initialUserManagementState: UserManagementState = {
  users: {},
  usersByStatus: { pending: [], active: [], blocked: [] },
  permissionRequests: {},
  pendingRequests: [],
};

const initialInventoryState: InventoryState = {
  items: {},
  locations: {},
  categories: {},
  transactions: {},
  itemsByLocation: {},
  itemsByCategory: {},
};

const initialRentalState: RentalState = {
  rentals: {},
  rentalsByStatus: { draft: [], reserved: [], active: [], overdue: [], returned: [], cancelled: [] },
  rentalsByCustomer: {},
  pullLists: {},
  pullListsByStatus: { draft: [], ready: [], 'in-progress': [], completed: [] },
};

const initialCustomerState: CustomerState = {
  customers: {},
};

const initialWireDiagramState: WireDiagramState = {
  connectors: {},
  mappings: {},
  diagrams: {},
};

const initialLabelState: LabelState = {
  designs: {},
};

const initialTimeClockState: TimeClockState = {
  entries: {},
  entriesByUser: {},
  entriesByDate: {},
  activeEntryByUser: {},
};

const initialJobState: JobState = {
  jobs: {},
  jobsByStatus: { planning: [], ready: [], 'in-progress': [], completed: [], cancelled: [] },
  jobsByType: { rental: [], install: [], build: [], service: [] },
  jobsByCustomer: {},
  buildRecipes: {},
};

const initialControllerBuilderState: ControllerBuilderState = {
  enclosures: {},
  controllers: {},
  powerSupplies: {},
  plateTypes: {},
  connectorOptions: {},
};

const initialState: AppState = {
  auth: initialAuthState,
  userManagement: initialUserManagementState,
  inventory: initialInventoryState,
  rentals: initialRentalState,
  customers: initialCustomerState,
  wireDiagrams: initialWireDiagramState,
  labels: initialLabelState,
  timeClock: initialTimeClockState,
  jobs: initialJobState,
  controllerBuilder: initialControllerBuilderState,
};

// ============================================================================
// Reducers
// ============================================================================

function authReducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'AUTH_LOGIN':
    case 'AUTH_SET_USER': {
      const user = action.payload;
      const basePermissions = ROLE_PERMISSIONS[user.role] || [];
      const allPermissions = new Set<Permission>([...basePermissions, ...user.permissions]);
      return {
        ...state,
        user,
        isAuthenticated: true,
        permissions: allPermissions,
      };
    }
    case 'AUTH_LOGOUT':
      return initialAuthState;
    default:
      return state;
  }
}

function userManagementReducer(state: UserManagementState, action: Action): UserManagementState {
  switch (action.type) {
    case 'USER_APPROVE': {
      const userId = action.payload;
      const user = state.users[userId];
      if (!user) return state;
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

    case 'USER_BLOCK': {
      const userId = action.payload;
      const user = state.users[userId];
      if (!user) return state;
      const prevStatus = user.status;
      return {
        ...state,
        users: {
          ...state.users,
          [userId]: { ...user, status: 'blocked' }
        },
        usersByStatus: {
          ...state.usersByStatus,
          [prevStatus]: state.usersByStatus[prevStatus].filter(id => id !== userId),
          blocked: [...state.usersByStatus.blocked, userId]
        }
      };
    }

    case 'USER_UPDATE_ROLE': {
      const { userId, role } = action.payload;
      const user = state.users[userId];
      if (!user) return state;
      const basePermissions = ROLE_PERMISSIONS[role];
      return {
        ...state,
        users: {
          ...state.users,
          [userId]: {
            ...user,
            role,
            permissions: basePermissions
          }
        }
      };
    }

    case 'USER_UPDATE_PERMISSIONS': {
      const { userId, permission, enabled } = action.payload;
      const user = state.users[userId];
      if (!user) return state;
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

    case 'USER_UPDATE_STATUS': {
      const { userId, status } = action.payload;
      const user = state.users[userId];
      if (!user) return state;
      const prevStatus = user.status;
      return {
        ...state,
        users: {
          ...state.users,
          [userId]: { ...user, status }
        },
        usersByStatus: {
          ...state.usersByStatus,
          [prevStatus]: state.usersByStatus[prevStatus].filter(id => id !== userId),
          [status]: [...state.usersByStatus[status], userId]
        }
      };
    }

    case 'PERMISSION_REQUEST_CREATE': {
      const requestId = `req-${Date.now()}`;
      const request = {
        id: requestId,
        ...action.payload,
        status: 'pending' as const,
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
      if (!request) return state;
      const user = state.users[request.userId];
      if (!user) return state;

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

    case 'PERMISSION_REQUEST_DENY': {
      const { requestId, reviewNotes } = action.payload;
      const request = state.permissionRequests[requestId];
      if (!request) return state;

      return {
        ...state,
        permissionRequests: {
          ...state.permissionRequests,
          [requestId]: {
            ...request,
            status: 'denied',
            reviewedAt: new Date().toISOString(),
            reviewNotes
          }
        },
        pendingRequests: state.pendingRequests.filter(id => id !== requestId)
      };
    }

    default:
      return state;
  }
}

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

    case 'INVENTORY_UPDATE_ITEM': {
      const { id, changes } = action.payload;
      const existing = state.items[id];
      if (!existing) return state;
      return {
        ...state,
        items: {
          ...state.items,
          [id]: { ...existing, ...changes, lastModified: new Date().toISOString() }
        }
      };
    }

    case 'INVENTORY_REMOVE_ITEM': {
      const { id } = action.payload;
      const item = state.items[id];
      if (!item) return state;

      const { [id]: _, ...remainingItems } = state.items;
      return {
        ...state,
        items: remainingItems,
        itemsByLocation: {
          ...state.itemsByLocation,
          [item.locationId]: (state.itemsByLocation[item.locationId] || []).filter(i => i !== id)
        },
        itemsByCategory: {
          ...state.itemsByCategory,
          [item.categoryId]: (state.itemsByCategory[item.categoryId] || []).filter(i => i !== id)
        }
      };
    }

    case 'INVENTORY_BULK_IMPORT': {
      const items = action.payload;
      const newItems = { ...state.items };
      const newByLocation = { ...state.itemsByLocation };
      const newByCategory = { ...state.itemsByCategory };

      items.forEach(item => {
        newItems[item.id] = item;
        newByLocation[item.locationId] = [...(newByLocation[item.locationId] || []), item.id];
        newByCategory[item.categoryId] = [...(newByCategory[item.categoryId] || []), item.id];
      });

      return {
        ...state,
        items: newItems,
        itemsByLocation: newByLocation,
        itemsByCategory: newByCategory
      };
    }

    case 'INVENTORY_ADJUST_QUANTITY': {
      const { itemId, delta, reason, notes, userId, relatedRentalId, relatedPullListId } = action.payload;
      const item = state.items[itemId];
      if (!item) return state;

      const quantityBefore = item.quantity;
      const quantityAfter = Math.max(0, quantityBefore + delta);
      const availableBefore = item.availableQuantity;
      const availableAfter = Math.max(0, availableBefore + delta);

      const transaction: InventoryTransaction = {
        id: `txn-${Date.now()}`,
        itemId,
        type: delta > 0 ? 'add' : 'remove',
        quantityBefore,
        quantityAfter,
        quantityDelta: delta,
        reason: reason as InventoryTransaction['reason'],
        notes: notes || null,
        timestamp: new Date().toISOString(),
        userId,
        relatedRentalId,
        relatedPullListId,
      };

      return {
        ...state,
        items: {
          ...state.items,
          [itemId]: {
            ...item,
            quantity: quantityAfter,
            availableQuantity: availableAfter,
            lastModified: new Date().toISOString(),
            lastModifiedBy: userId,
          }
        },
        transactions: {
          ...state.transactions,
          [transaction.id]: transaction,
        }
      };
    }

    case 'INVENTORY_ADD_TRANSACTION': {
      const transaction = action.payload;
      return {
        ...state,
        transactions: {
          ...state.transactions,
          [transaction.id]: transaction,
        }
      };
    }

    default:
      return state;
  }
}

function rentalReducer(state: RentalState, action: Action): RentalState {
  switch (action.type) {
    case 'RENTAL_CREATE': {
      const rental = action.payload;
      return {
        ...state,
        rentals: { ...state.rentals, [rental.id]: rental },
        rentalsByStatus: {
          ...state.rentalsByStatus,
          [rental.status]: [...state.rentalsByStatus[rental.status], rental.id]
        },
        rentalsByCustomer: {
          ...state.rentalsByCustomer,
          [rental.customerName]: [...(state.rentalsByCustomer[rental.customerName] || []), rental.id]
        }
      };
    }

    case 'RENTAL_UPDATE_STATUS': {
      const { id, status } = action.payload;
      const rental = state.rentals[id];
      if (!rental) return state;
      const prevStatus = rental.status;
      return {
        ...state,
        rentals: {
          ...state.rentals,
          [id]: { ...rental, status, lastModified: new Date().toISOString() }
        },
        rentalsByStatus: {
          ...state.rentalsByStatus,
          [prevStatus]: state.rentalsByStatus[prevStatus].filter(r => r !== id),
          [status]: [...state.rentalsByStatus[status], id]
        }
      };
    }

    case 'PULL_LIST_CREATE': {
      const pullList = action.payload;
      return {
        ...state,
        pullLists: { ...state.pullLists, [pullList.id]: pullList },
        pullListsByStatus: {
          ...state.pullListsByStatus,
          [pullList.status]: [...state.pullListsByStatus[pullList.status], pullList.id]
        }
      };
    }

    case 'PULL_LIST_UPDATE': {
      const { id, changes } = action.payload;
      const pullList = state.pullLists[id];
      if (!pullList) return state;
      const prevStatus = pullList.status;
      const newStatus = changes.status || prevStatus;

      let newPullListsByStatus = state.pullListsByStatus;
      if (changes.status && changes.status !== prevStatus) {
        newPullListsByStatus = {
          ...state.pullListsByStatus,
          [prevStatus]: state.pullListsByStatus[prevStatus].filter(p => p !== id),
          [newStatus]: [...state.pullListsByStatus[newStatus], id]
        };
      }

      return {
        ...state,
        pullLists: {
          ...state.pullLists,
          [id]: { ...pullList, ...changes }
        },
        pullListsByStatus: newPullListsByStatus
      };
    }

    case 'PULL_LIST_UPDATE_ITEM': {
      const { pullListId, itemSku, changes } = action.payload;
      const pullList = state.pullLists[pullListId];
      if (!pullList) return state;

      const updatedItems = pullList.items.map(item =>
        item.sku === itemSku ? { ...item, ...changes } : item
      );

      return {
        ...state,
        pullLists: {
          ...state.pullLists,
          [pullListId]: { ...pullList, items: updatedItems }
        }
      };
    }

    default:
      return state;
  }
}

function customerReducer(state: CustomerState, action: Action): CustomerState {
  switch (action.type) {
    case 'CUSTOMER_ADD': {
      const customer = action.payload;
      return {
        ...state,
        customers: { ...state.customers, [customer.id]: customer }
      };
    }

    case 'CUSTOMER_UPDATE': {
      const { id, changes } = action.payload;
      const customer = state.customers[id];
      if (!customer) return state;
      return {
        ...state,
        customers: {
          ...state.customers,
          [id]: { ...customer, ...changes }
        }
      };
    }

    default:
      return state;
  }
}

function wireDiagramReducer(state: WireDiagramState, action: Action): WireDiagramState {
  switch (action.type) {
    case 'WIRE_DIAGRAM_ADD': {
      const diagram = action.payload;
      return {
        ...state,
        diagrams: { ...state.diagrams, [diagram.id]: diagram }
      };
    }

    case 'WIRE_MAPPING_ADD': {
      const mapping = action.payload;
      return {
        ...state,
        mappings: { ...state.mappings, [mapping.id]: mapping }
      };
    }

    case 'CONNECTOR_UPDATE': {
      const { id, changes } = action.payload;
      const connector = state.connectors[id];
      if (!connector) return state;

      return {
        ...state,
        connectors: {
          ...state.connectors,
          [id]: { ...connector, ...changes }
        }
      };
    }

    default:
      return state;
  }
}

function labelReducer(state: LabelState, action: Action): LabelState {
  switch (action.type) {
    case 'LABEL_SAVE_DESIGN': {
      const design = action.payload;
      return {
        ...state,
        designs: { ...state.designs, [design.id]: design }
      };
    }

    default:
      return state;
  }
}

function timeClockReducer(state: TimeClockState, action: Action): TimeClockState {
  switch (action.type) {
    case 'TIME_CLOCK_IN': {
      const { userId, timestamp } = action.payload;
      const date = timestamp.split('T')[0]; // YYYY-MM-DD
      const entryId = `time-${userId}-${Date.now()}`;

      const entry: TimeEntry = {
        id: entryId,
        userId,
        clockIn: timestamp,
        date,
      };

      return {
        ...state,
        entries: { ...state.entries, [entryId]: entry },
        entriesByUser: {
          ...state.entriesByUser,
          [userId]: [...(state.entriesByUser[userId] || []), entryId]
        },
        entriesByDate: {
          ...state.entriesByDate,
          [date]: [...(state.entriesByDate[date] || []), entryId]
        },
        activeEntryByUser: {
          ...state.activeEntryByUser,
          [userId]: entryId
        }
      };
    }

    case 'TIME_CLOCK_OUT': {
      const { userId, timestamp } = action.payload;
      const activeEntryId = state.activeEntryByUser[userId];
      if (!activeEntryId) return state;

      const entry = state.entries[activeEntryId];
      if (!entry) return state;

      const clockInTime = new Date(entry.clockIn).getTime();
      const clockOutTime = new Date(timestamp).getTime();
      const durationMinutes = Math.round((clockOutTime - clockInTime) / 60000);

      const { [userId]: _, ...remainingActive } = state.activeEntryByUser;

      return {
        ...state,
        entries: {
          ...state.entries,
          [activeEntryId]: {
            ...entry,
            clockOut: timestamp,
            duration: durationMinutes
          }
        },
        activeEntryByUser: remainingActive
      };
    }

    default:
      return state;
  }
}

function jobReducer(state: JobState, action: Action): JobState {
  switch (action.type) {
    case 'JOB_CREATE': {
      const job = action.payload;
      return {
        ...state,
        jobs: { ...state.jobs, [job.id]: job },
        jobsByStatus: {
          ...state.jobsByStatus,
          [job.status]: [...state.jobsByStatus[job.status], job.id]
        },
        jobsByType: {
          ...state.jobsByType,
          [job.type]: [...state.jobsByType[job.type], job.id]
        },
        jobsByCustomer: job.customerId ? {
          ...state.jobsByCustomer,
          [job.customerId]: [...(state.jobsByCustomer[job.customerId] || []), job.id]
        } : state.jobsByCustomer
      };
    }

    case 'JOB_UPDATE': {
      const { id, changes } = action.payload;
      const job = state.jobs[id];
      if (!job) return state;
      return {
        ...state,
        jobs: {
          ...state.jobs,
          [id]: { ...job, ...changes, lastModified: new Date().toISOString() }
        }
      };
    }

    case 'JOB_UPDATE_STATUS': {
      const { id, status } = action.payload;
      const job = state.jobs[id];
      if (!job) return state;
      const prevStatus = job.status;
      return {
        ...state,
        jobs: {
          ...state.jobs,
          [id]: { ...job, status, lastModified: new Date().toISOString() }
        },
        jobsByStatus: {
          ...state.jobsByStatus,
          [prevStatus]: state.jobsByStatus[prevStatus].filter(j => j !== id),
          [status]: [...state.jobsByStatus[status], id]
        }
      };
    }

    case 'JOB_DELETE': {
      const id = action.payload;
      const job = state.jobs[id];
      if (!job) return state;
      const { [id]: _, ...remainingJobs } = state.jobs;
      return {
        ...state,
        jobs: remainingJobs,
        jobsByStatus: {
          ...state.jobsByStatus,
          [job.status]: state.jobsByStatus[job.status].filter(j => j !== id)
        },
        jobsByType: {
          ...state.jobsByType,
          [job.type]: state.jobsByType[job.type].filter(j => j !== id)
        }
      };
    }

    case 'RECIPE_CREATE': {
      const recipe = action.payload;
      return {
        ...state,
        buildRecipes: { ...state.buildRecipes, [recipe.id]: recipe }
      };
    }

    case 'RECIPE_UPDATE': {
      const { id, changes } = action.payload;
      const recipe = state.buildRecipes[id];
      if (!recipe) return state;
      return {
        ...state,
        buildRecipes: {
          ...state.buildRecipes,
          [id]: { ...recipe, ...changes }
        }
      };
    }

    case 'RECIPE_DELETE': {
      const id = action.payload;
      const { [id]: _, ...remainingRecipes } = state.buildRecipes;
      return {
        ...state,
        buildRecipes: remainingRecipes
      };
    }

    default:
      return state;
  }
}

function controllerBuilderReducer(state: ControllerBuilderState, _action: Action): ControllerBuilderState {
  // For now, just return state - we'll add more actions as needed
  return state;
}

function appReducer(state: AppState, action: Action): AppState {
  return {
    auth: authReducer(state.auth, action),
    userManagement: userManagementReducer(state.userManagement, action),
    inventory: inventoryReducer(state.inventory, action),
    rentals: rentalReducer(state.rentals, action),
    customers: customerReducer(state.customers, action),
    wireDiagrams: wireDiagramReducer(state.wireDiagrams, action),
    labels: labelReducer(state.labels, action),
    timeClock: timeClockReducer(state.timeClock, action),
    jobs: jobReducer(state.jobs, action),
    controllerBuilder: controllerBuilderReducer(state.controllerBuilder, action),
  };
}

// ============================================================================
// Context
// ============================================================================

const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<React.Dispatch<Action> | null>(null);

// ============================================================================
// Provider
// ============================================================================

function loadInitialState(): AppState {
  // Start with initial state
  let state = { ...initialState };

  // Load mock users
  const usersState: UserManagementState = {
    users: {},
    usersByStatus: { pending: [], active: [], blocked: [] },
    permissionRequests: {},
    pendingRequests: [],
  };

  mockUsers.forEach(user => {
    usersState.users[user.id] = user;
    usersState.usersByStatus[user.status].push(user.id);
  });

  // Find user with pending permission requests
  const userWithRequest = mockUsers.find(u => u.requestedPermissions.length > 0);
  if (userWithRequest) {
    userWithRequest.requestedPermissions.forEach(perm => {
      const requestId = `req-mock-${perm}`;
      usersState.permissionRequests[requestId] = {
        id: requestId,
        userId: userWithRequest.id,
        permission: perm,
        reason: 'Need this for my work',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: null,
      };
      usersState.pendingRequests.push(requestId);
    });
  }

  state.userManagement = usersState;

  // Load mock inventory
  const inventoryState: InventoryState = {
    items: {},
    locations: {},
    categories: {},
    transactions: {},
    itemsByLocation: {},
    itemsByCategory: {},
  };

  mockLocations.forEach(loc => {
    inventoryState.locations[loc.id] = loc;
  });

  mockCategories.forEach(cat => {
    inventoryState.categories[cat.id] = cat;
  });

  mockInventoryItems.forEach(item => {
    inventoryState.items[item.id] = item;
    inventoryState.itemsByLocation[item.locationId] = [
      ...(inventoryState.itemsByLocation[item.locationId] || []),
      item.id
    ];
    inventoryState.itemsByCategory[item.categoryId] = [
      ...(inventoryState.itemsByCategory[item.categoryId] || []),
      item.id
    ];
  });

  state.inventory = inventoryState;

  // Load mock connectors
  const wireDiagramState: WireDiagramState = {
    connectors: {},
    mappings: {},
    diagrams: {},
  };

  mockConnectors.forEach(conn => {
    wireDiagramState.connectors[conn.id] = conn;
  });

  state.wireDiagrams = wireDiagramState;

  // Load mock rentals
  const rentalState: RentalState = {
    rentals: {},
    rentalsByStatus: { draft: [], reserved: [], active: [], overdue: [], returned: [], cancelled: [] },
    rentalsByCustomer: {},
    pullLists: {},
    pullListsByStatus: { draft: [], ready: [], 'in-progress': [], completed: [] },
  };

  mockRentals.forEach(rental => {
    rentalState.rentals[rental.id] = rental;
    rentalState.rentalsByStatus[rental.status].push(rental.id);
    rentalState.rentalsByCustomer[rental.customerName] = [
      ...(rentalState.rentalsByCustomer[rental.customerName] || []),
      rental.id
    ];
  });

  // Load mock pull lists
  mockPullLists.forEach(pullList => {
    rentalState.pullLists[pullList.id] = pullList;
    rentalState.pullListsByStatus[pullList.status].push(pullList.id);
  });

  state.rentals = rentalState;

  // Load mock customers
  const customerState: CustomerState = {
    customers: {},
  };

  mockCustomers.forEach(customer => {
    customerState.customers[customer.id] = customer;
  });

  state.customers = customerState;

  // Auto-login as Kenny (Owner) for development
  const kenny = mockUsers.find(u => u.name === 'Kenny');
  if (kenny) {
    const basePermissions = ROLE_PERMISSIONS[kenny.role];
    state.auth = {
      user: kenny,
      isAuthenticated: true,
      permissions: new Set([...basePermissions, ...kenny.permissions]),
      pendingRequestCount: usersState.pendingRequests.length,
    };
  }

  return state;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, null, loadInitialState);

  // Update pending count when requests change
  useEffect(() => {
    if (state.auth.user && state.auth.permissions.has('users.manage')) {
      const pendingUsers = state.userManagement.usersByStatus.pending.length;
      const pendingRequests = state.userManagement.pendingRequests.length;
      const totalPending = pendingUsers + pendingRequests;

      if (state.auth.pendingRequestCount !== totalPending) {
        // We'd dispatch here but for simplicity we'll handle in render
      }
    }
  }, [state.userManagement.usersByStatus.pending, state.userManagement.pendingRequests, state.auth]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) throw new Error('useAppDispatch must be used within AppProvider');
  return context;
}

export function useAuth() {
  const state = useAppState();
  return state.auth;
}

export function useUserManagement() {
  const state = useAppState();
  return state.userManagement;
}

export function useInventory() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const updateItem = useCallback((id: string, changes: Partial<InventoryItem>) => {
    dispatch({ type: 'INVENTORY_UPDATE_ITEM', payload: { id, changes } });
  }, [dispatch]);

  const addItem = useCallback((item: InventoryItem) => {
    dispatch({ type: 'INVENTORY_ADD_ITEM', payload: item });
  }, [dispatch]);

  const adjustQuantity = useCallback((
    itemId: string,
    delta: number,
    reason: string,
    options?: { notes?: string; relatedRentalId?: string; relatedPullListId?: string }
  ) => {
    dispatch({
      type: 'INVENTORY_ADJUST_QUANTITY',
      payload: {
        itemId,
        delta,
        reason,
        notes: options?.notes,
        userId: user?.id || '',
        relatedRentalId: options?.relatedRentalId,
        relatedPullListId: options?.relatedPullListId,
      }
    });
  }, [dispatch, user]);

  // Find item by barcode (searches all barcodes array and SKU)
  const findByBarcode = useCallback((barcode: string): InventoryItem | undefined => {
    return Object.values(state.inventory.items).find(item =>
      item.sku === barcode ||
      item.barcodes?.includes(barcode)
    );
  }, [state.inventory.items]);

  return { ...state.inventory, updateItem, addItem, adjustQuantity, findByBarcode };
}

export function useRentals() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const createPullList = useCallback((pullList: PullList) => {
    dispatch({ type: 'PULL_LIST_CREATE', payload: pullList });
  }, [dispatch]);

  const updatePullList = useCallback((id: string, changes: Partial<PullList>) => {
    dispatch({ type: 'PULL_LIST_UPDATE', payload: { id, changes } });
  }, [dispatch]);

  const updatePullListItem = useCallback((pullListId: string, itemSku: string, changes: Partial<PullList['items'][0]>) => {
    dispatch({ type: 'PULL_LIST_UPDATE_ITEM', payload: { pullListId, itemSku, changes } });
  }, [dispatch]);

  return { ...state.rentals, createPullList, updatePullList, updatePullListItem };
}

export function useCustomers() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const addCustomer = useCallback((customer: Customer) => {
    dispatch({ type: 'CUSTOMER_ADD', payload: customer });
  }, [dispatch]);

  const updateCustomer = useCallback((id: string, changes: Partial<Customer>) => {
    dispatch({ type: 'CUSTOMER_UPDATE', payload: { id, changes } });
  }, [dispatch]);

  return { ...state.customers, addCustomer, updateCustomer };
}

export function useWireDiagrams() {
  const state = useAppState();
  return state.wireDiagrams;
}

export function useLabels() {
  const state = useAppState();
  return state.labels;
}

export function usePermission() {
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

  const canRemoveItem = useCallback((item: InventoryItem): boolean => {
    if (hasPermission('inventory.remove.any')) return true;
    if (hasPermission('inventory.remove.assigned')) {
      return item.assignedTo === user?.id;
    }
    return false;
  }, [hasPermission, user]);

  return { hasPermission, hasAnyPermission, hasAllPermissions, canRemoveItem };
}

export function usePendingCount() {
  const { usersByStatus, pendingRequests } = useUserManagement();
  const { hasPermission } = usePermission();

  return useMemo(() => {
    if (!hasPermission('users.manage')) return 0;
    return usersByStatus.pending.length + pendingRequests.length;
  }, [usersByStatus.pending, pendingRequests, hasPermission]);
}

// Login function
export function useLogin() {
  const dispatch = useAppDispatch();
  const { users } = useUserManagement();

  return useCallback((userId: string) => {
    const user = users[userId];
    if (user) {
      dispatch({ type: 'AUTH_LOGIN', payload: user });
    }
  }, [dispatch, users]);
}

export function useLogout() {
  const dispatch = useAppDispatch();
  return useCallback(() => {
    dispatch({ type: 'AUTH_LOGOUT' });
  }, [dispatch]);
}

// Time Clock hooks
export function useTimeClock() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const clockIn = useCallback(() => {
    if (!user) return;
    dispatch({
      type: 'TIME_CLOCK_IN',
      payload: { userId: user.id, timestamp: new Date().toISOString() }
    });
  }, [dispatch, user]);

  const clockOut = useCallback(() => {
    if (!user) return;
    dispatch({
      type: 'TIME_CLOCK_OUT',
      payload: { userId: user.id, timestamp: new Date().toISOString() }
    });
  }, [dispatch, user]);

  const isClockedIn = useMemo(() => {
    if (!user) return false;
    return !!state.timeClock.activeEntryByUser[user.id];
  }, [state.timeClock.activeEntryByUser, user]);

  const activeEntry = useMemo(() => {
    if (!user) return null;
    const entryId = state.timeClock.activeEntryByUser[user.id];
    if (!entryId) return null;
    return state.timeClock.entries[entryId] || null;
  }, [state.timeClock.entries, state.timeClock.activeEntryByUser, user]);

  const getElapsedMinutes = useCallback(() => {
    if (!activeEntry) return 0;
    const clockInTime = new Date(activeEntry.clockIn).getTime();
    const now = Date.now();
    return Math.round((now - clockInTime) / 60000);
  }, [activeEntry]);

  return {
    ...state.timeClock,
    clockIn,
    clockOut,
    isClockedIn,
    activeEntry,
    getElapsedMinutes,
  };
}

// Jobs hooks
export function useJobs() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const createJob = useCallback((job: Omit<Job, 'id' | 'createdAt' | 'lastModified' | 'createdBy' | 'lastModifiedBy'>) => {
    const newJob: Job = {
      ...job,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      createdBy: user?.id || '',
      lastModifiedBy: user?.id || '',
    };
    dispatch({ type: 'JOB_CREATE', payload: newJob });
    return newJob.id;
  }, [dispatch, user]);

  const updateJob = useCallback((id: string, changes: Partial<Job>) => {
    dispatch({ type: 'JOB_UPDATE', payload: { id, changes: { ...changes, lastModifiedBy: user?.id || '' } } });
  }, [dispatch, user]);

  const updateJobStatus = useCallback((id: string, status: Job['status']) => {
    dispatch({ type: 'JOB_UPDATE_STATUS', payload: { id, status } });
  }, [dispatch]);

  const deleteJob = useCallback((id: string) => {
    dispatch({ type: 'JOB_DELETE', payload: id });
  }, [dispatch]);

  return { ...state.jobs, createJob, updateJob, updateJobStatus, deleteJob };
}

export function useBuildRecipes() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const createRecipe = useCallback((recipe: Omit<BuildRecipe, 'id' | 'createdAt' | 'createdBy'>) => {
    const newRecipe: BuildRecipe = {
      ...recipe,
      id: `recipe-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: user?.email || '',
    };
    dispatch({ type: 'RECIPE_CREATE', payload: newRecipe });
    return newRecipe.id;
  }, [dispatch, user]);

  const updateRecipe = useCallback((id: string, changes: Partial<BuildRecipe>) => {
    dispatch({ type: 'RECIPE_UPDATE', payload: { id, changes } });
  }, [dispatch]);

  const deleteRecipe = useCallback((id: string) => {
    dispatch({ type: 'RECIPE_DELETE', payload: id });
  }, [dispatch]);

  return { buildRecipes: state.jobs.buildRecipes, createRecipe, updateRecipe, deleteRecipe };
}

export function useControllerBuilder() {
  const state = useAppState();
  return state.controllerBuilder;
}
