<script lang="ts">
  import type { StandardDiagram, Pin } from '../types';
  import { createEmptyPin, createEmptyStandard } from '../types';
  import { standards } from '../stores/standards';
  import { toasts } from '../stores/ui';
  import PinEditor from '../components/PinEditor.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import type { MissingStandard } from '../utils/standards';

  export let standardId: string | null = null;
  export let prefill: MissingStandard | undefined = undefined;

  const dispatch = createEventDispatcher<{
    back: void;
    saved: string;
  }>();

  let diagram: StandardDiagram = createEmptyStandard();
  let isNew = true;
  let isSaving = false;

  // Generate a standard name from prefill data
  function generateStandardName(missing: MissingStandard): string {
    const genderLabel = missing.gender === 'male' ? 'Male' : 'Female';
    return `${missing.connectorType} ${genderLabel} - ${missing.signalType}`;
  }

  onMount(async () => {
    if (standardId) {
      const existing = await standards.get(standardId);
      if (existing) {
        diagram = existing;
        isNew = false;
      }
    } else if (prefill) {
      // Auto-fill from missing standard data
      diagram.name = generateStandardName(prefill);
      diagram.connectorLabel = prefill.connectorType;
      diagram.connectorVariant = prefill.gender;
      diagram.signalType = prefill.signalType;
      diagram.templateId = prefill.templateId;
    }
  });

  function addPin() {
    const newPin = createEmptyPin(diagram.pins.length);
    diagram.pins = [...diagram.pins, newPin];
  }

  function updatePin(e: CustomEvent<Pin>) {
    const updated = e.detail;
    diagram.pins = diagram.pins.map(p => p.id === updated.id ? updated : p);
  }

  function deletePin(e: CustomEvent<string>) {
    const id = e.detail;
    diagram.pins = diagram.pins.filter(p => p.id !== id);
    // Update sort orders
    diagram.pins = diagram.pins.map((p, i) => ({ ...p, sortOrder: i }));
  }

  function moveUp(e: CustomEvent<string>) {
    const id = e.detail;
    const index = diagram.pins.findIndex(p => p.id === id);
    if (index > 0) {
      const pins = [...diagram.pins];
      [pins[index - 1], pins[index]] = [pins[index], pins[index - 1]];
      pins[index - 1].sortOrder = index - 1;
      pins[index].sortOrder = index;
      diagram.pins = pins;
    }
  }

  function moveDown(e: CustomEvent<string>) {
    const id = e.detail;
    const index = diagram.pins.findIndex(p => p.id === id);
    if (index < diagram.pins.length - 1) {
      const pins = [...diagram.pins];
      [pins[index], pins[index + 1]] = [pins[index + 1], pins[index]];
      pins[index].sortOrder = index;
      pins[index + 1].sortOrder = index + 1;
      diagram.pins = pins;
    }
  }

  async function save() {
    if (!diagram.name.trim()) {
      toasts.error('Please enter a diagram name');
      return;
    }

    isSaving = true;
    try {
      await standards.save(diagram);
      toasts.success(isNew ? 'Standard created' : 'Standard saved');
      dispatch('saved', diagram.id);
    } catch (error) {
      toasts.error('Failed to save');
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="editor">
  <div class="top-bar">
    <button class="back-btn" on:click={() => dispatch('back')}>
      ← Cancel
    </button>
    <button class="save-btn" on:click={save} disabled={isSaving}>
      {isSaving ? 'Saving...' : 'Save'}
    </button>
  </div>

  <h1 class="page-title">{isNew ? 'New Standard' : 'Edit Standard'}</h1>

  {#if prefill}
    <!-- Show auto-filled info when creating from missing standard -->
    <div class="prefill-info">
      <div class="prefill-header">Creating standard for:</div>
      <div class="prefill-badges">
        <span class="badge connector">{prefill.connectorType}</span>
        <span class="badge gender" class:male={prefill.gender === 'male'}>
          {prefill.gender === 'male' ? '♂ Male' : '♀ Female'}
        </span>
        <span class="badge signal">{prefill.signalType}</span>
      </div>
      <div class="prefill-name">{diagram.name}</div>
    </div>
  {:else}
    <div class="form-section">
      <div class="field">
        <label for="diagram-name">Diagram Name *</label>
        <input
          id="diagram-name"
          type="text"
          placeholder="e.g., 24V DC Motor Controller"
          bind:value={diagram.name}
        />
      </div>

      <div class="field">
        <label for="connector-label">Connector Label</label>
        <input
          id="connector-label"
          type="text"
          placeholder="e.g., 7-Pin Molex"
          bind:value={diagram.connectorLabel}
        />
      </div>
    </div>
  {/if}

  <div class="pins-section">
    <div class="pins-header">
      <h2>Pins / Terminals</h2>
      <button class="add-pin-btn" on:click={addPin}>
        + Add Pin
      </button>
    </div>

    {#if diagram.pins.length === 0}
      <div class="empty-pins">
        <p>No pins added yet</p>
        <button class="add-first-btn" on:click={addPin}>
          Add First Pin
        </button>
      </div>
    {:else}
      <div class="pins-list">
        {#each diagram.pins as pin, index (pin.id)}
          <PinEditor
            {pin}
            {index}
            totalPins={diagram.pins.length}
            on:update={updatePin}
            on:delete={deletePin}
            on:moveUp={moveUp}
            on:moveDown={moveDown}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .editor {
    padding: 16px;
    padding-bottom: 80px;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .back-btn {
    padding: 8px 12px;
    background: none;
    border: none;
    font-size: 14px;
    color: #6b7280;
    cursor: pointer;
    font-weight: 500;
  }

  .save-btn {
    padding: 10px 24px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .save-btn:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .page-title {
    margin: 0 0 24px 0;
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }

  .prefill-info {
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
  }

  .prefill-header {
    font-size: 12px;
    font-weight: 500;
    color: #166534;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .prefill-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .prefill-info .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
  }

  .prefill-info .badge.connector {
    background: #f3f4f6;
    color: #374151;
  }

  .prefill-info .badge.gender {
    background: #fce7f3;
    color: #be185d;
  }

  .prefill-info .badge.gender.male {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .prefill-info .badge.signal {
    background: #fef3c7;
    color: #92400e;
  }

  .prefill-name {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
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

  .empty-pins {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
  }

  .empty-pins p {
    margin: 0 0 16px 0;
  }

  .add-first-btn {
    padding: 10px 20px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
  }

  .pins-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  @media (min-width: 768px) {
    .editor {
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }
  }
</style>
