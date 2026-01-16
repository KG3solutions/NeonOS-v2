<script lang="ts">
  import { exportAllData, importData, clearAllData } from '../db';
  import { exportDataAsJson, readJsonFile } from '../utils/export';
  import { standards } from '../stores/standards';
  import { projects } from '../stores/projects';
  import { confirmDialog, toasts } from '../stores/ui';
  import SyncSettings from '../components/SyncSettings.svelte';

  let fileInput: HTMLInputElement;
  let isExporting = false;
  let isImporting = false;

  async function handleExport() {
    isExporting = true;
    try {
      const data = await exportAllData();
      const filename = `wire-diagrams-backup-${new Date().toISOString().split('T')[0]}.json`;
      exportDataAsJson(data, filename);
      toasts.success('Data exported successfully');
    } catch (error) {
      toasts.error('Failed to export data');
    } finally {
      isExporting = false;
    }
  }

  async function handleImport() {
    fileInput.click();
  }

  async function processImport(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    isImporting = true;
    try {
      const data = await readJsonFile(file) as any;

      if (!data.standards || !data.projects) {
        throw new Error('Invalid backup file format');
      }

      const result = await importData(data);
      await standards.load();
      await projects.load();

      toasts.success(`Imported ${result.standards} standards and ${result.projects} projects`);
    } catch (error) {
      toasts.error('Failed to import: Invalid file format');
    } finally {
      isImporting = false;
      target.value = '';
    }
  }

  function handleClearData() {
    confirmDialog.show(
      'Clear All Data',
      'This will permanently delete all standards and projects. This cannot be undone!',
      async () => {
        await clearAllData();
        await standards.load();
        await projects.load();
        toasts.success('All data cleared');
      },
      'Clear Everything'
    );
  }
</script>

<div class="settings">
  <h1>Settings</h1>

  <SyncSettings />

  <div class="section">
    <h2>Data Backup</h2>
    <p class="section-desc">Export your diagrams to a file or restore from a backup</p>

    <div class="button-group">
      <button class="btn btn-primary" on:click={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export All Data'}
      </button>

      <button class="btn btn-secondary" on:click={handleImport} disabled={isImporting}>
        {isImporting ? 'Importing...' : 'Import from File'}
      </button>
    </div>

    <input
      type="file"
      accept=".json"
      bind:this={fileInput}
      on:change={processImport}
      style="display: none"
    />
  </div>

  <div class="section danger-zone">
    <h2>Danger Zone</h2>
    <p class="section-desc">Permanently delete all your data</p>

    <button class="btn btn-danger" on:click={handleClearData}>
      Clear All Data
    </button>
  </div>

  <div class="section about">
    <h2>About</h2>
    <p class="about-text">
      <strong>Wire Diagram Studio</strong><br />
      Version 1.1.0<br /><br />
      A mobile-first tool for creating and managing wire diagrams.
      All data is stored locally on your device. Optionally sync with Notion via Zapier.
    </p>
  </div>
</div>

<style>
  .settings {
    padding: 16px;
    padding-bottom: 80px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }

  .section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e5e7eb;
  }

  .section h2 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .section-desc {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: #6b7280;
  }

  .button-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn {
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #b91c1c;
  }

  .danger-zone {
    border-color: #fecaca;
    background: #fef2f2;
  }

  .danger-zone h2 {
    color: #dc2626;
  }

  .about-text {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
    line-height: 1.6;
  }

  @media (min-width: 768px) {
    .settings {
      padding: 24px;
      max-width: 500px;
      margin: 0 auto;
    }

    .button-group {
      flex-direction: row;
    }

    .btn {
      flex: 1;
    }
  }
</style>
