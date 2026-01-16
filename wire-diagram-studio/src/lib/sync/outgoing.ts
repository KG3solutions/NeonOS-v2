// Outgoing sync: App → Zapier → Notion

import type { StandardDiagram, ProjectDiagram, ConnectorTemplate, PinoutConfig } from '../types';
import type { ZapierStandardPayload, ZapierProjectPayload, ZapierTemplatePayload } from './types';
import { getSyncConfig, getNotionPageId, setNotionIdMapping } from './config';

// ============================================================================
// TEMPLATE PINOUT SYNC (App → Notion)
// ============================================================================

// Send template pinout configuration to Notion
export async function syncTemplatePinoutToNotion(
  template: ConnectorTemplate
): Promise<{ success: boolean; error?: string }> {
  const config = getSyncConfig();

  if (!config.enabled || !config.zapierWebhookUrl) {
    return { success: false, error: 'Sync not configured' };
  }

  if (!template.notionPageId) {
    return { success: false, error: 'Template has no Notion page ID' };
  }

  const payload: ZapierTemplatePayload = {
    event: 'template_loaded', // Zapier will update the Notion page
    notionPageId: template.notionPageId,
    data: {
      name: template.name,
      femaleImageUrl: template.femaleImageUrl,
      femalePartNumber: template.femalePartNumber,
      maleImageUrl: template.maleImageUrl,
      malePartNumber: template.malePartNumber,
      pinoutJson: JSON.stringify(template.defaultPinout),
      category: template.category,
      manufacturer: template.manufacturer,
      pinCount: template.pinCount
    },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(config.zapierWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Sync template pinout to Notion failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// STANDARD DIAGRAM SYNC (App → Notion)
// ============================================================================

export async function syncStandardToNotion(
  standard: StandardDiagram,
  eventType: 'standard_created' | 'standard_updated'
): Promise<{ success: boolean; error?: string }> {
  const config = getSyncConfig();

  if (!config.enabled || !config.zapierWebhookUrl) {
    return { success: false, error: 'Sync not configured' };
  }

  const notionPageId = standard.notionPageId || getNotionPageId(standard.id);

  const payload: ZapierStandardPayload = {
    event: eventType,
    appId: standard.id,
    notionPageId: notionPageId,
    data: {
      name: standard.name,
      connectorLabel: standard.connectorLabel,
      templateId: standard.templateId,
      connectorVariant: standard.connectorVariant,
      imageUrl: standard.imageDataUrl,
      pins: standard.pins,
      pinSize: standard.pinSize,
      displayOptions: standard.displayOptions
    },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(config.zapierWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Try to get the Notion page ID from response (if Zapier returns it)
    try {
      const result = await response.json();
      if (result.notionPageId && !notionPageId) {
        setNotionIdMapping(standard.id, result.notionPageId);
      }
    } catch {
      // Response might not be JSON, that's okay
    }

    return { success: true };
  } catch (error) {
    console.error('Sync to Notion failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function syncStandardDeletionToNotion(
  standardId: string
): Promise<{ success: boolean; error?: string }> {
  const config = getSyncConfig();

  if (!config.enabled || !config.zapierWebhookUrl) {
    return { success: false, error: 'Sync not configured' };
  }

  const notionPageId = getNotionPageId(standardId);

  if (!notionPageId) {
    return { success: true };
  }

  const payload: ZapierStandardPayload = {
    event: 'standard_deleted',
    appId: standardId,
    notionPageId: notionPageId,
    data: {
      name: '',
      connectorLabel: '',
      connectorVariant: 'female',
      pins: [],
      pinSize: 15,
      displayOptions: {
        showPinNumber: true,
        showWireColor: false,
        showLedColor: false
      }
    },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(config.zapierWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Sync deletion to Notion failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function syncAllStandardsToNotion(
  standards: StandardDiagram[]
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const results = {
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const standard of standards) {
    const notionPageId = standard.notionPageId || getNotionPageId(standard.id);
    const eventType = notionPageId ? 'standard_updated' : 'standard_created';

    const result = await syncStandardToNotion(standard, eventType);

    if (result.success) {
      results.synced++;
    } else {
      results.failed++;
      results.errors.push(`${standard.name}: ${result.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

// ============================================================================
// PROJECT DIAGRAM SYNC (App → Notion)
// ============================================================================

export async function syncProjectToNotion(
  project: ProjectDiagram,
  eventType: 'project_created' | 'project_updated'
): Promise<{ success: boolean; error?: string }> {
  const config = getSyncConfig();

  if (!config.enabled || !config.zapierWebhookUrl) {
    return { success: false, error: 'Sync not configured' };
  }

  const notionPageId = project.notionPageId || getNotionPageId(project.id);

  const payload: ZapierProjectPayload = {
    event: eventType,
    appId: project.id,
    notionPageId: notionPageId,
    standardId: project.derivedFromStandardId,
    data: {
      name: project.name,
      connectorLabel: project.connectorLabel,
      projectName: project.projectName,
      location: project.location,
      connectorVariant: project.connectorVariant,
      pins: project.pins
    },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(config.zapierWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    try {
      const result = await response.json();
      if (result.notionPageId && !notionPageId) {
        setNotionIdMapping(project.id, result.notionPageId);
      }
    } catch {
      // Response might not be JSON
    }

    return { success: true };
  } catch (error) {
    console.error('Sync project to Notion failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function syncProjectDeletionToNotion(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const config = getSyncConfig();

  if (!config.enabled || !config.zapierWebhookUrl) {
    return { success: false, error: 'Sync not configured' };
  }

  const notionPageId = getNotionPageId(projectId);

  if (!notionPageId) {
    return { success: true };
  }

  const payload: ZapierProjectPayload = {
    event: 'project_deleted',
    appId: projectId,
    notionPageId: notionPageId,
    standardId: '',
    data: {
      name: '',
      connectorLabel: '',
      connectorVariant: 'female',
      pins: []
    },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(config.zapierWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Sync project deletion to Notion failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
