<script lang="ts">
  import { WIRE_COLOR_PRESETS, getContrastColor } from '../utils/colors';
  import { createEventDispatcher } from 'svelte';

  export let colorName: string = '';
  export let colorHex: string = '#000000';

  const dispatch = createEventDispatcher<{
    change: { name: string; hex: string };
  }>();

  let showPicker = false;
  let customColor = colorHex;

  function selectPreset(preset: { name: string; hex: string }) {
    colorName = preset.name;
    colorHex = preset.hex;
    showPicker = false;
    dispatch('change', { name: colorName, hex: colorHex });
  }

  function applyCustomColor() {
    colorHex = customColor;
    showPicker = false;
    dispatch('change', { name: colorName, hex: colorHex });
  }

  function handleInputChange() {
    dispatch('change', { name: colorName, hex: colorHex });
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      showPicker = false;
    }
  }
</script>

<div class="color-picker">
  <button
    type="button"
    class="color-preview"
    style="background-color: {colorHex}; color: {getContrastColor(colorHex)}"
    on:click={() => showPicker = !showPicker}
  >
    {colorName || 'Select Color'}
  </button>

  <input
    type="text"
    class="color-name-input"
    placeholder="Color name"
    bind:value={colorName}
    on:input={handleInputChange}
  />
</div>

{#if showPicker}
  <div class="picker-backdrop" on:click={handleBackdropClick} role="presentation">
    <div class="picker-panel">
      <div class="picker-header">
        <h3>Select Wire Color</h3>
        <button class="close-btn" on:click={() => showPicker = false}>✕</button>
      </div>

      <div class="preset-grid">
        {#each WIRE_COLOR_PRESETS as preset}
          <button
            type="button"
            class="preset-item"
            class:selected={colorName === preset.name}
            style="background-color: {preset.hex}; color: {getContrastColor(preset.hex)}"
            on:click={() => selectPreset(preset)}
          >
            {preset.name}
          </button>
        {/each}
      </div>

      <div class="custom-section">
        <label class="custom-label" for="custom-color-picker">Custom Color</label>
        <div class="custom-row">
          <input
            id="custom-color-picker"
            type="color"
            class="custom-input"
            bind:value={customColor}
          />
          <button type="button" class="apply-btn" on:click={applyCustomColor}>
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .color-picker {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }

  .color-preview {
    min-width: 100px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
    transition: transform 0.1s;
  }

  .color-preview:active {
    transform: scale(0.98);
  }

  .color-name-input {
    flex: 1;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    font-size: 14px;
  }

  .color-name-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .picker-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 800;
  }

  @media (min-width: 768px) {
    .picker-backdrop {
      align-items: center;
    }
  }

  .picker-panel {
    background: white;
    border-radius: 16px 16px 0 0;
    padding: 20px;
    width: 100%;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
  }

  @media (min-width: 768px) {
    .picker-panel {
      border-radius: 16px;
    }
  }

  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .picker-header h3 {
    margin: 0;
    font-size: 16px;
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

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  .preset-item {
    padding: 10px 8px;
    border-radius: 8px;
    border: 2px solid transparent;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.1s, border-color 0.1s;
  }

  .preset-item:active {
    transform: scale(0.95);
  }

  .preset-item.selected {
    border-color: #2563eb;
  }

  .custom-section {
    border-top: 1px solid #e5e7eb;
    padding-top: 16px;
  }

  .custom-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  .custom-row {
    display: flex;
    gap: 8px;
  }

  .custom-input {
    flex: 1;
    height: 44px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    cursor: pointer;
  }

  .apply-btn {
    padding: 0 20px;
    border-radius: 8px;
    background: #2563eb;
    color: white;
    border: none;
    font-weight: 500;
    cursor: pointer;
  }

  .apply-btn:hover {
    background: #1d4ed8;
  }
</style>
