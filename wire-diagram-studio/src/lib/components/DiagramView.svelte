<script lang="ts">
  import type { Diagram } from '../types';
  import PinRow from './PinRow.svelte';

  export let diagram: Diagram;
  export let isReferenceMode = false;

  // Export reference for PNG export
  export let containerRef: HTMLElement | null = null;
</script>

<div class="diagram-view" class:reference-mode={isReferenceMode} bind:this={containerRef}>
  <div class="diagram-header">
    <h1 class="diagram-name">{diagram.name || 'Untitled Diagram'}</h1>
    {#if diagram.connectorLabel}
      <div class="connector-label">{diagram.connectorLabel}</div>
    {/if}
    {#if 'pinCount' in diagram && diagram.pinCount}
      <div class="pin-count">{diagram.pinCount} pins</div>
    {/if}
  </div>

  <!-- Show image if available (from Notion Thumbnail/Exported PNG) -->
  {#if diagram.imageDataUrl}
    <div class="diagram-image">
      <img src={diagram.imageDataUrl} alt={diagram.name} />
    </div>
  {/if}

  <!-- Show pins list if pins are defined with positions -->
  {#if diagram.pins.length > 0}
    <div class="pins-list">
      {#each diagram.pins.sort((a, b) => a.sortOrder - b.sortOrder) as pin (pin.id)}
        <PinRow {pin} {isReferenceMode} />
      {/each}
    </div>
  {:else if !diagram.imageDataUrl}
    <div class="empty-state">
      No diagram data yet - add pins or upload an image
    </div>
  {/if}
</div>

<style>
  .diagram-view {
    background: white;
    border-radius: 16px;
    overflow: hidden;
  }

  .diagram-view.reference-mode {
    font-size: 1.1em;
  }

  .diagram-header {
    padding: 20px;
    background: #1f2937;
    color: white;
  }

  .reference-mode .diagram-header {
    padding: 24px;
  }

  .diagram-name {
    margin: 0 0 4px 0;
    font-size: 20px;
    font-weight: 700;
  }

  .reference-mode .diagram-name {
    font-size: 26px;
  }

  .connector-label {
    font-size: 14px;
    opacity: 0.8;
  }

  .reference-mode .connector-label {
    font-size: 16px;
  }

  .pin-count {
    font-size: 12px;
    opacity: 0.7;
    margin-top: 4px;
  }

  .diagram-image {
    padding: 16px;
    background: #f9fafb;
    text-align: center;
  }

  .diagram-image img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .reference-mode .diagram-image {
    padding: 20px;
  }

  .pins-list {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .reference-mode .pins-list {
    padding: 20px;
    gap: 12px;
  }

  .empty-state {
    padding: 40px 20px;
    text-align: center;
    color: #9ca3af;
    font-size: 14px;
  }
</style>
