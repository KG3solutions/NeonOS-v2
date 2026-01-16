// Wire color presets for quick selection

export interface WireColorPreset {
  name: string;
  hex: string;
}

export const WIRE_COLOR_PRESETS: WireColorPreset[] = [
  // Standard solid colors
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#f5f5f5' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Brown', hex: '#78350f' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Pink', hex: '#db2777' },
  { name: 'Gray', hex: '#6b7280' },

  // Special/utility
  { name: 'Bare/Copper', hex: '#b87333' },
  { name: 'Silver', hex: '#a8a8a8' },

  // Common striped combinations
  { name: 'Black/White', hex: '#4a4a4a' },
  { name: 'Red/Black', hex: '#8b1a1a' },
  { name: 'Blue/White', hex: '#4a7ab8' },
  { name: 'Green/Yellow', hex: '#65a30d' },
  { name: 'Brown/White', hex: '#92400e' },
  { name: 'Orange/White', hex: '#c2410c' },
  { name: 'Yellow/Black', hex: '#a16207' },
  { name: 'Purple/White', hex: '#6d28d9' },
  { name: 'Gray/White', hex: '#9ca3af' },
  { name: 'Red/White', hex: '#ef4444' },
  { name: 'Blue/Black', hex: '#1e40af' },
  { name: 'Green/White', hex: '#22c55e' },
];

// Get hex color for a color name
export function getHexForColorName(colorName: string): string {
  const preset = WIRE_COLOR_PRESETS.find(
    p => p.name.toLowerCase() === colorName.toLowerCase()
  );
  return preset?.hex || '#6b7280';
}

// Check if a color name exists in presets
export function isPresetColor(colorName: string): boolean {
  return WIRE_COLOR_PRESETS.some(
    p => p.name.toLowerCase() === colorName.toLowerCase()
  );
}

// Get contrasting text color for a background hex
export function getContrastColor(hex: string): string {
  // Remove # if present
  const color = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}
