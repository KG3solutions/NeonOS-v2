<script lang="ts">
  import type { Diagram } from '../types';
  import { exportDiagramToPng } from '../utils/export';
  import { toasts } from '../stores/ui';
  import { createEventDispatcher } from 'svelte';

  export let diagram: Diagram;
  export let diagramElement: HTMLElement | null;
  export let isOpen = false;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  let includeLegend = true;
  let scale = 2;
  let isExporting = false;

  async function handleExport() {
    if (!diagramElement) {
      toasts.error('Unable to export: diagram not ready');
      return;
    }

    isExporting = true;

    try {
      await exportDiagramToPng(diagramElement, diagram, {
        includeLegend,
        scale,
        filename: `${diagram.name.replace(/[^a-z0-9]/gi, '-')}.png`
      });
      toasts.success('PNG exported successfully');
      dispatch('close');
    } catch (error) {
      console.error('Export error:', error);
      toasts.error('Failed to export PNG');
    } finally {
      isExporting = false;
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      dispatch('close');
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      dispatch('close');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="dialog-backdrop" on:click={handleBackdropClick} role="presentation">
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
      <div class="dialog-header">
        <h2 id="export-title">Export PNG</h2>
        <button class="close-btn" on:click={() => dispatch('close')}>✕</button>
      </div>

      <div class="dialog-body">
        <div class="option">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={includeLegend} />
            <span class="checkbox-text">Include wire color legend</span>
          </label>
          <p class="option-hint">Adds a color key below the diagram</p>
        </div>

        <div class="option">
          <label class="select-label" for="export-resolution">Export resolution</label>
          <select id="export-resolution" bind:value={scale}>
            <option value={1}>Standard (1x)</option>
            <option value={2}>High (2x) - Recommended</option>
            <option value={3}>Print Quality (3x)</option>
          </select>
          <p class="option-hint">Higher resolution = larger file size</p>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" on:click={() => dispatch('close')}>
          Cancel
        </button>
        <button
          class="btn btn-primary"
          on:click={handleExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export PNG'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 800;
  }

  @media (min-width: 768px) {
    .dialog-backdrop {
      align-items: center;
    }
  }

  .dialog {
    background: white;
    border-radius: 16px 16px 0 0;
    width: 100%;
    max-width: 400px;
    overflow: hidden;
  }

  @media (min-width: 768px) {
    .dialog {
      border-radius: 16px;
    }
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  .dialog-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 18px;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
  }

  .dialog-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .option {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: 20px;
    height: 20px;
    accent-color: #2563eb;
  }

  .checkbox-text {
    font-size: 14px;
    font-weight: 500;
    color: #111827;
  }

  .select-label {
    font-size: 14px;
    font-weight: 500;
    color: #111827;
  }

  .option select {
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    font-size: 14px;
    background: white;
  }

  .option select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .option-hint {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    padding: 20px;
    border-top: 1px solid #e5e7eb;
    justify-content: flex-end;
  }

  .btn {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: background-color 0.15s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .btn-primary {
    background: #2563eb;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #1d4ed8;
  }
</style>
