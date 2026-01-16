<script lang="ts">
  import type { Diagram, StandardDiagram } from '../types';
  import { isProjectDiagram, isStandardDiagram } from '../types';
  import { createEventDispatcher } from 'svelte';

  export let diagram: Diagram;
  export let standardName: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    click: void;
  }>();

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  $: isProject = isProjectDiagram(diagram);
  $: isStandard = isStandardDiagram(diagram);
  // Use pinCount from Notion if available, otherwise fall back to pins array length
  $: pinCount = ('pinCount' in diagram && diagram.pinCount) ? diagram.pinCount : diagram.pins.length;
  $: backgroundImage = diagram.imageDataUrl;
  $: signalType = isStandard ? (diagram as StandardDiagram).signalType : undefined;
</script>

<button
  class="card"
  onclick={() => dispatch('click')}
  style={backgroundImage ? `--bg-image: url(${backgroundImage})` : ''}
>
  {#if backgroundImage}
    <div class="card-bg"></div>
  {/if}

  <div class="card-content">
    <div class="card-header">
      <h3 class="card-title">{diagram.name || 'Untitled'}</h3>
      <div class="card-badges">
        {#if diagram.connectorLabel}
          <span class="badge connector">{diagram.connectorLabel}</span>
        {/if}
        <span class="badge gender" class:male={diagram.connectorVariant === 'male'}>
          {diagram.connectorVariant === 'male' ? '♂ Male' : '♀ Female'}
        </span>
        {#if signalType}
          <span class="badge signal">{signalType}</span>
        {/if}
      </div>
    </div>

    <div class="card-meta">
      <span class="pin-count">{pinCount} pin{pinCount !== 1 ? 's' : ''}</span>
      <span class="separator">•</span>
      <span class="date">{formatDate(diagram.updatedAt)}</span>
    </div>

    {#if isProject && standardName}
      <div class="derived-from">
        From: {standardName}
      </div>
    {/if}

    <div class="card-preview">
      {#each diagram.pins.slice(0, 7) as pin}
        <div
          class="preview-swatch"
          style="background-color: {pin.wireColorHex}"
          title="{pin.pinLabel}: {pin.wireColor}"
        ></div>
      {/each}
    </div>
  </div>
</button>

<style>
  .card {
    position: relative;
    display: block;
    width: 100%;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
    overflow: hidden;
  }

  .card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .card:active {
    transform: scale(0.99);
  }

  .card-bg {
    position: absolute;
    inset: 0;
    background-image: var(--bg-image);
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.12;
    z-index: 0;
    pointer-events: none;
  }

  .card-content {
    position: relative;
    z-index: 1;
  }

  .card-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
  }

  .card-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .card-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }

  .badge.connector {
    background: #f3f4f6;
    color: #374151;
  }

  .badge.gender {
    background: #fce7f3;
    color: #be185d;
  }

  .badge.gender.male {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .badge.signal {
    background: #fef3c7;
    color: #92400e;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 12px;
  }

  .separator {
    opacity: 0.5;
  }

  .derived-from {
    font-size: 11px;
    color: #2563eb;
    background: #eff6ff;
    padding: 4px 8px;
    border-radius: 4px;
    margin-bottom: 12px;
    display: inline-block;
  }

  .card-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .preview-swatch {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }
</style>
