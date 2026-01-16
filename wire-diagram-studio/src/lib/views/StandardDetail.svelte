<script lang="ts">
  import type { StandardDiagram } from '../types';
  import { forkStandardToProject } from '../types';
  import { standards } from '../stores/standards';
  import { projects } from '../stores/projects';
  import { confirmDialog, toasts } from '../stores/ui';
  import DiagramView from '../components/DiagramView.svelte';
  import ExportDialog from '../components/ExportDialog.svelte';
  import { createEventDispatcher } from 'svelte';

  export let standard: StandardDiagram;

  const dispatch = createEventDispatcher<{
    back: void;
    edit: string;
    forkCreated: string;
  }>();

  let diagramRef: HTMLElement | null = null;
  let showExportDialog = false;
  let isReferenceMode = false;

  async function handleFork() {
    const project = forkStandardToProject(standard, '');
    await projects.save(project);
    toasts.success('Project created! Customize it now.');
    dispatch('forkCreated', project.id);
  }

  function handleDelete() {
    confirmDialog.show(
      'Delete Standard',
      `Are you sure you want to delete "${standard.name}"? This cannot be undone.`,
      async () => {
        await standards.delete(standard.id);
        toasts.success('Standard deleted');
        dispatch('back');
      }
    );
  }

  function handleDuplicate() {
    const duplicate: StandardDiagram = {
      ...standard,
      id: crypto.randomUUID(),
      name: `${standard.name} (Copy)`,
      pins: standard.pins.map(p => ({ ...p, id: crypto.randomUUID() })),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    standards.save(duplicate);
    toasts.success('Standard duplicated');
  }
</script>

<div class="standard-detail" class:reference-mode={isReferenceMode}>
  {#if !isReferenceMode}
    <div class="top-bar">
      <button class="back-btn" on:click={() => dispatch('back')}>
        ← Back
      </button>
      <div class="top-actions">
        <button class="icon-btn" on:click={() => isReferenceMode = true} title="Reference Mode">
          📖
        </button>
        <button class="icon-btn" on:click={() => dispatch('edit', standard.id)} title="Edit">
          ✏️
        </button>
      </div>
    </div>
  {/if}

  {#if isReferenceMode}
    <button class="exit-ref-btn" on:click={() => isReferenceMode = false}>
      ✕ Exit Reference Mode
    </button>
  {/if}

  <div class="diagram-container">
    <DiagramView
      diagram={standard}
      {isReferenceMode}
      bind:containerRef={diagramRef}
    />
  </div>

  {#if !isReferenceMode}
    <div class="primary-action">
      <button class="fork-btn" on:click={handleFork}>
        Update for Your Project
      </button>
      <p class="fork-hint">Creates a customizable copy</p>
    </div>

    <div class="secondary-actions">
      <button class="action-btn" on:click={() => showExportDialog = true}>
        Export PNG
      </button>
      <button class="action-btn" on:click={handleDuplicate}>
        Duplicate
      </button>
      <button class="action-btn danger" on:click={handleDelete}>
        Delete
      </button>
    </div>
  {/if}
</div>

<ExportDialog
  diagram={standard}
  diagramElement={diagramRef}
  isOpen={showExportDialog}
  on:close={() => showExportDialog = false}
/>

<style>
  .standard-detail {
    padding: 16px;
    padding-bottom: 80px;
  }

  .standard-detail.reference-mode {
    padding: 8px;
    padding-bottom: 8px;
    background: #1f2937;
    min-height: 100vh;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .back-btn {
    padding: 8px 12px;
    background: none;
    border: none;
    font-size: 14px;
    color: #2563eb;
    cursor: pointer;
    font-weight: 500;
  }

  .top-actions {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #f3f4f6;
    border: none;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-btn:hover {
    background: #e5e7eb;
  }

  .exit-ref-btn {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100;
    padding: 12px 20px;
    background: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .diagram-container {
    margin-bottom: 24px;
  }

  .primary-action {
    margin-bottom: 24px;
    text-align: center;
  }

  .fork-btn {
    width: 100%;
    padding: 16px 24px;
    background: #059669;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .fork-btn:hover {
    background: #047857;
  }

  .fork-btn:active {
    transform: scale(0.99);
  }

  .fork-hint {
    margin: 8px 0 0 0;
    font-size: 13px;
    color: #6b7280;
  }

  .secondary-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .action-btn {
    flex: 1;
    min-width: 100px;
    padding: 12px 16px;
    background: #f3f4f6;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .action-btn:hover {
    background: #e5e7eb;
  }

  .action-btn.danger {
    color: #dc2626;
  }

  .action-btn.danger:hover {
    background: #fee2e2;
  }

  @media (min-width: 768px) {
    .standard-detail {
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }

    .standard-detail.reference-mode {
      max-width: none;
      padding: 24px;
    }
  }
</style>
