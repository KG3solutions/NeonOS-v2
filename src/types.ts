// ============================================================================
// NeonOS - Type Definitions
// ============================================================================

// User & Auth Types
export type Role = 'owner' | 'manager' | 'staff';

export type UserStatus = 'pending' | 'active' | 'blocked';

export type Permission =
  | 'inventory.view'
  | 'inventory.add'
  | 'inventory.edit'
  | 'inventory.remove.any'
  | 'inventory.remove.assigned'
  | 'inventory.audit'
  | 'rentals.view'
  | 'rentals.create'
  | 'rentals.edit'
  | 'rentals.cancel'
  | 'wirediagrams.view'
  | 'wirediagrams.create'
  | 'wirediagrams.edit'
  | 'wirediagrams.delete'
  | 'labels.create'
  | 'labels.print'
  | 'users.manage'
  | 'settings.edit';

export type UserRecord = {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  role: Role;
  permissions: Permission[];
  status: UserStatus;
  requestedPermissions: Permission[];
  createdAt: string;
  lastLoginAt: string;
};

export type PermissionRequest = {
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

// Inventory Types
export type Money = {
  amount: number;
  currency: 'USD';
};

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  locationId: string;
  quantity: number;
  availableQuantity: number;
  unit: 'each' | 'ft' | 'meter' | 'box' | 'set';
  rentalRate: Money;
  rentalPeriod: 'day' | 'week' | 'month';
  images: string[];
  primaryImage: string | null;
  assignedTo: string | null;
  createdAt: string;
  createdBy: string;
  lastModified: string;
  lastModifiedBy: string;
  tags: string[];
  customFields: Record<string, string | number | boolean>;
  barcodes: string[];
  binCode?: string;
  recommendedAccessories?: string[];
};

export type Location = {
  id: string;
  name: string;
  type: 'building' | 'room' | 'shelf' | 'bin' | 'vehicle';
  parentId: string | null;
  coordinates?: { x: number; y: number; z?: number };
  mapImageUrl?: string;
  capacity?: number;
  description?: string;
  color: string;
};

export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  icon: string;
  color: string;
  order: number;
};

export type RemovalReason =
  | 'rental'
  | 'damaged'
  | 'lost'
  | 'stolen'
  | 'sold'
  | 'disposed'
  | 'transferred'
  | 'audit_correction';

export type AdditionReason =
  | 'purchase'
  | 'return'
  | 'found'
  | 'transfer'
  | 'audit_correction';

export type InventoryTransaction = {
  id: string;
  itemId: string;
  type: 'add' | 'remove' | 'adjust' | 'audit' | 'transfer' | 'receive' | 'pull' | 'return';
  quantityBefore: number;
  quantityAfter: number;
  quantityDelta: number;
  reason: RemovalReason | AdditionReason | 'audit' | 'transfer' | 'receive' | 'pull' | 'return';
  notes: string | null;
  locationIdBefore?: string;
  locationIdAfter?: string;
  isAuditMode?: boolean;
  expectedQuantity?: number;
  actualQuantity?: number;
  timestamp: string;
  userId: string;
  relatedRentalId?: string;
  relatedPullListId?: string;
};

// Customer Types
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  notes?: string;
  createdAt: string;
  lastRentalDate?: string;
};

// Pull List Types
export type PullListStatus = 'draft' | 'ready' | 'in-progress' | 'completed';

export type PullListItem = {
  sku: string;
  itemId: string;
  itemName: string;
  quantityNeeded: number;
  quantityPulled: number;
  pulledBy?: string;
  pulledAt?: string;
  binLocation?: string;
  notes?: string;
  recommendedAccessories?: { sku: string; name: string; autoInclude: boolean }[];
};

export type PullList = {
  id: string;
  rentalId: string;
  status: PullListStatus;
  createdBy: string;
  createdAt: string;
  items: PullListItem[];
  notes?: string;
  assignedTo?: string;
  startedAt?: string;
  completedBy?: string;
  completedAt?: string;
};

// Receiving Session Types
export type ReceivingSessionItem = {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  reason: 'received_shipment' | 'return' | 'found' | 'other';
  notes?: string;
};

// Rental Types
export type RentalStatus =
  | 'draft'
  | 'reserved'
  | 'active'
  | 'overdue'
  | 'returned'
  | 'cancelled';

export type RentalItem = {
  itemId: string;
  quantity: number;
  rate: Money;
  subtotal: Money;
};

export type Rental = {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  startDate: string;
  endDate: string;
  actualReturnDate: string | null;
  items: RentalItem[];
  totalCost: Money;
  depositAmount: Money;
  depositReturned: boolean;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overdue';
  status: RentalStatus;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  createdBy: string;
  lastModified: string;
  lastModifiedBy: string;
};

// Wire Diagram Types
export type ConnectorType = 'xlr' | 'phoenix' | 'rj45' | 'dmx' | 'powercon' | 'ethercon' | 'custom';

export type Pin = {
  id: string;
  number: number | string;
  label: string;
  function: string | null;
  color: string | null;
  position: { x: number; y: number };
};

export type Connector = {
  id: string;
  name: string;
  type: ConnectorType;
  manufacturer: string | null;
  partNumber: string | null;
  pins: Pin[];
  diagramSvg: string;
  thumbnailUrl: string;
  category: 'audio' | 'video' | 'power' | 'data' | 'lighting';
  tags: string[];
};

export type PinMapping = {
  sourcePin: string;
  destinationPin: string;
  wireColor: string;
  wireColorName?: string;
  wireFunction: string;
  notes: string | null;
};

export type WireSpec = {
  gauge: string;
  type: 'stranded' | 'solid';
  shielded: boolean;
  cableType: string | null;
  manufacturer: string | null;
};

export type WireMapping = {
  id: string;
  name: string;
  description: string | null;
  sourceConnectorId: string;
  destinationConnectorId: string;
  pinMappings: PinMapping[];
  wireSpec: WireSpec;
  createdAt: string;
  createdBy: string;
  isStandard: boolean;
  category: string;
  tags: string[];
};

export type ChainSegment = {
  id: string;
  mapping: WireMapping;
  order: number;
};

export type WireDiagram = {
  id: string;
  name: string;
  description: string | null;
  type: 'simple' | 'chain';
  mapping?: WireMapping;
  chain?: ChainSegment[];
  diagramSvg: string;
  printLayout: 'portrait' | 'landscape';
  createdAt: string;
  createdBy: string;
  tags: string[];
};

export type MappingStrategy = 'sequential' | 'function-based' | 'color-based';

export type WireColor = {
  name: string;
  hex: string;
};

// Label Types
export type LabelElement = {
  id: string;
  type: 'text' | 'qrcode' | 'barcode' | 'image' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
};

export type LabelDesign = {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: LabelElement[];
  createdAt: string;
  createdBy: string;
};

// State Types
export type AuthState = {
  user: UserRecord | null;
  isAuthenticated: boolean;
  permissions: Set<Permission>;
  pendingRequestCount: number;
};

export type UserManagementState = {
  users: Record<string, UserRecord>;
  usersByStatus: Record<UserStatus, string[]>;
  permissionRequests: Record<string, PermissionRequest>;
  pendingRequests: string[];
};

export type InventoryState = {
  items: Record<string, InventoryItem>;
  locations: Record<string, Location>;
  categories: Record<string, Category>;
  transactions: Record<string, InventoryTransaction>;
  itemsByLocation: Record<string, string[]>;
  itemsByCategory: Record<string, string[]>;
};

export type RentalState = {
  rentals: Record<string, Rental>;
  rentalsByStatus: Record<RentalStatus, string[]>;
  rentalsByCustomer: Record<string, string[]>;
  pullLists: Record<string, PullList>;
  pullListsByStatus: Record<PullListStatus, string[]>;
};

export type CustomerState = {
  customers: Record<string, Customer>;
};

export type WireDiagramState = {
  connectors: Record<string, Connector>;
  mappings: Record<string, WireMapping>;
  diagrams: Record<string, WireDiagram>;
};

export type LabelState = {
  designs: Record<string, LabelDesign>;
};

export type AppState = {
  auth: AuthState;
  userManagement: UserManagementState;
  inventory: InventoryState;
  rentals: RentalState;
  customers: CustomerState;
  wireDiagrams: WireDiagramState;
  labels: LabelState;
  timeClock: TimeClockState;
  jobs: JobState;
  controllerBuilder: ControllerBuilderState;
};

// Action Types
export type Action =
  // Auth
  | { type: 'AUTH_LOGIN'; payload: UserRecord }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_SET_USER'; payload: UserRecord }
  // User Management
  | { type: 'USER_APPROVE'; payload: string }
  | { type: 'USER_BLOCK'; payload: string }
  | { type: 'USER_UPDATE_ROLE'; payload: { userId: string; role: Role } }
  | { type: 'USER_UPDATE_PERMISSIONS'; payload: { userId: string; permission: Permission; enabled: boolean } }
  | { type: 'USER_UPDATE_STATUS'; payload: { userId: string; status: UserStatus } }
  | { type: 'PERMISSION_REQUEST_CREATE'; payload: Omit<PermissionRequest, 'id' | 'status' | 'reviewedAt' | 'reviewedBy' | 'reviewNotes'> }
  | { type: 'PERMISSION_REQUEST_APPROVE'; payload: { requestId: string; reviewNotes: string } }
  | { type: 'PERMISSION_REQUEST_DENY'; payload: { requestId: string; reviewNotes: string } }
  // Inventory
  | { type: 'INVENTORY_ADD_ITEM'; payload: InventoryItem }
  | { type: 'INVENTORY_UPDATE_ITEM'; payload: { id: string; changes: Partial<InventoryItem> } }
  | { type: 'INVENTORY_REMOVE_ITEM'; payload: { id: string; reason: RemovalReason; removedBy: string } }
  | { type: 'INVENTORY_BULK_IMPORT'; payload: InventoryItem[] }
  | { type: 'INVENTORY_ADJUST_QUANTITY'; payload: { itemId: string; delta: number; reason: string; notes?: string; userId: string; relatedRentalId?: string; relatedPullListId?: string } }
  | { type: 'INVENTORY_ADD_TRANSACTION'; payload: InventoryTransaction }
  // Rentals
  | { type: 'RENTAL_CREATE'; payload: Rental }
  | { type: 'RENTAL_UPDATE_STATUS'; payload: { id: string; status: RentalStatus } }
  // Pull Lists
  | { type: 'PULL_LIST_CREATE'; payload: PullList }
  | { type: 'PULL_LIST_UPDATE'; payload: { id: string; changes: Partial<PullList> } }
  | { type: 'PULL_LIST_UPDATE_ITEM'; payload: { pullListId: string; itemSku: string; changes: Partial<PullListItem> } }
  // Customers
  | { type: 'CUSTOMER_ADD'; payload: Customer }
  | { type: 'CUSTOMER_UPDATE'; payload: { id: string; changes: Partial<Customer> } }
  // Wire Diagrams
  | { type: 'WIRE_DIAGRAM_ADD'; payload: WireDiagram }
  | { type: 'WIRE_MAPPING_ADD'; payload: WireMapping }
  | { type: 'CONNECTOR_UPDATE'; payload: { id: string; changes: Partial<Connector> } }
  // Labels
  | { type: 'LABEL_SAVE_DESIGN'; payload: LabelDesign }
  // Time Clock
  | { type: 'TIME_CLOCK_IN'; payload: { userId: string; timestamp: string } }
  | { type: 'TIME_CLOCK_OUT'; payload: { userId: string; timestamp: string } }
  // Jobs
  | { type: 'JOB_CREATE'; payload: Job }
  | { type: 'JOB_UPDATE'; payload: { id: string; changes: Partial<Job> } }
  | { type: 'JOB_UPDATE_STATUS'; payload: { id: string; status: JobStatus } }
  | { type: 'JOB_DELETE'; payload: string }
  // Build Recipes
  | { type: 'RECIPE_CREATE'; payload: BuildRecipe }
  | { type: 'RECIPE_UPDATE'; payload: { id: string; changes: Partial<BuildRecipe> } }
  | { type: 'RECIPE_DELETE'; payload: string };

// Activity Types
export type ActivityItem = {
  id: string;
  type: 'add' | 'rental' | 'adjust' | 'remove' | 'user';
  description: string;
  user: string;
  timeAgo: string;
  timestamp: string;
};

// Time Clock Types
export type TimeEntry = {
  id: string;
  userId: string;
  clockIn: string; // ISO timestamp
  clockOut?: string; // ISO timestamp, optional while clocked in
  duration?: number; // minutes, calculated on clock out
  date: string; // YYYY-MM-DD for easy grouping
};

export type TimeClockState = {
  entries: Record<string, TimeEntry>;
  entriesByUser: Record<string, string[]>;
  entriesByDate: Record<string, string[]>;
  activeEntryByUser: Record<string, string>; // userId -> current active entryId
};

// Job System Types
export type JobType = 'rental' | 'install' | 'build' | 'service';

export type JobStatus = 'planning' | 'ready' | 'in-progress' | 'completed' | 'cancelled';

export type JobItem = {
  sku: string;
  itemId: string;
  itemName: string;
  quantity: number;
  willReturn: boolean; // False for installs/builds (items consumed/installed)
  binLocation?: string;
  notes?: string;
};

export type Job = {
  id: string;
  type: JobType;
  name: string;
  customerId?: string;
  customerName?: string;
  status: JobStatus;
  startDate: string;
  endDate?: string; // Optional for installs (no return date)
  items: JobItem[];
  assignedTo?: string; // User ID
  notes?: string;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  lastModifiedBy: string;
  pullListId?: string;

  // Rental-specific (backward compatible)
  customerEmail?: string;
  customerPhone?: string;
  totalCost?: Money;
  depositAmount?: Money;
  depositReturned?: boolean;
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'overdue';

  // Install-specific
  venue?: string;
  projectValue?: number; // Owner only

  // Build-specific
  buildRecipeId?: string;
  outputItemSku?: string;
  outputItemName?: string;
  buildDuration?: number; // minutes (actual)
  estimatedBuildTime?: number; // minutes
  buildPhotos?: string[];
  serialNumber?: string;
  testNotes?: string;
};

export type RecipeComponent = {
  sku: string;
  itemName: string;
  quantity: number;
  notes?: string;
};

export type BuildRecipe = {
  id: string;
  name: string;
  outputItemSku: string; // The finished product
  outputItemName: string;
  components: RecipeComponent[];
  estimatedBuildTime: number; // minutes
  instructions?: string;
  photos?: string[];
  createdBy: string;
  createdAt: string;
  lastUsed?: string;
};

// Controller Builder Types
export type Enclosure = {
  id: string;
  sku: string;
  name: string;
  price: number;
  leftPlateOptions: string[];
  rightPlateOptions: string[];
  image?: string;
  description?: string;
};

export type ControllerBoard = {
  id: string;
  sku: string;
  name: string;
  outputs: number;
  protocol: 'SPI' | 'DMX' | 'PWM' | 'ArtNet';
  price: number;
  requiresEthernet: boolean;
  powerRequirement: string;
  image?: string;
};

export type PowerSupply = {
  id: string;
  sku: string;
  name: string;
  voltage: number;
  amperage: number;
  price: number;
};

export type PlateType = {
  id: string;
  name: string;
  slots: number;
  compatibleConnectors: string[];
};

export type ConnectorOption = {
  id: string;
  sku: string;
  name: string;
  price: number;
  pinCount?: number;
  category: 'xlr' | 'power' | 'data' | 'other';
};

export type LEDOutputType = 'rgb' | 'rgbw' | 'rgbcct' | 'single';

export type ControllerBuildConfig = {
  enclosure?: Enclosure;
  controller?: ControllerBoard;
  powerSupply?: PowerSupply;
  ledOutputType?: LEDOutputType;
  leftPlate?: {
    type: PlateType;
    slots: (ConnectorOption | null)[];
  };
  rightPlate?: {
    type: PlateType;
    slots: (ConnectorOption | null)[];
  };
};

export type JobState = {
  jobs: Record<string, Job>;
  jobsByStatus: Record<JobStatus, string[]>;
  jobsByType: Record<JobType, string[]>;
  jobsByCustomer: Record<string, string[]>;
  buildRecipes: Record<string, BuildRecipe>;
};

export type ControllerBuilderState = {
  enclosures: Record<string, Enclosure>;
  controllers: Record<string, ControllerBoard>;
  powerSupplies: Record<string, PowerSupply>;
  plateTypes: Record<string, PlateType>;
  connectorOptions: Record<string, ConnectorOption>;
};
