<script lang="ts">
  import type { ProjectDiagram, Pin } from '../types';
  import { createEmptyPin } from '../types';
  import { projects } from '../stores/projects';
  import { standardsById } from '../stores/standards';
  import { confirmDialog, toasts } from '../stores/ui';
  import PinEditor from '../components/PinEditor.svelte';
  import DiagramView from '../components/DiagramView.svelte';
  import ExportDialog from '../components/ExportDialog.svelte';
  import { createEventDispatcher, onMount } from 'svelte';

  export let projectId: string;

  const dispatch = createEventDispatcher<{
    back: void;
  }>();

  let project: ProjectDiagram | null = null;
  let isEditing = false;
  let isSaving = false;
  let isReferenceMode = false;
  let diagramRef: HTMLElement | null = null;
  let showExportDialog = false;

  onMount(async () => {
    project = await projects.get(projectId) || null;
  });

  $: standardName = project ? $standardsById.get(project.derivedFromStandardId)?.name : undefined;

  function addPin() {
    if (!project) return;
    const newPin = createEmptyPin(project.pins.length);
    project.pins = [...project.pins, newPin];
  }

  function updatePin(e: CustomEvent<Pin>) {
    if (!project) return;
    const updated = e.detail;
    project.pins = project.pins.map(p => p.id === updated.id ? updated : p);
  }

  function deletePin(e: CustomEvent<string>) {
    if (!project) return;
    const id = e.detail;
    project.pins = project.pins.filter(p => p.id !== id);
    project.pins = project.pins.map((p, i) => ({ ...p, sortOrder: i }));
  }

  function moveUp(e: CustomEvent<string>) {
    if (!project) return;
    const id = e.detail;
    const index = project.pins.findIndex(p => p.id === id);
    if (index > 0) {
      const pins = [...project.pins];
      [pins[index - 1], pins[index]] = [pins[index], pins[index - 1]];
      pins[index - 1].sortOrder = index - 1;
      pins[index].sortOrder = index;
      project.pins = pins;
    }
  }

  function moveDown(e: CustomEvent<string>) {
    if (!project) return;
    const id = e.detail;
    const index = project.pins.findIndex(p => p.id === id);
    if (index < project.pins.length - 1) {
      const pins = [...project.pins];
      [pins[index], pins[index + 1]] = [pins[index + 1], pins[index]];
      pins[index].sortOrder = index;
      pins[index + 1].sortOrder = index + 1;
      project.pins = pins;
    }
  }

  async function save() {
    if (!project) return;

    if (!project.name.trim()) {
      toasts.error('Please enter a project name');
      return;
    }

    isSaving = true;
    try {
      await projects.save(project);
      toasts.success('Project saved');
      isEditing = false;
    } catch (error) {
      toasts.error('Failed to save');
    } finally {
      isSaving = false;
    }
  }

  function handleDelete() {
    if (!project) return;
    confirmDialog.show(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? This cannot be undone.`,
      async () => {
        await projects.delete(project!.id);
        toasts.success('Project deleted');
        dispatch('back');
      }
    );
  }
</script>

{#if !project}
  <div class="loading">Loading...</div>
{:else}
  <div class="project-editor" class:reference-mode={isReferenceMode}>
    {#if !isReferenceMode}
      <div class="top-bar">
        <button class="back-btn" on:click={() => dispatch('back')}>
          ← Back
        </button>
        <div class="top-actions">
          <button class="icon-btn" on:click={() => isReferenceMode = true} title="Reference Mode">
            📖
          </button>
          {#if !isEditing}
            <button class="icon-btn" on:click={() => isEditing = true} title="Edit">
              ✏️
            </button>
          {:else}
            <button class="save-btn" on:click={save} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          {/if}
        </div>
      </div>

      {#if standardName}
        <div class="derived-badge">
          Based on: {standardName}
        </div>
      {/if}
    {/if}

    {#if isReferenceMode}
      <button class="exit-ref-btn" on:click={() => isReferenceMode = false}>
        ✕ Exit Reference Mode
      </button>
    {/if}

    {#if isEditing && !isReferenceMode}
      <div class="edit-form">
        <div class="field">
          <label for="project-name">Project Name *</label>
          <input
            id="project-name"
            type="text"
            placeholder="e.g., Hilton Stairs SL Rev B"
            bind:value={project.name}
          />
        </div>

        <div class="field">
          <label for="connector-label">Connector Label</label>
          <input
            id="connector-label"
            type="text"
            placeholder="e.g., Panel Side"
            bind:value={project.connectorLabel}
          />
        </div>

        <div class="pins-section">
          <div class="pins-header">
            <h2>Pins / Terminals</h2>
            <button class="add-pin-btn" on:click={addPin}>
              + Add Pin
            </button>
          </div>

          <div class="pins-list">
            {#each project.pins as pin, index (pin.id)}
              <PinEditor
                {pin}
                {index}
                totalPins={project.pins.length}
                on:update={updatePin}
                on:delete={deletePin}
                on:moveUp={moveUp}
                on:moveDown={moveDown}
              />
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <div class="diagram-container">
        <DiagramView
          diagram={project}
          {isReferenceMode}
          bind:containerRef={diagramRef}
        />
      </div>

      {#if !isReferenceMode}
        <div class="actions">
          <button class="action-btn primary" on:click={() => showExportDialog = true}>
            Export PNG
          </button>
          <button class="action-btn danger" on:click={handleDelete}>
            Delete Project
          </button>
        </div>
      {/if}
    {/if}
  </div>

  <ExportDialog
    diagram={project}
    diagramElement={diagramRef}
    isOpen={showExportDialog}
    on:close={() => showExportDialog = false}
  />
{/if}

<style>
  .loading {
    padding: 40px;
    text-align: center;
    color: #6b7280;
  }

  .project-editor {
    padding: 16px;
    padding-bottom: 80px;
  }

  .project-editor.reference-mode {
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

  .save-btn {
    padding: 10px 20px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
  }

  .save-btn:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .derived-badge {
    font-size: 13px;
    color: #2563eb;
    background: #eff6ff;
    padding: 8px 12px;
    border-radius: 8px;
    margin-bottom: 16px;
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

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .field input {
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    font-size: 16px;
  }

  .field input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .pins-section {
    background: white;
    border-radius: 16px;
    padding: 20px;
    border: 1px solid #e5e7eb;
    margin-top: 8px;
  }

  .pins-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .pins-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .add-pin-btn {
    padding: 8px 16px;
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
  }

  .add-pin-btn:hover {
    background: #e5e7eb;
  }

  .pins-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .diagram-container {
    margin-bottom: 24px;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .action-btn {
    width: 100%;
    padding: 14px 20px;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .action-btn.primary {
    background: #2563eb;
    color: white;
  }

  .action-btn.primary:hover {
    background: #1d4ed8;
  }

  .action-btn.danger {
    background: #fee2e2;
    color: #dc2626;
  }

  .action-btn.danger:hover {
    background: #fecaca;
  }

  @media (min-width: 768px) {
    .project-editor {
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }

    .project-editor.reference-mode {
      max-width: none;
      padding: 24px;
    }

    .actions {
      flex-direction: row;
    }

    .action-btn {
      flex: 1;
    }
  }
</style>
