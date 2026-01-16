<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { StandardDiagram } from '../types';
  import { groupStandardsByConnector } from '../utils/standards';
  import DiagramCard from './DiagramCard.svelte';

  export let standards: StandardDiagram[];

  const dispatch = createEventDispatcher<{
    select: string;
  }>();

  // Track expanded groups
  let expandedGroups = new Set<string>();

  // Group standards by connector type
  $: groups = groupStandardsByConnector(standards);
  $: groupEntries = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // Start with all groups expanded
  $: {
    if (expandedGroups.size === 0 && groupEntries.length > 0) {
      expandedGroups = new Set(groupEntries.map(([key]) => key));
    }
  }

  function toggleGroup(key: string) {
    if (expandedGroups.has(key)) {
      expandedGroups.delete(key);
    } else {
      expandedGroups.add(key);
    }
    expandedGroups = expandedGroups; // Trigger reactivity
  }
</script>

<div class="grouped-view">
  {#each groupEntries as [groupName, items] (groupName)}
    <div class="group" class:collapsed={!expandedGroups.has(groupName)}>
      <button class="group-header" onclick={() => toggleGroup(groupName)}>
        <span class="expand-icon">{expandedGroups.has(groupName) ? '▼' : '▶'}</span>
        <span class="group-name">{groupName}</span>
        <span class="group-count">{items.length}</span>
      </button>

      {#if expandedGroups.has(groupName)}
        <div class="group-content">
          {#each items as standard (standard.id)}
            <DiagramCard
              diagram={standard}
              on:click={() => dispatch('select', standard.id)}
            />
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .grouped-view {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .group {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 16px;
    background: #f9fafb;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s;
  }

  .group-header:hover {
    background: #f3f4f6;
  }

  .expand-icon {
    font-size: 12px;
    color: #6b7280;
    width: 16px;
  }

  .group-name {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }

  .group-count {
    font-size: 13px;
    color: #6b7280;
    background: #e5e7eb;
    padding: 2px 10px;
    border-radius: 12px;
  }

  .group-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid #e5e7eb;
  }

  @media (min-width: 768px) {
    .group-content {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 16px;
    }
  }
</style>
