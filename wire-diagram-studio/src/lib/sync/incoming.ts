// Incoming sync: Notion → Zapier → App
// This handles data coming FROM Notion via Zapier webhooks

import type { StandardDiagram, ProjectDiagram, ConnectorTemplate, Pin, PinoutConfig } from '../types';
import type {
  IncomingNotionPayload,
  IncomingTemplatePayload,
  IncomingStandardPayload,
  IncomingProjectPayload
} from './types';
import { getAppIdByNotionPageId, setNotionIdMapping, removeNotionIdMapping } from './config';
import {
  saveStandard,
  deleteStandard,
  getStandard,
  saveTemplate,
  getTemplateByNotionId,
  saveProject,
  deleteProject,
  getProject
} from '../db';

// Type guards
function isTemplatePayload(payload: IncomingNotionPayload): payload is IncomingTemplatePayload {
  return payload.entityType === 'template';
}

function isStandardPayload(payload: IncomingNotionPayload): payload is IncomingStandardPayload {
  return payload.entityType === 'standard';
}

function isProjectPayload(payload: IncomingNotionPayload): payload is IncomingProjectPayload {
  return payload.entityType === 'project';
}

// Process incoming webhook from Zapier (Notion changes)
export async function processNotionWebhook(
  payload: IncomingNotionPayload
): Promise<{ success: boolean; action: string; entityId?: string; error?: string }> {
  try {
    // Route based on entity type
    if (isTemplatePayload(payload)) {
      return await processTemplatePayload(payload);
    } else if (isStandardPayload(payload)) {
      return await processStandardPayload(payload);
    } else if (isProjectPayload(payload)) {
      return await processProjectPayload(payload);
    } else {
      // Legacy: assume it's a standard if no entityType
      return await processStandardPayload(payload as IncomingStandardPayload);
    }
  } catch (error) {
    console.error('Error processing Notion webhook:', error);
    return {
      success: false,
      action: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// TEMPLATE PROCESSING
// ============================================================================

async function processTemplatePayload(
  payload: IncomingTemplatePayload
): Promise<{ success: boolean; action: string; entityId?: string; error?: string }> {
  if (payload.isDeleted) {
    // Handle template deletion - just ignore for now
    return { success: true, action: 'ignored' };
  }

  // Check if template already exists
  const existing = await getTemplateByNotionId(payload.notionPageId);

  // Parse pinout JSON if present
  let defaultPinout: PinoutConfig = {
    pins: [],
    pinSize: 15,
    displayOptions: {
      showPinNumber: true,
      showWireColor: false,
      showLedColor: false
    }
  };

  if (payload.pinoutJson) {
    try {
      defaultPinout = JSON.parse(payload.pinoutJson);
    } catch (e) {
      console.error('Error parsing pinout JSON:', e);
    }
  }

  // Parse category from comma-separated string
  const category = payload.category
    ? payload.category.split(',').map(c => c.trim()).filter(Boolean)
    : [];

  const template: ConnectorTemplate = {
    id: existing?.id || crypto.randomUUID(),
    notionPageId: payload.notionPageId,
    name: payload.name,
    femaleImageUrl: payload.femaleImageUrl,
    femalePartNumber: payload.femalePartNumber,
    maleImageUrl: payload.maleImageUrl,
    malePartNumber: payload.malePartNumber,
    defaultPinout,
    category,
    manufacturer: payload.manufacturer,
    pinCount: payload.pinCount || defaultPinout.pins.length,
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  await saveTemplate(template);

  return {
    success: true,
    action: existing ? 'updated' : 'created',
    entityId: template.id
  };
}

// ============================================================================
// STANDARD PROCESSING
// ============================================================================

async function processStandardPayload(
  payload: IncomingStandardPayload
): Promise<{ success: boolean; action: string; entityId?: string; error?: string }> {
  if (payload.isDeleted) {
    return await handleStandardDeletion(payload.notionPageId);
  }

  const existingAppId = payload.appId || getAppIdByNotionPageId(payload.notionPageId);

  if (existingAppId) {
    return await handleStandardUpdate(existingAppId, payload);
  } else {
    return await handleStandardCreate(payload);
  }
}

async function handleStandardCreate(
  payload: IncomingStandardPayload
): Promise<{ success: boolean; action: string; entityId?: string; error?: string }> {
  let pins: Pin[] = [];
  try {
    const parsedPins = JSON.parse(payload.pinsJson || '[]');
    pins = parsedPins.map((p: any, index: number) => ({
      id: crypto.randomUUID(),
      pinLabel: p.pinLabel || '',
      functionLabel: p.functionLabel || '',
      wireName: p.wireName || '',
      wireColor: p.wireColor || '',
      wireColorHex: p.wireColorHex || '#000000',
      ledFunctionColor: p.ledFunctionColor,
      ledFunctionHex: p.ledFunctionHex,
      cableToUse: p.cableToUse,
      notes: p.notes || '',
      sortOrder: p.sortOrder ?? index,
      x: p.x,
      y: p.y,
      textColor: p.textColor
    }));
  } catch (e) {
    console.error('Error parsing pins JSON:', e);
  }

  let displayOptions = {
    showPinNumber: true,
    showWireColor: false,
    showLedColor: false
  };

  if (payload.displayOptionsJson) {
    try {
      displayOptions = JSON.parse(payload.displayOptionsJson);
    } catch (e) {
      console.error('Error parsing display options:', e);
    }
  }

  const newStandard: StandardDiagram = {
    id: crypto.randomUUID(),
    notionPageId: payload.notionPageId,
    name: payload.name || 'Imported from Notion',
    connectorLabel: payload.connectorLabel || '',
    templateId: payload.templateId,
    connectorVariant: payload.connectorVariant || 'female',
    imageDataUrl: payload.imageUrl,
    pins,
    pinSize: payload.pinSize || 15,
    displayOptions,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await saveStandard(newStandard);
  setNotionIdMapping(newStandard.id, payload.notionPageId);

  return {
    success: true,
    action: 'created',
    entityId: newStandard.id
  };
}

async function handleStandardUpdate(
  appId: string,
  payload: IncomingStandardPayload
): Promise<{ success: boolean; action: string; entityId?: string; error?: string }> {
  const existing = await getStandard(appId);

  if (!existing) {
    return await handleStandardCreate(payload);
  }

  let pins: Pin[] = existing.pins;
  try {
    const parsedPins = JSON.parse(payload.pinsJson || '[]');
    if (parsedPins.length > 0) {
      pins = parsedPins.map((p: any, index: number) => ({
        id: crypto.randomUUID(),
        pinLabel: p.pinLabel || '',
        functionLabel: p.functionLabel || '',
        wireName: p.wireName || '',
        wireColor: p.wireColor || '',
        wireColorHex: p.wireColorHex || '#000000',
        ledFunctionColor: p.ledFunctionColor,
        ledFunctionHex: p.ledFunctionHex,
        cableToUse: p.cableToUse,
        notes: p.notes || '',
        sortOrder: p.sortOrder ?? index,
        x: p.x,
        y: p.y,
        textColor: p.textColor
      }));
    }
  } catch (e) {
    console.error('Error parsing pins JSON:', e);
  }

  let displayOptions = existing.displayOptions;
  if (payload.displayOptionsJson) {
    try {
      displayOptions = JSON.parse(payload.displayOptionsJson);
    } catch (e) {
      console.error('Error parsing display options:', e);
    }
  }

  const updatedStandard: StandardDiagram = {
    ...existing,
    notionPageId: payload.notionPageId,
    name: payload.name || existing.name,
    connectorLabel: payload.connectorLabel ?? existing.connectorLabel,
    templateId: payload.templateId ?? existing.templateId,
    connectorVariant: payload.connectorVariant ?? existing.connectorVariant,
    imageDataUrl: payload.imageUrl ?? existing.imageDataUrl,
    pins,
    pinSize: payload.pinSize ?? existing.pinSize,
    displayOptions,
    updatedAt: Date.now()
  };

  await saveStandard(updatedStandard);
  setNotionIdMapping(appId, payload.notionPageId);

  return {
    success: true,
    action: 'updated',
    entityId: appId
  };
}

async function handleStandardDeletion(
  notionPageId: string
): Promise<{ success: boolean; action: string; entityId?: string; error?: string }> {
  const appId = getAppIdByNotionPageId(notionPageId);

  if (!appId) {
    return {
      success: true,
      action: 'ignored',
      error: 'No local standard found for this Notion page'
    };
  }

  await deleteStandard(appId);
  removeNotionIdMapping(appId);

  return {
    success: true,
    action: 'deleted',
    entityId: appId
  };
}

// ============================================================================
// PROJECT PROCESSING
// ============================================================================

async function processProjectPayload(
  payload: IncomingProjectPayload
): Promise<{ success: boolean; action: string; entityId?: string; error?: string }> {
  if (payload.isDeleted) {
    return await handleProjectDeletion(payload.notionPageId);
  }

  const existingAppId = payload.appId || getAppIdByNotionPageId(payload.notionPageId);

  if (existingAppId) {
    return await handleProjectUpdate(existingAppId, payload);
  } else {
    return await handleProjectCreate(payload);
  }
}

async function handleProjectCreate(
  payload: IncomingProjectPayload
): Promise<{ success: boolean; action: string; entityId?: string; error?: string }> {
  let pins: Pin[] = [];
  try {
    const parsedPins = JSON.parse(payload.pinsJson || '[]');
    pins = parsedPins.map((p: any, index: number) => ({
      id: crypto.randomUUID(),
      pinLabel: p.pinLabel || '',
      functionLabel: p.functionLabel || '',
      wireName: p.wireName || '',
      wireColor: p.wireColor || '',
      wireColorHex: p.wireColorHex || '#000000',
      ledFunctionColor: p.ledFunctionColor,
      ledFunctionHex: p.ledFunctionHex,
      cableToUse: p.cableToUse,
      notes: p.notes || '',
      sortOrder: p.sortOrder ?? index,
      x: p.x,
      y: p.y,
      textColor: p.textColor
    }));
  } catch (e) {
    console.error('Error parsing pins JSON:', e);
  }

  const newProject: ProjectDiagram = {
    id: crypto.randomUUID(),
    notionPageId: payload.notionPageId,
    name: payload.name || 'Imported from Notion',
    connectorLabel: payload.connectorLabel || '',
    derivedFromStandardId: payload.standardId || '',
    connectorVariant: payload.connectorVariant || 'female',
    pins,
    pinSize: 15,
    displayOptions: {
      showPinNumber: true,
      showWireColor: false,
      showLedColor: false
    },
    projectName: payload.projectName,
    location: payload.location,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await saveProject(newProject);
  setNotionIdMapping(newProject.id, payload.notionPageId);

  return {
    success: true,
    action: 'created',
    entityId: newProject.id
  };
}

async function handleProjectUpdate(
  appId: string,
  payload: IncomingProjectPayload
): Promise<{ success: boolean; action: string; entityId?: string; error?: string }> {
  const existing = await getProject(appId);

  if (!existing) {
    return await handleProjectCreate(payload);
  }

  let pins: Pin[] = existing.pins;
  try {
    const parsedPins = JSON.parse(payload.pinsJson || '[]');
    if (parsedPins.length > 0) {
      pins = parsedPins.map((p: any, index: number) => ({
        id: crypto.randomUUID(),
        pinLabel: p.pinLabel || '',
        functionLabel: p.functionLabel || '',
        wireName: p.wireName || '',
        wireColor: p.wireColor || '',
        wireColorHex: p.wireColorHex || '#000000',
        ledFunctionColor: p.ledFunctionColor,
        ledFunctionHex: p.ledFunctionHex,
        cableToUse: p.cableToUse,
        notes: p.notes || '',
        sortOrder: p.sortOrder ?? index,
        x: p.x,
        y: p.y,
        textColor: p.textColor
      }));
    }
  } catch (e) {
    console.error('Error parsing pins JSON:', e);
  }

  const updatedProject: ProjectDiagram = {
    ...existing,
    notionPageId: payload.notionPageId,
    name: payload.name || existing.name,
    connectorLabel: payload.connectorLabel ?? existing.connectorLabel,
    connectorVariant: payload.connectorVariant ?? existing.connectorVariant,
    pins,
    projectName: payload.projectName ?? existing.projectName,
    location: payload.location ?? existing.location,
    updatedAt: Date.now()
  };

  await saveProject(updatedProject);
  setNotionIdMapping(appId, payload.notionPageId);

  return {
    success: true,
    action: 'updated',
    entityId: appId
  };
}

async function handleProjectDeletion(
  notionPageId: string
): Promise<{ success: boolean; action: string; entityId?: string; error?: string }> {
  const appId = getAppIdByNotionPageId(notionPageId);

  if (!appId) {
    return {
      success: true,
      action: 'ignored',
      error: 'No local project found for this Notion page'
    };
  }

  await deleteProject(appId);
  removeNotionIdMapping(appId);

  return {
    success: true,
    action: 'deleted',
    entityId: appId
  };
}

// Validate incoming webhook payload
export function validateNotionPayload(data: any): data is IncomingNotionPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.notionPageId === 'string' &&
    data.notionPageId.length > 0
  );
}
