<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { MissingStandard } from '../utils/standards';

  export let missing: MissingStandard;

  const dispatch = createEventDispatcher<{
    click: MissingStandard;
  }>();
</script>

<button
  class="card missing"
  onclick={() => dispatch('click', missing)}
>
  <div class="card-content">
    <div class="card-header">
      <div class="missing-icon">⚠️</div>
      <h3 class="card-title">{missing.templateName}</h3>
    </div>

    <div class="card-badges">
      <span class="badge connector">{missing.connectorType}</span>
      <span class="badge gender" class:male={missing.gender === 'male'}>
        {missing.gender === 'male' ? '♂ Male' : '♀ Female'}
      </span>
      <span class="badge signal">{missing.signalType}</span>
    </div>

    <div class="card-meta">
      <span class="status">Needs Standard</span>
      {#if missing.hasPartNumber}
        <span class="separator">•</span>
        <span class="has-part">Has Part #</span>
      {/if}
      {#if missing.imageUrl}
        <span class="separator">•</span>
        <span class="has-photo">Has Photo</span>
      {/if}
    </div>

    <div class="action-hint">
      Click to create standard
    </div>
  </div>
</button>

<style>
  .card {
    position: relative;
    display: block;
    width: 100%;
    background: white;
    border: 2px solid #fca5a5;
    border-radius: 12px;
    padding: 16px;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
    overflow: hidden;
  }

  .card:hover {
    border-color: #ef4444;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
  }

  .card:active {
    transform: scale(0.99);
  }

  .card-content {
    position: relative;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .missing-icon {
    font-size: 18px;
  }

  .card-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }

  .card-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
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
    margin-bottom: 8px;
  }

  .status {
    color: #dc2626;
    font-weight: 500;
  }

  .has-part {
    color: #059669;
  }

  .has-photo {
    color: #7c3aed;
  }

  .separator {
    opacity: 0.5;
  }

  .action-hint {
    font-size: 11px;
    color: #6b7280;
    font-style: italic;
  }
</style>
