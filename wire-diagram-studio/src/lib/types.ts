// Core data types for Wire Diagram Studio v2
// Redesigned for Notion "Connector Templates Diagram Creator" integration

// ============================================================================
// PIN TYPES - Enhanced with visual positioning and LED/function colors
// ============================================================================

export interface Pin {
  id: string;
  pinLabel: string;           // "1", "2", "A", etc.
  functionLabel: string;      // "GND", "+24V", "Data", etc.
  wireName: string;           // "Power +", "Signal In"
  wireColor: string;          // Display name: "Red", "Black/White"
  wireColorHex: string;       // "#dc2626"
  ledFunctionColor?: string;  // LED/function color: "V+", "Data", "Red LED", etc.
  ledFunctionHex?: string;    // "#ff0000" for visual glow
  cableToUse?: string;        // "18AWG Silicone", "CAT5e"
  notes: string;
  sortOrder: number;
  // Visual positioning (for canvas-based diagrams)
  x?: number;
  y?: number;
  textColor?: string;         // Text color inside pin circle
}

// Wire color presets
export const WIRE_COLORS = [
  { name: 'Red', hex: '#ff0000' },
  { name: 'Green', hex: '#008000' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Blue', hex: '#0000ff' },
  { name: 'Yellow', hex: '#ffff00' },
  { name: 'Brown', hex: '#8b4513' },
  { name: 'Orange', hex: '#ffa500' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Pink', hex: '#ffc0cb' },
  { name: 'Cyan', hex: '#00ffff' },
  { name: 'Black/White', hex: '#1a1a1a' },
  { name: 'Red/Black', hex: '#8b0000' },
] as const;

// Wire function/LED colors
export const WIRE_FUNCTION_COLORS = [
  { name: 'V+', hex: '#ff0000', description: 'Power positive' },
  { name: 'Data', hex: '#ffff00', description: 'Data signal' },
  { name: 'Ground', hex: '#000000', description: 'Ground/Common' },
  { name: 'Red LED', hex: '#ff0000', description: 'Red LED output' },
  { name: 'Green LED', hex: '#00ff00', description: 'Green LED output' },
  { name: 'Blue LED', hex: '#0000ff', description: 'Blue LED output' },
  { name: 'White LED', hex: '#ffffff', description: 'White LED output' },
  { name: 'Warm White', hex: '#ffd700', description: 'Warm white (2700-3000K)' },
  { name: 'Cool White', hex: '#e6f3ff', description: 'Cool white (5000-6500K)' },
  { name: 'Natural White', hex: '#f5f5dc', description: 'Natural white (4000K)' },
] as const;

// ============================================================================
// CONNECTOR TEMPLATE - From Notion "Connector Templates Diagram Creator"
// One template per gender variant (e.g., "NC3FXX 3-pin XLR (Female Cable Connector)")
// ============================================================================

export interface ConnectorTemplate {
  id: string;
  notionPageId?: string;          // Notion page ID for sync
  name: string;                   // Full name with part number (e.g., "NC3FXX 3-pin XLR (Female Cable Connector)")
  type: string;                   // Connector type (e.g., "3-Pin XLR", "NL4")
  gender: 'male' | 'female';      // Gender of this specific template
  partNumber: string;             // Part number for this variant (e.g., "NC3FXX")
  imageUrl?: string;              // URL to connector blank diagram image
  mountType?: string;             // "Cable Connector" or "Panel Mount"

  // Default pinout configuration (JSON stored in Notion)
  defaultPinout: PinoutConfig;

  // Metadata
  category?: string[];            // ["Power", "Data", "SPI", "PWM"]
  manufacturer?: string;
  pinCount: number;

  createdAt: number;
  updatedAt: number;
}

// Pinout configuration - stored as JSON in Notion
export interface PinoutConfig {
  pins: PinPosition[];
  pinSize: number;                // Default pin circle size
  displayOptions: DisplayOptions;
}

export interface PinPosition {
  pinLabel: string;
  x: number;
  y: number;
  defaultWireColor?: string;
  defaultWireColorHex?: string;
  defaultFunctionLabel?: string;
  defaultLedFunctionColor?: string;
  defaultLedFunctionHex?: string;
}

export interface DisplayOptions {
  showPinNumber: boolean;
  showWireColor: boolean;
  showLedColor: boolean;
}

// ============================================================================
// STANDARD DIAGRAM - Master templates (passcode protected)
// ============================================================================

export interface StandardDiagram {
  id: string;
  notionPageId?: string;          // Notion page ID for sync

  name: string;
  connectorLabel: string;

  // Template reference
  templateId?: string;            // Reference to ConnectorTemplate
  connectorVariant: 'male' | 'female';
  signalType?: string;            // "Data", "SPI", "PWM", "Power" - signal category

  // Image data
  imageDataUrl?: string;          // Base64 image or URL

  // Pin configuration
  pins: Pin[];
  pinSize: number;
  pinCount?: number;             // Pin count from Notion (may differ from pins.length)
  displayOptions: DisplayOptions;

  // Metadata
  createdAt: number;
  updatedAt: number;
  lastSyncedAt?: number;
}

// Signal types for categorizing wire diagrams
export const SIGNAL_TYPES = ['Data', 'SPI', 'PWM', 'Power'] as const;
export type SignalType = typeof SIGNAL_TYPES[number];

// ============================================================================
// PROJECT DIAGRAM - Forked from standards for specific jobs
// ============================================================================

export interface ProjectDiagram {
  id: string;
  notionPageId?: string;

  name: string;
  connectorLabel: string;

  // Derived from standard
  derivedFromStandardId: string;

  // Image and pins (copied from standard, can be customized)
  imageDataUrl?: string;
  connectorVariant: 'male' | 'female';
  pins: Pin[];
  pinSize: number;
  displayOptions: DisplayOptions;

  // Project-specific metadata
  projectName?: string;           // "Hilton Lobby Fountain"
  location?: string;              // "Building A, Panel 3"

  createdAt: number;
  updatedAt: number;
}

export type Diagram = StandardDiagram | ProjectDiagram;

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface ExportOptions {
  includeLegend: boolean;
  scale: 1 | 2 | 3;
  background: 'original' | 'white' | 'transparent';
  legendColumns: {
    pinNumber: boolean;
    wireColor: boolean;
    ledColor: boolean;
    cableToUse: boolean;
  };
}

// ============================================================================
// APP DATA (for backup/restore)
// ============================================================================

export interface AppData {
  templates: ConnectorTemplate[];
  standards: StandardDiagram[];
  projects: ProjectDiagram[];
  exportedAt: number;
  version: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isProjectDiagram(diagram: Diagram): diagram is ProjectDiagram {
  return 'derivedFromStandardId' in diagram;
}

export function isStandardDiagram(diagram: Diagram): diagram is StandardDiagram {
  return !('derivedFromStandardId' in diagram);
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createEmptyPin(sortOrder: number): Pin {
  return {
    id: crypto.randomUUID(),
    pinLabel: '',
    functionLabel: '',
    wireName: '',
    wireColor: '',
    wireColorHex: '#000000',
    notes: '',
    sortOrder,
  };
}

export function createPinWithPosition(
  pinLabel: string,
  x: number,
  y: number,
  sortOrder: number
): Pin {
  return {
    id: crypto.randomUUID(),
    pinLabel,
    functionLabel: '',
    wireName: '',
    wireColor: WIRE_COLORS[0].name,
    wireColorHex: WIRE_COLORS[0].hex,
    notes: '',
    sortOrder,
    x,
    y,
    textColor: '#000000',
  };
}

export function createEmptyStandard(): StandardDiagram {
  return {
    id: crypto.randomUUID(),
    name: '',
    connectorLabel: '',
    connectorVariant: 'female',
    pins: [],
    pinSize: 15,
    displayOptions: {
      showPinNumber: true,
      showWireColor: false,
      showLedColor: false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createStandardFromTemplate(
  template: ConnectorTemplate,
  name: string
): StandardDiagram {
  // Template already has specific gender, use its imageUrl directly
  return {
    id: crypto.randomUUID(),
    name,
    connectorLabel: template.type,
    templateId: template.id,
    connectorVariant: template.gender,
    imageDataUrl: template.imageUrl,
    pins: template.defaultPinout.pins.map((pos, index) => ({
      id: crypto.randomUUID(),
      pinLabel: pos.pinLabel,
      functionLabel: pos.defaultFunctionLabel || '',
      wireName: '',
      wireColor: pos.defaultWireColor || WIRE_COLORS[0].name,
      wireColorHex: pos.defaultWireColorHex || WIRE_COLORS[0].hex,
      ledFunctionColor: pos.defaultLedFunctionColor,
      ledFunctionHex: pos.defaultLedFunctionHex,
      notes: '',
      sortOrder: index,
      x: pos.x,
      y: pos.y,
      textColor: '#000000',
    })),
    pinSize: template.defaultPinout.pinSize,
    displayOptions: { ...template.defaultPinout.displayOptions },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function forkStandardToProject(
  standard: StandardDiagram,
  projectName: string
): ProjectDiagram {
  return {
    id: crypto.randomUUID(),
    name: projectName || `${standard.name} - Project`,
    connectorLabel: standard.connectorLabel,
    derivedFromStandardId: standard.id,
    imageDataUrl: standard.imageDataUrl,
    connectorVariant: standard.connectorVariant,
    pins: standard.pins.map(pin => ({
      ...pin,
      id: crypto.randomUUID(),
    })),
    pinSize: standard.pinSize,
    displayOptions: { ...standard.displayOptions },
    projectName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ============================================================================
// PASSCODE FOR STANDARD EDITS
// ============================================================================

export const STANDARD_EDIT_PASSCODE = 'lediscool';

export function verifyStandardEditPasscode(input: string): boolean {
  return input.toLowerCase() === STANDARD_EDIT_PASSCODE;
}
