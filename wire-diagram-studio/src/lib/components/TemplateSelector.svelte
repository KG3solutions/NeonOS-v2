<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ConnectorTemplate } from '../types';
  import { templates, configuredTemplates, unconfiguredTemplates, isTemplateConfigured } from '../stores/templates';

  export let showUnconfigured = true;

  const dispatch = createEventDispatcher<{
    select: { template: ConnectorTemplate; variant: 'male' | 'female' };
    configure: ConnectorTemplate;
  }>();

  let selectedTemplate: ConnectorTemplate | null = null;
  let selectedVariant: 'male' | 'female' | null = null;

  function handleTemplateClick(template: ConnectorTemplate) {
    if (!isTemplateConfigured(template)) {
      // Open pinout editor for unconfigured templates
      dispatch('configure', template);
      return;
    }

    selectedTemplate = template;
    selectedVariant = null;

    // If only one variant has an image, auto-select it
    const hasFemale = !!template.femaleImageUrl;
    const hasMale = !!template.maleImageUrl;

    if (hasFemale && !hasMale) {
      selectedVariant = 'female';
      confirmSelection();
    } else if (hasMale && !hasFemale) {
      selectedVariant = 'male';
      confirmSelection();
    }
    // Otherwise, show variant picker
  }

  function selectVariant(variant: 'male' | 'female') {
    selectedVariant = variant;
    confirmSelection();
  }

  function confirmSelection() {
    if (selectedTemplate && selectedVariant) {
      dispatch('select', {
        template: selectedTemplate,
        variant: selectedVariant
      });
      selectedTemplate = null;
      selectedVariant = null;
    }
  }

  function cancelSelection() {
    selectedTemplate = null;
    selectedVariant = null;
  }

  function getImagePreview(template: ConnectorTemplate): string | null {
    return template.femaleImageUrl || template.maleImageUrl || null;
  }
</script>

<div class="template-selector">
  <!-- Unconfigured Templates Section -->
  {#if showUnconfigured && $unconfiguredTemplates.length > 0}
    <section class="section unconfigured-section">
      <h2 class="section-title">
        <span class="warning-icon">!</span>
        Needs Configuration ({$unconfiguredTemplates.length})
      </h2>
      <p class="section-desc">
        These templates are synced from Notion but need pin positions defined.
        Click to configure.
      </p>
      <div class="template-grid">
        {#each $unconfiguredTemplates as template}
          <button
            class="template-card unconfigured"
            on:click={() => handleTemplateClick(template)}
          >
            <div class="template-image">
              {#if getImagePreview(template)}
                <img src={getImagePreview(template)} alt={template.name} />
              {:else}
                <div class="no-image">No Image</div>
              {/if}
            </div>
            <div class="template-info">
              <h3>{template.name}</h3>
              {#if template.manufacturer}
                <p class="manufacturer">{template.manufacturer}</p>
              {/if}
              <div class="variants">
                {#if template.femaleImageUrl}
                  <span class="variant-badge">F</span>
                {/if}
                {#if template.maleImageUrl}
                  <span class="variant-badge">M</span>
                {/if}
              </div>
            </div>
            <div class="configure-overlay">
              <span>Click to Configure Pins</span>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Configured Templates Section -->
  {#if $configuredTemplates.length > 0}
    <section class="section">
      <h2 class="section-title">Available Templates ({$configuredTemplates.length})</h2>
      <p class="section-desc">Select a template to create a new diagram.</p>
      <div class="template-grid">
        {#each $configuredTemplates as template}
          <button
            class="template-card"
            on:click={() => handleTemplateClick(template)}
          >
            <div class="template-image">
              {#if getImagePreview(template)}
                <img src={getImagePreview(template)} alt={template.name} />
              {:else}
                <div class="no-image">{template.pinCount} pins</div>
              {/if}
            </div>
            <div class="template-info">
              <h3>{template.name}</h3>
              {#if template.manufacturer}
                <p class="manufacturer">{template.manufacturer}</p>
              {/if}
              <p class="pin-count">{template.pinCount} pins</p>
              <div class="variants">
                {#if template.femaleImageUrl}
                  <span class="variant-badge" title="Female available">F</span>
                {/if}
                {#if template.maleImageUrl}
                  <span class="variant-badge" title="Male available">M</span>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {:else if !showUnconfigured || $unconfiguredTemplates.length === 0}
    <div class="empty-state">
      <p>No templates available.</p>
      <p class="hint">Templates sync from your Notion "Connector Templates Diagram Creator" database.</p>
    </div>
  {/if}
</div>

<!-- Variant Selection Modal -->
{#if selectedTemplate && !selectedVariant}
  <div class="modal-backdrop" on:click={cancelSelection}>
    <div class="modal" on:click|stopPropagation>
      <h2>Select Variant</h2>
      <p class="modal-subtitle">{selectedTemplate.name}</p>

      <div class="variant-options">
        {#if selectedTemplate.femaleImageUrl}
          <button class="variant-option" on:click={() => selectVariant('female')}>
            <div class="variant-image">
              <img src={selectedTemplate.femaleImageUrl} alt="Female" />
            </div>
            <div class="variant-label">
              <strong>Female</strong>
              {#if selectedTemplate.femalePartNumber}
                <span>{selectedTemplate.femalePartNumber}</span>
              {/if}
            </div>
          </button>
        {/if}

        {#if selectedTemplate.maleImageUrl}
          <button class="variant-option" on:click={() => selectVariant('male')}>
            <div class="variant-image">
              <img src={selectedTemplate.maleImageUrl} alt="Male" />
            </div>
            <div class="variant-label">
              <strong>Male</strong>
              {#if selectedTemplate.malePartNumber}
                <span>{selectedTemplate.malePartNumber}</span>
              {/if}
            </div>
          </button>
        {/if}
      </div>

      <button class="cancel-btn" on:click={cancelSelection}>Cancel</button>
    </div>
  </div>
{/if}

<style>
  .template-selector {
    padding: 16px;
  }

  .section {
    margin-bottom: 32px;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .warning-icon {
    width: 24px;
    height: 24px;
    background: #dc2626;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .section-desc {
    color: #6b7280;
    margin: 0 0 16px 0;
    font-size: 0.9rem;
  }

  .unconfigured-section .section-title {
    color: #dc2626;
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }

  .template-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    padding: 0;
    position: relative;
  }

  .template-card:hover {
    border-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .template-card.unconfigured {
    border-color: #dc2626;
    border-style: dashed;
  }

  .template-card.unconfigured:hover {
    border-color: #dc2626;
    background: #fef2f2;
  }

  .template-image {
    width: 100%;
    height: 100px;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .template-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .no-image {
    color: #9ca3af;
    font-size: 0.9rem;
  }

  .template-info {
    padding: 12px;
  }

  .template-info h3 {
    font-size: 0.95rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .manufacturer {
    font-size: 0.8rem;
    color: #6b7280;
    margin: 0 0 4px 0;
  }

  .pin-count {
    font-size: 0.8rem;
    color: #2563eb;
    margin: 0;
  }

  .variants {
    display: flex;
    gap: 4px;
    margin-top: 8px;
  }

  .variant-badge {
    width: 22px;
    height: 22px;
    background: #dbeafe;
    color: #2563eb;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .configure-overlay {
    position: absolute;
    inset: 0;
    background: rgba(220, 38, 38, 0.9);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.9rem;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .template-card.unconfigured:hover .configure-overlay {
    opacity: 1;
  }

  .empty-state {
    text-align: center;
    padding: 48px 16px;
    color: #6b7280;
  }

  .empty-state .hint {
    font-size: 0.9rem;
    color: #9ca3af;
    margin-top: 8px;
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 16px;
  }

  .modal {
    background: white;
    border-radius: 16px;
    padding: 24px;
    max-width: 400px;
    width: 100%;
  }

  .modal h2 {
    margin: 0 0 4px 0;
    font-size: 1.25rem;
    color: #111827;
  }

  .modal-subtitle {
    color: #6b7280;
    margin: 0 0 20px 0;
  }

  .variant-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .variant-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .variant-option:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }

  .variant-image {
    width: 80px;
    height: 60px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .variant-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .variant-label {
    flex: 1;
  }

  .variant-label strong {
    display: block;
    color: #111827;
    margin-bottom: 2px;
  }

  .variant-label span {
    font-size: 0.85rem;
    color: #6b7280;
  }

  .cancel-btn {
    width: 100%;
    padding: 12px;
    background: #f3f4f6;
    border: none;
    border-radius: 8px;
    color: #374151;
    font-weight: 500;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: #e5e7eb;
  }

  @media (max-width: 480px) {
    .template-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
