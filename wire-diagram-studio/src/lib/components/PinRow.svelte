<script lang="ts">
  import type { Pin } from '../types';
  import { getContrastColor } from '../utils/colors';

  export let pin: Pin;
  export let isReferenceMode = false;
</script>

<div class="pin-row" class:reference-mode={isReferenceMode}>
  <div class="pin-label">{pin.pinLabel}</div>

  <div class="pin-info">
    {#if pin.functionLabel}
      <div class="function-label">{pin.functionLabel}</div>
    {/if}
    {#if pin.wireName}
      <div class="wire-name">{pin.wireName}</div>
    {/if}
  </div>

  <div class="color-info">
    <div
      class="color-swatch"
      style="background-color: {pin.wireColorHex}; color: {getContrastColor(pin.wireColorHex)}"
    >
      {#if isReferenceMode}
        {pin.wireColor}
      {/if}
    </div>
    {#if !isReferenceMode}
      <div class="color-name">{pin.wireColor}</div>
    {/if}
  </div>

  {#if pin.notes && !isReferenceMode}
    <div class="notes">{pin.notes}</div>
  {/if}
</div>

{#if pin.notes && isReferenceMode}
  <div class="notes-ref">{pin.notes}</div>
{/if}

<style>
  .pin-row {
    display: grid;
    grid-template-columns: 48px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .pin-row.reference-mode {
    grid-template-columns: 60px 1fr auto;
    padding: 16px;
    background: white;
    border: 2px solid #e5e7eb;
  }

  .pin-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #1f2937;
    color: white;
    border-radius: 8px;
    font-weight: 700;
    font-size: 16px;
  }

  .reference-mode .pin-label {
    width: 52px;
    height: 52px;
    font-size: 22px;
  }

  .pin-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .function-label {
    font-weight: 600;
    font-size: 14px;
    color: #111827;
  }

  .reference-mode .function-label {
    font-size: 18px;
  }

  .wire-name {
    font-size: 13px;
    color: #6b7280;
  }

  .reference-mode .wire-name {
    font-size: 15px;
  }

  .color-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .color-swatch {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 600;
    text-align: center;
    padding: 2px;
    line-height: 1.1;
  }

  .reference-mode .color-swatch {
    width: auto;
    min-width: 80px;
    height: auto;
    padding: 10px 14px;
    font-size: 14px;
    font-weight: 600;
  }

  .color-name {
    font-size: 11px;
    color: #6b7280;
    text-align: right;
    max-width: 80px;
  }

  .notes {
    grid-column: 1 / -1;
    font-size: 12px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 8px 10px;
    border-radius: 6px;
    margin-top: 4px;
  }

  .notes-ref {
    font-size: 14px;
    color: #4b5563;
    background: #fef3c7;
    padding: 10px 12px;
    border-radius: 8px;
    margin-top: 4px;
    border-left: 4px solid #f59e0b;
  }
</style>
