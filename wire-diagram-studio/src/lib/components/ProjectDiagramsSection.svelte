<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { StandardDiagram } from '../types';
  import { showAllProjects } from '../stores/ui';
  import DiagramCard from './DiagramCard.svelte';

  export let diagrams: StandardDiagram[];

  const dispatch = createEventDispatcher<{
    select: string;
  }>();

  // Show first 6 by default, or all if expanded
  $: displayedDiagrams = $showAllProjects ? diagrams : diagrams.slice(0, 6);
  $: hasMore = diagrams.length > 6;
  $: hiddenCount = diagrams.length - 6;

  function toggleShowAll() {
    $showAllProjects = !$showAllProjects;
  }
</script>

{#if diagrams.length > 0}
  <section class="project-diagrams-section">
    <div class="section-header">
      <h2 class="section-title">
        <span class="icon">📋</span>
        Standard Wire Diagrams
      </h2>
      <span class="count">{diagrams.length}</span>
    </div>

    <p class="section-description">
      Wire diagrams awaiting pinout standardization (need JSON pin data added)
    </p>

    <div class="diagrams-grid">
      {#each displayedDiagrams as diagram (diagram.id)}
        <DiagramCard
          {diagram}
          on:click={() => dispatch('select', diagram.id)}
        />
      {/each}
    </div>

    {#if hasMore}
      <button class="toggle-btn" onclick={toggleShowAll}>
        {#if $showAllProjects}
          Show Less
        {:else}
          Show All ({hiddenCount} more)
        {/if}
      </button>
    {/if}
  </section>
{/if}

<style>
  .project-diagrams-section {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .section-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon {
    font-size: 18px;
  }

  .count {
    font-size: 13px;
    color: #6b7280;
    background: #e5e7eb;
    padding: 2px 10px;
    border-radius: 12px;
  }

  .section-description {
    margin: 0 0 16px 0;
    font-size: 13px;
    color: #6b7280;
  }

  .diagrams-grid {
    display: grid;
    gap: 12px;
  }

  @media (min-width: 768px) {
    .diagrams-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .diagrams-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .toggle-btn {
    display: block;
    width: 100%;
    margin-top: 16px;
    padding: 10px 16px;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.15s;
  }

  .toggle-btn:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }
</style>
