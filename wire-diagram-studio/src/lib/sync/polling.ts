// Polling service to check for incoming Notion updates

import { getSyncConfig } from './config';
import { processNotionWebhook, validateNotionPayload } from './incoming';
import { syncStatus } from './index';

let pollingInterval: number | null = null;
const POLL_INTERVAL_MS = 10000; // 10 seconds

// Callback to notify app of changes
type OnUpdateCallback = () => void;
let onUpdateCallback: OnUpdateCallback | null = null;

export function setOnUpdateCallback(callback: OnUpdateCallback) {
  onUpdateCallback = callback;
}

// Start polling for updates
export function startPolling() {
  if (pollingInterval) return;

  const config = getSyncConfig();
  if (!config.enabled) return;

  pollingInterval = window.setInterval(async () => {
    await checkForUpdates();
  }, POLL_INTERVAL_MS);

  // Initial check
  checkForUpdates();
}

// Stop polling
export function stopPolling() {
  if (pollingInterval) {
    window.clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// Check webhook server for pending updates
async function checkForUpdates() {
  const config = getSyncConfig();
  if (!config.enabled) {
    stopPolling();
    return;
  }

  // Default to localhost:3001, but could be configured
  const webhookServerUrl = 'http://localhost:3001';

  try {
    const response = await fetch(`${webhookServerUrl}/api/webhook/pending`);

    if (!response.ok) {
      console.warn('Failed to check for updates:', response.status);
      return;
    }

    const data = await response.json();

    if (data.count === 0) return;

    syncStatus.startSync();

    const processedIds: string[] = [];
    let hasChanges = false;

    for (const update of data.updates) {
      if (validateNotionPayload(update.payload)) {
        const result = await processNotionWebhook(update.payload);

        if (result.success) {
          processedIds.push(update.id);
          if (result.action !== 'ignored') {
            hasChanges = true;
          }
          console.log(`Processed Notion update: ${result.action}`, result.entityId);
        } else {
          console.error('Failed to process Notion update:', result.error);
        }
      } else {
        // Invalid payload, still acknowledge to prevent retry loop
        processedIds.push(update.id);
        console.warn('Invalid Notion webhook payload:', update.payload);
      }
    }

    // Acknowledge processed updates
    if (processedIds.length > 0) {
      await fetch(`${webhookServerUrl}/api/webhook/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateIds: processedIds })
      });
    }

    syncStatus.endSync(true);

    // Notify app to refresh data
    if (hasChanges && onUpdateCallback) {
      onUpdateCallback();
    }
  } catch (error) {
    // Server might not be running - that's okay
    console.debug('Webhook server not available:', error);
  }
}

// Manual trigger to check for updates
export async function checkForUpdatesNow(): Promise<{ processed: number; errors: number }> {
  const config = getSyncConfig();
  if (!config.enabled) {
    return { processed: 0, errors: 0 };
  }

  const webhookServerUrl = 'http://localhost:3001';

  try {
    const response = await fetch(`${webhookServerUrl}/api/webhook/pending`);

    if (!response.ok) {
      return { processed: 0, errors: 1 };
    }

    const data = await response.json();

    if (data.count === 0) {
      return { processed: 0, errors: 0 };
    }

    let processed = 0;
    let errors = 0;
    const processedIds: string[] = [];

    for (const update of data.updates) {
      if (validateNotionPayload(update.payload)) {
        const result = await processNotionWebhook(update.payload);
        if (result.success && result.action !== 'ignored') {
          processed++;
        } else if (!result.success) {
          errors++;
        }
        processedIds.push(update.id);
      } else {
        processedIds.push(update.id);
        errors++;
      }
    }

    // Acknowledge
    if (processedIds.length > 0) {
      await fetch(`${webhookServerUrl}/api/webhook/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateIds: processedIds })
      });
    }

    return { processed, errors };
  } catch {
    return { processed: 0, errors: 1 };
  }
}
