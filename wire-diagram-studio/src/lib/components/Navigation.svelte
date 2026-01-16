<script lang="ts">
  import { activeTab, type Tab } from '../stores/ui';

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'standards', label: 'Standards', icon: '📋' },
    { id: 'projects', label: 'Projects', icon: '📁' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];
</script>

<nav class="nav">
  {#each tabs as tab}
    <button
      class="nav-item"
      class:active={$activeTab === tab.id}
      on:click={() => $activeTab = tab.id}
    >
      <span class="nav-icon">{tab.icon}</span>
      <span class="nav-label">{tab.label}</span>
    </button>
  {/each}
</nav>

<style>
  .nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    background: white;
    border-top: 1px solid #e5e7eb;
    padding-bottom: env(safe-area-inset-bottom, 0);
    z-index: 100;
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    transition: color 0.15s;
    min-height: 56px;
  }

  .nav-item:hover {
    color: #374151;
  }

  .nav-item.active {
    color: #2563eb;
  }

  .nav-icon {
    font-size: 20px;
  }

  .nav-label {
    font-size: 11px;
    font-weight: 500;
  }

  @media (min-width: 768px) {
    .nav {
      position: static;
      border-top: none;
      border-bottom: 1px solid #e5e7eb;
      justify-content: center;
      gap: 8px;
      padding: 8px;
    }

    .nav-item {
      flex: none;
      flex-direction: row;
      padding: 10px 20px;
      border-radius: 8px;
      gap: 8px;
    }

    .nav-item.active {
      background: #eff6ff;
    }

    .nav-label {
      font-size: 14px;
    }
  }
</style>
