// Direct Notion API sync (bypasses Zapier)
// Uses the Notion API directly via fetch to load templates
// In development, requests are proxied through Vite to bypass CORS

import type { ConnectorTemplate, PinoutConfig, StandardDiagram, Pin, DisplayOptions } from '../types';
import { NOTION_DATABASE_IDS } from './types';

// Use proxy in development to bypass CORS, direct API in production (requires server)
const NOTION_API_BASE = import.meta.env.DEV ? '/api/notion/v1' : 'https://api.notion.com/v1';

// API token should be set via environment variable VITE_NOTION_API_TOKEN
// Create a .env.local file with: VITE_NOTION_API_TOKEN=your_token_here
export function getNotionToken(): string {
  return import.meta.env.VITE_NOTION_API_TOKEN || '';
}

export function isNotionConfigured(): boolean {
  return !!getNotionToken();
}

// Helper to make Notion API requests
async function notionFetch(endpoint: string, options: RequestInit = {}) {
  const token = getNotionToken();
  if (!token) {
    throw new Error('Notion API token not configured');
  }

  const response = await fetch(`${NOTION_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Notion API error: ${response.status}`);
  }

  return response.json();
}

// Extract text from Notion rich_text array
function extractText(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return '';
  return richText.map(t => t.plain_text || '').join('');
}

// Extract first file URL from Notion files array
function extractFileUrl(files: any[]): string | undefined {
  if (!files || !Array.isArray(files) || files.length === 0) return undefined;
  const file = files[0];
  if (file.type === 'file') {
    return file.file?.url;
  } else if (file.type === 'external') {
    return file.external?.url;
  }
  return undefined;
}

// Parse a Notion template page into our ConnectorTemplate type
// New structure: One page per gender variant with unified Part Number and Image properties
function parseTemplateFromNotion(page: any): ConnectorTemplate {
  const props = page.properties;

  // Extract name from title (e.g., "NC3FXX 3-pin XLR (Female Cable Connector)")
  const name = props.Name?.title?.[0]?.plain_text || 'Unnamed Template';

  // Extract connector type (e.g., "3-Pin XLR", "NL4")
  const type = props.Type?.select?.name || '';

  // Determine gender from:
  // 1. Gender select property (preferred)
  // 2. Name parsing (fallback)
  let gender: 'male' | 'female' = 'female';
  const genderSelect = props.Gender?.select?.name?.toLowerCase();

  if (genderSelect) {
    gender = genderSelect.includes('male') && !genderSelect.includes('female') ? 'male' : 'female';
  } else if (name.toLowerCase().includes('male') && !name.toLowerCase().includes('female')) {
    gender = 'male';
  }

  // Extract unified part number
  const partNumber = extractText(props['Part Number']?.rich_text);

  // Extract unified image URL
  const imageUrl = extractFileUrl(props['Image']?.files);

  // Extract mount type
  const mountType = props['Mount Type']?.select?.name;

  // Extract pinout JSON
  const pinoutJsonStr = extractText(props['Pinout JSON']?.rich_text);
  let defaultPinout: PinoutConfig = {
    pins: [],
    pinSize: 15,
    displayOptions: {
      showPinNumber: true,
      showWireColor: false,
      showLedColor: false
    }
  };

  if (pinoutJsonStr) {
    try {
      defaultPinout = JSON.parse(pinoutJsonStr);
    } catch (e) {
      console.warn(`Failed to parse pinout JSON for ${name}:`, e);
    }
  }

  // Extract other properties
  const pinCount = props['Pin Count']?.number || 0;
  const manufacturer = props.Manufacturer?.select?.name;
  const category = props.Category?.multi_select?.map((s: any) => s.name) || [];

  return {
    id: page.id,
    notionPageId: page.id,
    name,
    type,
    gender,
    partNumber: partNumber || '',
    imageUrl,
    mountType,
    defaultPinout,
    category: category.length > 0 ? category : undefined,
    manufacturer,
    pinCount,
    createdAt: new Date(page.created_time).getTime(),
    updatedAt: new Date(page.last_edited_time).getTime(),
  };
}

// Load all connector templates from Notion
export async function loadTemplatesFromNotion(): Promise<ConnectorTemplate[]> {
  const response = await notionFetch(`/databases/${NOTION_DATABASE_IDS.CONNECTOR_TEMPLATES}/query`, {
    method: 'POST',
    body: JSON.stringify({
      page_size: 100,
    }),
  });

  const templates: ConnectorTemplate[] = [];

  for (const page of response.results) {
    try {
      const template = parseTemplateFromNotion(page);
      templates.push(template);
    } catch (e) {
      console.error('Failed to parse template:', e);
    }
  }

  return templates;
}

// Update pinout JSON for a template in Notion
export async function updateTemplatePinoutInNotion(
  pageId: string,
  pinout: PinoutConfig,
  pinCount: number
): Promise<void> {
  await notionFetch(`/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      properties: {
        'Pinout JSON': {
          rich_text: [{
            type: 'text',
            text: { content: JSON.stringify(pinout) }
          }]
        },
        'Pin Count': {
          number: pinCount
        },
        'Last Synced': {
          date: { start: new Date().toISOString() }
        }
      }
    }),
  });
}

// Parse a Notion wire diagram page into our StandardDiagram type
function parseWireDiagramFromNotion(page: any): StandardDiagram {
  const props = page.properties;

  // Extract name from title
  const name = props.Name?.title?.[0]?.plain_text || 'Unnamed Diagram';

  // Extract connector type (relation to templates or select)
  const connectorLabel = props['Connector Type']?.select?.name ||
    props['Connector Type']?.rich_text?.[0]?.plain_text || '';

  // Extract connector variant (male/female)
  const variantStr = props['Connector Variant']?.select?.name?.toLowerCase() || 'female';
  const connectorVariant: 'male' | 'female' = variantStr.includes('male') && !variantStr.includes('female') ? 'male' : 'female';

  // Extract signal type / category (e.g., Data, SPI, PWM)
  const signalType = props['Signal Type']?.select?.name ||
    props['Category']?.select?.name ||
    props['Tags']?.multi_select?.[0]?.name || undefined;

  // Extract pin count
  const pinCount = props['Pin Count']?.number || 0;

  // Extract diagram data JSON
  const diagramDataStr = extractText(props['Diagram Data']?.rich_text);
  let pins: Pin[] = [];
  let pinSize = 15;
  let displayOptions: DisplayOptions = {
    showPinNumber: true,
    showWireColor: false,
    showLedColor: false
  };

  if (diagramDataStr) {
    try {
      const data = JSON.parse(diagramDataStr);
      pins = data.pins || [];
      pinSize = data.pinSize || 15;
      displayOptions = data.displayOptions || displayOptions;
    } catch (e) {
      console.warn(`Failed to parse diagram data JSON for ${name}:`, e);
    }
  }

  // Extract thumbnail/image
  const imageDataUrl = extractFileUrl(props['Thumbnail']?.files) ||
    extractFileUrl(props['Exported PNG']?.files);

  // Extract template ID if present (relation)
  const templateId = props['Template']?.relation?.[0]?.id;

  return {
    id: page.id,
    notionPageId: page.id,
    name,
    connectorLabel,
    templateId,
    connectorVariant,
    signalType,
    imageDataUrl,
    pins,
    pinSize,
    pinCount,
    displayOptions,
    createdAt: new Date(page.created_time).getTime(),
    updatedAt: new Date(page.last_edited_time).getTime(),
    lastSyncedAt: Date.now(),
  };
}

// Load all wire diagrams (standards) from Notion
export async function loadWireDiagramsFromNotion(): Promise<StandardDiagram[]> {
  const response = await notionFetch(`/databases/${NOTION_DATABASE_IDS.WIRE_DIAGRAMS}/query`, {
    method: 'POST',
    body: JSON.stringify({
      page_size: 100,
    }),
  });

  const diagrams: StandardDiagram[] = [];

  for (const page of response.results) {
    try {
      const diagram = parseWireDiagramFromNotion(page);
      diagrams.push(diagram);
    } catch (e) {
      console.error('Failed to parse wire diagram:', e);
    }
  }

  return diagrams;
}

// Test the Notion connection
export async function testNotionConnection(): Promise<{ success: boolean; error?: string; templateCount?: number }> {
  try {
    const response = await notionFetch(`/databases/${NOTION_DATABASE_IDS.CONNECTOR_TEMPLATES}/query`, {
      method: 'POST',
      body: JSON.stringify({ page_size: 1 }),
    });

    return {
      success: true,
      templateCount: response.results?.length || 0
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
