<script lang="ts">
  import { standards } from '../stores/standards';
  import { templates } from '../stores/templates';
  import { viewMode, searchQuery, diagramFilter } from '../stores/ui';
  import DiagramCard from '../components/DiagramCard.svelte';
  import MissingStandardCard from '../components/MissingStandardCard.svelte';
  import ViewSelector from '../components/ViewSelector.svelte';
  import GroupedView from '../components/GroupedView.svelte';
  import HierarchyView from '../components/HierarchyView.svelte';
  import SearchBar from '../components/SearchBar.svelte';
  import FilterSelector from '../components/FilterSelector.svelte';
  import ProjectDiagramsSection from '../components/ProjectDiagramsSection.svelte';
  import { findMissingStandards, type MissingStandard } from '../utils/standards';
  import { createEventDispatcher } from 'svelte';
  import type { StandardDiagram } from '../types';

  const dispatch = createEventDispatcher<{
    select: string;
    create: void;
    createFromMissing: MissingStandard;
  }>();

  // Check if a diagram has JSON pinout data (is a "standard")
  function hasJsonPinout(diagram: StandardDiagram): boolean {
    return diagram.pins.length > 0 && diagram.pins.some(pin => pin.x !== undefined && pin.y !== undefined);
  }

  // Separate standards (with JSON) from project diagrams (without JSON)
  $: standardDiagrams = $standards.filter(hasJsonPinout);
  $: projectDiagrams = $standards.filter(d => !hasJsonPinout(d));

  // Filter diagrams based on search query
  function matchesSearch(diagram: StandardDiagram, query: string): boolean {
    if (!query.trim()) return true;
    const lowerQuery = query.toLowerCase();
    return (
      diagram.name.toLowerCase().includes(lowerQuery) ||
      diagram.connectorLabel.toLowerCase().includes(lowerQuery) ||
      (diagram.signalType?.toLowerCase().includes(lowerQuery) ?? false)
    );
  }

  // Apply search and filter
  $: filteredStandards = standardDiagrams.filter(d => matchesSearch(d, $searchQuery));
  $: filteredProjects = projectDiagrams.filter(d => matchesSearch(d, $searchQuery));

  // Decide what to show based on filter
  $: showStandards = $diagramFilter === 'all' || $diagramFilter === 'standards';
  $: showProjects = $diagramFilter === 'all' || $diagramFilter === 'projects';

  // Compute missing standards based on templates and existing standards
  $: missingStandards = findMissingStandards($templates, standardDiagrams);
  $: hasStandards = filteredStandards.length > 0;
  $: hasProjects = filteredProjects.length > 0;
  $: hasMissing = missingStandards.length > 0;

  function handleMissingClick(e: CustomEvent<MissingStandard>) {
    dispatch('createFromMissing', e.detail);
  }
</script>

<div class="standards-list">
  <div class="header">
    <div class="header-top">
      <div class="header-left">
        <h1>Wire Diagrams</h1>
        <span class="count">{$standards.length} total</span>
      </div>
      <div class="header-right">
        <button class="create-btn" onclick={() => dispatch('create')}>
          + New
        </button>
      </div>
    </div>
    <div class="header-controls">
      <SearchBar />
      <FilterSelector />
      <ViewSelector />
    </div>
  </div>

  {#if !hasStandards && !hasProjects && !hasMissing}
    <div class="empty-state">
      <p class="empty-title">No diagrams yet</p>
      <p class="empty-text">Create your first wire diagram to get started</p>
      <button class="empty-btn" onclick={() => dispatch('create')}>
        Create Diagram
      </button>
    </div>
  {:else if $searchQuery && !hasStandards && !hasProjects}
    <div class="empty-state">
      <p class="empty-title">No results found</p>
      <p class="empty-text">Try a different search term</p>
    </div>
  {:else}
    <!-- Standards Section (diagrams with JSON pinout data) -->
    {#if showStandards && hasStandards}
      <section class="section standards-section">
        <div class="section-header">
          <h2>
            <span class="section-icon">✓</span>
            Standards
          </h2>
          <span class="section-count standards-count">{filteredStandards.length} diagrams</span>
        </div>

        {#if $viewMode === 'all'}
          <div class="card-grid">
            {#each filteredStandards as standard (standard.id)}
              <DiagramCard
                diagram={standard}
                on:click={() => dispatch('select', standard.id)}
              />
            {/each}
          </div>
        {:else if $viewMode === 'grouped'}
          <GroupedView
            standards={filteredStandards}
            on:select={(e) => dispatch('select', e.detail)}
          />
        {:else if $viewMode === 'hierarchy'}
          <HierarchyView
            standards={filteredStandards}
            on:select={(e) => dispatch('select', e.detail)}
          />
        {/if}
      </section>
    {/if}

    <!-- Project Diagrams Section (diagrams without JSON pinout data) -->
    {#if showProjects && hasProjects}
      <ProjectDiagramsSection
        diagrams={filteredProjects}
        on:select={(e) => dispatch('select', e.detail)}
      />
    {/if}

    <!-- Awaiting Standardization Section -->
    {#if showStandards && hasMissing && !$searchQuery}
      <section class="section awaiting">
        <div class="section-header">
          <h2>
            <span class="warning-icon">⚠️</span>
            Awaiting Standardization
          </h2>
          <span class="section-count">{missingStandards.length} needed</span>
        </div>

        <div class="missing-grid">
          {#each missingStandards as missing (missing.templateId + missing.gender + missing.signalType)}
            <MissingStandardCard
              {missing}
              on:click={handleMissingClick}
            />
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .standards-list {
    padding: 16px;
    padding-bottom: 80px;
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .header-left h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }

  .count {
    font-size: 14px;
    color: #6b7280;
  }

  .header-right {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .header-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .create-btn {
    padding: 10px 20px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.15s;
    white-space: nowrap;
  }

  .create-btn:hover {
    background: #1d4ed8;
  }

  .section {
    margin-bottom: 32px;
  }

  .standards-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-icon {
    color: #059669;
    font-size: 18px;
  }

  .warning-icon {
    font-size: 20px;
  }

  .section-count {
    font-size: 13px;
    color: #dc2626;
    font-weight: 500;
  }

  .section-count.standards-count {
    color: #059669;
    background: #d1fae5;
    padding: 2px 10px;
    border-radius: 12px;
  }

  .card-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .missing-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .awaiting {
    background: #fef2f2;
    margin: 0 -16px;
    padding: 16px;
    border-radius: 0;
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
    margin: 0 0 24px 0;
  }

  .empty-btn {
    padding: 12px 28px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
  }

  .empty-btn:hover {
    background: #1d4ed8;
  }

  @media (min-width: 768px) {
    .standards-list {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }

    .missing-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }

    .awaiting {
      margin: 0;
      border-radius: 12px;
    }
  }

  @media (min-width: 1024px) {
    .standards-list {
      max-width: 1100px;
    }

    .card-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .missing-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
