<script lang="ts">
  import { diagramFilter, type DiagramFilter } from '../stores/ui';

  const filters: { value: DiagramFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'standards', label: 'Standards' },
    { value: 'projects', label: 'Projects' },
  ];

  function selectFilter(value: DiagramFilter) {
    diagramFilter.set(value);
  }
</script>

<div class="filter-selector">
  {#each filters as filter}
    <button
      class="filter-btn"
      class:active={$diagramFilter === filter.value}
      onclick={() => selectFilter(filter.value)}
    >
      {filter.label}
    </button>
  {/each}
</div>

<style>
  .filter-selector {
    display: flex;
    background: #f3f4f6;
    border-radius: 8px;
    padding: 4px;
    gap: 4px;
  }

  .filter-btn {
    padding: 6px 12px;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }

  .filter-btn:hover {
    color: #374151;
  }

  .filter-btn.active {
    background: white;
    color: #111827;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
</style>
