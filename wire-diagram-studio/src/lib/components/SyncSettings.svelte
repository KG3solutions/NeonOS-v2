<script lang="ts">
  import { onMount } from 'svelte';
  import { toasts } from '../stores/ui';
  import { templates } from '../stores/templates';
  import { testNotionConnection } from '../sync/notion-direct';
  import { NOTION_DATABASE_IDS } from '../sync/types';

  let isLoading = false;
  let isTesting = false;
  let lastSyncAt: number | null = null;
  let connectionStatus: 'unknown' | 'connected' | 'error' = 'unknown';
  let templateCount = 0;

  // Subscribe to templates store
  $: templateCount = $templates.length;

  onMount(() => {
    lastSyncAt = parseInt(localStorage.getItem('notion-last-sync') || '0') || null;
  });

  async function handleTestConnection() {
    isTesting = true;
    connectionStatus = 'unknown';

    try {
      const result = await testNotionConnection();
      if (result.success) {
        connectionStatus = 'connected';
        toasts.success(`Connected! Found ${result.templateCount} templates in Notion`);
      } else {
        connectionStatus = 'error';
        toasts.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      connectionStatus = 'error';
      toasts.error('Connection test failed');
    } finally {
      isTesting = false;
    }
  }

  async function handleSyncNow() {
    isLoading = true;

    try {
      const count = await templates.syncFromNotion();
      lastSyncAt = Date.now();
      localStorage.setItem('notion-last-sync', lastSyncAt.toString());
      connectionStatus = 'connected';

      const unconfigured = $templates.filter(t => !t.defaultPinout?.pins?.length).length;
      const configured = $templates.length - unconfigured;

      toasts.success(`Synced ${count} templates (${configured} configured, ${unconfigured} need pinout)`);
    } catch (error) {
      connectionStatus = 'error';
      console.error('Failed to sync templates:', error);
      toasts.error(error instanceof Error ? error.message : 'Failed to sync from Notion');
    } finally {
      isLoading = false;
    }
  }

  function formatDate(timestamp: number | null): string {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  }
</script>

<div class="sync-settings">
  <div class="section-header">
    <h3>Notion Sync</h3>
    <span class="status-badge" class:connected={connectionStatus === 'connected'} class:error={connectionStatus === 'error'}>
      {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Error' : 'Ready'}
    </span>
  </div>

  <p class="section-desc">
    Auto-syncs connector templates from Notion on startup
  </p>

  <div class="config-section">
    <div class="stats-row">
      <div class="stat">
        <span class="stat-value">{templateCount}</span>
        <span class="stat-label">Templates Loaded</span>
      </div>
      <div class="stat">
        <span class="stat-value">{$templates.filter(t => t.defaultPinout?.pins?.length).length}</span>
        <span class="stat-label">Configured</span>
      </div>
      <div class="stat">
        <span class="stat-value">{$templates.filter(t => !t.defaultPinout?.pins?.length).length}</span>
        <span class="stat-label">Need Pinout</span>
      </div>
    </div>

    <div class="button-row">
      <button
        class="action-btn primary"
        onclick={handleSyncNow}
        disabled={isLoading}
      >
        {isLoading ? 'Syncing...' : 'Sync Now'}
      </button>

      <button
        class="action-btn secondary"
        onclick={handleTestConnection}
        disabled={isTesting}
      >
        {isTesting ? 'Testing...' : 'Test Connection'}
      </button>
    </div>

    <div class="sync-status">
      <span class="status-label">Last sync:</span>
      <span class="status-value">{formatDate(lastSyncAt)}</span>
    </div>
  </div>

  <div class="database-info">
    <h4>Connected Database</h4>
    <p class="db-name">Connector Templates Diagram Creator</p>
    <code class="db-id">{NOTION_DATABASE_IDS.CONNECTOR_TEMPLATES}</code>
  </div>
</div>

<style>
  .sync-settings {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e5e7eb;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .section-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    background: #f3f4f6;
    color: #6b7280;
  }

  .status-badge.connected {
    background: #d1fae5;
    color: #059669;
  }

  .status-badge.error {
    background: #fee2e2;
    color: #dc2626;
  }

  .section-desc {
    margin: 0 0 16px 0;
    font-size: 13px;
    color: #6b7280;
  }

  .config-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
  }

  .stats-row {
    display: flex;
    gap: 16px;
  }

  .stat {
    flex: 1;
    text-align: center;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .stat-value {
    display: block;
    font-size: 24px;
    font-weight: 600;
    color: #111827;
  }

  .stat-label {
    display: block;
    font-size: 11px;
    color: #6b7280;
    margin-top: 4px;
  }

  .button-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    padding: 12px 20px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-btn.primary {
    background: #2563eb;
    color: white;
  }

  .action-btn.primary:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .action-btn.secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .action-btn.secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .sync-status {
    display: flex;
    gap: 8px;
    font-size: 12px;
  }

  .status-label {
    color: #6b7280;
  }

  .status-value {
    color: #374151;
  }

  .database-info {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  .database-info h4 {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
  }

  .db-name {
    margin: 0 0 4px 0;
    font-size: 13px;
    color: #111827;
  }

  .db-id {
    font-size: 10px;
    color: #9ca3af;
    background: #f9fafb;
    padding: 2px 6px;
    border-radius: 4px;
  }

  @media (min-width: 768px) {
    .button-row {
      flex-direction: row;
    }

    .action-btn {
      flex: 1;
    }
  }
</style>
