// Sync types for Notion/Zapier integration
// Updated for "Connector Templates Diagram Creator" database

import type { Pin, PinoutConfig, DisplayOptions } from '../types';

export interface SyncConfig {
  enabled: boolean;
  zapierWebhookUrl: string;           // Outgoing: App → Zapier → Notion
  templateWebhookUrl?: string;        // Templates webhook (separate Zap)
  lastSyncAt: number | null;
  syncOnSave: boolean;
}

// ============================================================================
// CONNECTOR TEMPLATE SYNC (from Notion "Connector Templates Diagram Creator")
// ============================================================================

export interface NotionConnectorTemplate {
  notionPageId: string;
  name: string;                       // Connector name

  // Male/Female Images from Notion Files property
  femaleImageUrl?: string;
  femalePartNumber?: string;
  maleImageUrl?: string;
  malePartNumber?: string;

  // JSON pinout stored as Text property in Notion
  pinoutJson?: string;                // JSON string of PinoutConfig

  // Metadata
  category?: string[];
  manufacturer?: string;
  pinCount: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// STANDARD DIAGRAM SYNC
// ============================================================================

export interface NotionStandardRecord {
  notionPageId?: string;
  appId?: string;                     // Our local ID for cross-reference

  name: string;
  connectorLabel: string;
  templateId?: string;                // Reference to connector template
  connectorVariant: 'male' | 'female';

  // Image as base64 or URL
  imageUrl?: string;

  // Pin data as JSON
  pinsJson: string;                   // JSON string of Pin[]
  pinSize: number;
  displayOptionsJson: string;         // JSON string of DisplayOptions

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PROJECT DIAGRAM SYNC
// ============================================================================

export interface NotionProjectRecord {
  notionPageId?: string;
  appId?: string;

  name: string;
  connectorLabel: string;
  standardId: string;                 // Reference to parent standard

  // Project-specific
  projectName?: string;
  location?: string;

  // Inherited from standard
  connectorVariant: 'male' | 'female';
  pinsJson: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SYNC EVENTS
// ============================================================================

export type SyncEntityType = 'template' | 'standard' | 'project';

export interface SyncEvent {
  type: 'create' | 'update' | 'delete';
  entityType: SyncEntityType;
  source: 'app' | 'notion';
  entityId: string;
  timestamp: number;
  data?: NotionStandardRecord | NotionProjectRecord | NotionConnectorTemplate;
}

export interface SyncQueueItem {
  id: string;
  event: SyncEvent;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  lastAttempt: number | null;
  error?: string;
}

// ============================================================================
// ZAPIER WEBHOOK PAYLOADS
// ============================================================================

// App → Zapier (Outgoing)
export interface ZapierTemplatePayload {
  event: 'template_loaded';
  notionPageId: string;
  data: {
    name: string;
    femaleImageUrl?: string;
    femalePartNumber?: string;
    maleImageUrl?: string;
    malePartNumber?: string;
    pinoutJson: string;
    category?: string[];
    manufacturer?: string;
    pinCount: number;
  };
  timestamp: string;
}

export interface ZapierStandardPayload {
  event: 'standard_created' | 'standard_updated' | 'standard_deleted';
  appId: string;
  notionPageId?: string;
  data: {
    name: string;
    connectorLabel: string;
    templateId?: string;
    connectorVariant: 'male' | 'female';
    imageUrl?: string;
    pins: Pin[];
    pinSize: number;
    displayOptions: DisplayOptions;
  };
  timestamp: string;
}

export interface ZapierProjectPayload {
  event: 'project_created' | 'project_updated' | 'project_deleted';
  appId: string;
  notionPageId?: string;
  standardId: string;
  data: {
    name: string;
    connectorLabel: string;
    projectName?: string;
    location?: string;
    connectorVariant: 'male' | 'female';
    pins: Pin[];
  };
  timestamp: string;
}

export type ZapierPayload = ZapierTemplatePayload | ZapierStandardPayload | ZapierProjectPayload;

// ============================================================================
// INCOMING WEBHOOK PAYLOADS (Notion → App via Zapier)
// ============================================================================

export interface IncomingTemplatePayload {
  entityType: 'template';
  notionPageId: string;
  name: string;
  femaleImageUrl?: string;
  femalePartNumber?: string;
  maleImageUrl?: string;
  malePartNumber?: string;
  pinoutJson?: string;
  category?: string;                  // Comma-separated in Notion
  manufacturer?: string;
  pinCount: number;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface IncomingStandardPayload {
  entityType: 'standard';
  notionPageId: string;
  appId?: string;
  name: string;
  connectorLabel: string;
  templateId?: string;
  connectorVariant?: 'male' | 'female';
  imageUrl?: string;
  pinsJson: string;
  pinSize?: number;
  displayOptionsJson?: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface IncomingProjectPayload {
  entityType: 'project';
  notionPageId: string;
  appId?: string;
  name: string;
  connectorLabel: string;
  standardId?: string;
  projectName?: string;
  location?: string;
  connectorVariant?: 'male' | 'female';
  pinsJson: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export type IncomingNotionPayload =
  | IncomingTemplatePayload
  | IncomingStandardPayload
  | IncomingProjectPayload;

// ============================================================================
// NOTION DATABASE IDs (From MCP Connection)
// ============================================================================

export const NOTION_DATABASE_IDS = {
  // Connector Templates Diagram Creator
  // Contains: connector images (male/female), pinout JSON, part numbers
  CONNECTOR_TEMPLATES: '240670c5-6475-8058-b5e1-cac9464d006a',

  // Wire Diagrams (Standards)
  // Contains: completed wire diagrams, diagram data JSON, thumbnails
  WIRE_DIAGRAMS: '240670c5-6475-8082-af7b-ce7a390c524e',

  // KG3 All Jobs (Projects)
  // Contains: client projects that reference wire diagrams
  PROJECTS: '21d670c5-6475-808b-8f3d-000b36fdf293',
} as const;

// Property IDs for each database (for API calls)
export const NOTION_PROPERTY_IDS = {
  CONNECTOR_TEMPLATES: {
    name: 'title',
    pinoutJson: 'Wh`U',
    appId: 'QFfy',
    lastSynced: 'sBOn',
    femaleImage: 'n\\Ir',
    maleImage: '_IP]',
    femalePartNumber: '%3FuPq',
    malePartNumber: 'nZwG',
    pinCount: 'Fhw%3B',
    manufacturer: 'o%3DMQ',
    category: '%3FU%5EM',
    type: 'kj%40m',
    mountType: 'NT%7B%40',
  },
  WIRE_DIAGRAMS: {
    name: 'title',
    appId: 'dqDZ',
    lastSynced: 'd%3CJX',
    diagramData: 's%40tc',
    connectorVariant: '%3FB%3D%60',
    connectorType: 'MDML',
    pinCount: 'sHs%40',
    status: '%60%3DUk',
    project: 'riF~',
    thumbnail: 'k%3EEk',
    exportedPng: 'nSp%3C',
    notes: '%7BxnH',
  },
} as const;

// ============================================================================
// DEFAULTS
// ============================================================================

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: false,
  zapierWebhookUrl: '',
  templateWebhookUrl: '',
  lastSyncAt: null,
  syncOnSave: true,
};
