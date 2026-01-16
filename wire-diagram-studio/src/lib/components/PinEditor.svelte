<script lang="ts">
  import type { Pin } from '../types';
  import ColorPicker from './ColorPicker.svelte';
  import { createEventDispatcher } from 'svelte';

  export let pin: Pin;
  export let index: number;
  export let totalPins: number;

  const dispatch = createEventDispatcher<{
    update: Pin;
    delete: string;
    moveUp: string;
    moveDown: string;
  }>();

  function handleColorChange(e: CustomEvent<{ name: string; hex: string }>) {
    pin.wireColor = e.detail.name;
    pin.wireColorHex = e.detail.hex;
    dispatch('update', pin);
  }

  function handleFieldChange() {
    dispatch('update', pin);
  }
</script>

<div class="pin-editor">
  <div class="pin-header">
    <span class="pin-number">Pin {index + 1}</span>
    <div class="pin-actions">
      <button
        type="button"
        class="action-btn"
        disabled={index === 0}
        on:click={() => dispatch('moveUp', pin.id)}
        aria-label="Move up"
      >
        ↑
      </button>
      <button
        type="button"
        class="action-btn"
        disabled={index === totalPins - 1}
        on:click={() => dispatch('moveDown', pin.id)}
        aria-label="Move down"
      >
        ↓
      </button>
      <button
        type="button"
        class="action-btn delete"
        on:click={() => dispatch('delete', pin.id)}
        aria-label="Delete pin"
      >
        ✕
      </button>
    </div>
  </div>

  <div class="pin-fields">
    <div class="field-row">
      <div class="field">
        <label for="pin-label-{pin.id}">Pin Label</label>
        <input
          id="pin-label-{pin.id}"
          type="text"
          placeholder="1, A, etc."
          bind:value={pin.pinLabel}
          on:input={handleFieldChange}
        />
      </div>
      <div class="field">
        <label for="function-{pin.id}">Function</label>
        <input
          id="function-{pin.id}"
          type="text"
          placeholder="GND, +24V, etc."
          bind:value={pin.functionLabel}
          on:input={handleFieldChange}
        />
      </div>
    </div>

    <div class="field">
      <label for="wire-name-{pin.id}">Wire Name</label>
      <input
        id="wire-name-{pin.id}"
        type="text"
        placeholder="Power +, Data In, etc."
        bind:value={pin.wireName}
        on:input={handleFieldChange}
      />
    </div>

    <div class="field">
      <span class="field-label">Wire Color</span>
      <ColorPicker
        colorName={pin.wireColor}
        colorHex={pin.wireColorHex}
        on:change={handleColorChange}
      />
    </div>

    <div class="field">
      <label for="notes-{pin.id}">Notes</label>
      <input
        id="notes-{pin.id}"
        type="text"
        placeholder="Optional notes..."
        bind:value={pin.notes}
        on:input={handleFieldChange}
      />
    </div>
  </div>
</div>

<style>
  .pin-editor {
    background: #f9fafb;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e5e7eb;
  }

  .pin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .pin-number {
    font-weight: 600;
    font-size: 14px;
    color: #374151;
  }

  .pin-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    background: white;
    cursor: pointer;
    font-size: 14px;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .action-btn:hover:not(:disabled) {
    background: #f3f4f6;
    color: #374151;
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .action-btn.delete:hover:not(:disabled) {
    background: #fee2e2;
    color: #dc2626;
    border-color: #fecaca;
  }

  .pin-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field label,
  .field .field-label {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
  }

  .field input {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    font-size: 14px;
  }

  .field input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
</style>
