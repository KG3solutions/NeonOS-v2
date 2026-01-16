<script lang="ts">
  import { viewMode, type ViewMode } from '../stores/ui';

  const views: { mode: ViewMode; label: string; icon: string }[] = [
    { mode: 'all', label: 'All', icon: '▦' },
    { mode: 'grouped', label: 'Grouped', icon: '📁' },
    { mode: 'hierarchy', label: 'Tree', icon: '🌳' },
  ];
</script>

<div class="view-selector">
  {#each views as view}
    <button
      class="view-btn"
      class:active={$viewMode === view.mode}
      onclick={() => viewMode.set(view.mode)}
      title={view.label}
    >
      <span class="view-icon">{view.icon}</span>
      <span class="view-label">{view.label}</span>
    </button>
  {/each}
</div>

<style>
  .view-selector {
    display: flex;
    gap: 4px;
    background: #f3f4f6;
    padding: 4px;
    border-radius: 8px;
  }

  .view-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-size: 13px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }

  .view-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .view-btn.active {
    background: white;
    color: #111827;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .view-icon {
    font-size: 14px;
  }

  .view-label {
    font-weight: 500;
  }

  @media (max-width: 480px) {
    .view-label {
      display: none;
    }

    .view-btn {
      padding: 8px 12px;
    }
  }
</style>
