<script lang="ts">
  import { projects } from '../stores/projects';
  import { standardsById } from '../stores/standards';
  import DiagramCard from '../components/DiagramCard.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    select: string;
  }>();

  function getStandardName(id: string): string {
    return $standardsById.get(id)?.name || 'Unknown Standard';
  }
</script>

<div class="projects-list">
  <div class="header">
    <h1>Project Diagrams</h1>
  </div>

  {#if $projects.length === 0}
    <div class="empty-state">
      <p class="empty-title">No projects yet</p>
      <p class="empty-text">
        Go to Standards and tap "Update for Your Project" to create a customized copy
      </p>
    </div>
  {:else}
    <div class="card-grid">
      {#each $projects as project (project.id)}
        <DiagramCard
          diagram={project}
          standardName={getStandardName(project.derivedFromStandardId)}
          on:click={() => dispatch('select', project.id)}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .projects-list {
    padding: 16px;
    padding-bottom: 80px;
  }

  .header {
    margin-bottom: 20px;
  }

  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }

  .card-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-title {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 8px 0;
  }

  .empty-text {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }

  @media (min-width: 768px) {
    .projects-list {
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
