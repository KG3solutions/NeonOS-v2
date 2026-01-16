<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { standards } from './lib/stores/standards';
  import { projects } from './lib/stores/projects';
  import { templates } from './lib/stores/templates';
  import { activeTab, type Tab } from './lib/stores/ui';
  import { seedDatabase } from './lib/db/seed';
  import { getSyncConfig, startPolling, stopPolling, setOnUpdateCallback } from './lib/sync';

  import Navigation from './lib/components/Navigation.svelte';
  import Toast from './lib/components/Toast.svelte';
  import ConfirmDialog from './lib/components/ConfirmDialog.svelte';

  import StandardsList from './lib/views/StandardsList.svelte';
  import StandardDetail from './lib/views/StandardDetail.svelte';
  import StandardEditor from './lib/views/StandardEditor.svelte';
  import ProjectsList from './lib/views/ProjectsList.svelte';
  import ProjectEditor from './lib/views/ProjectEditor.svelte';
  import SettingsView from './lib/views/SettingsView.svelte';

  import type { StandardDiagram } from './lib/types';
  import type { MissingStandard } from './lib/utils/standards';

  // View state
  type View =
    | { type: 'standards-list' }
    | { type: 'standard-detail'; id: string }
    | { type: 'standard-editor'; id: string | null; prefill?: MissingStandard }
    | { type: 'projects-list' }
    | { type: 'project-editor'; id: string }
    | { type: 'settings' };

  let currentView: View = { type: 'standards-list' };
  let selectedStandard: StandardDiagram | null = null;
  let isLoading = true;

  // React to tab changes
  $: {
    if ($activeTab === 'standards' && currentView.type.startsWith('project')) {
      currentView = { type: 'standards-list' };
    } else if ($activeTab === 'projects' && currentView.type.startsWith('standard')) {
      currentView = { type: 'projects-list' };
    } else if ($activeTab === 'settings') {
      currentView = { type: 'settings' };
    }
  }

  onMount(async () => {
    // Load cached data first for fast startup
    await Promise.all([standards.load(), projects.load(), templates.load()]);

    // Seed database if empty
    await seedDatabase();
    await Promise.all([standards.load(), projects.load()]);

    isLoading = false;

    // Sync templates and standards from Notion in background (after UI is ready)
    Promise.all([
      templates.syncFromNotion(),
      standards.syncFromNotion()
    ]).catch(err => {
      console.warn('Background Notion sync failed:', err);
    });

    // Set up sync polling callback
    setOnUpdateCallback(async () => {
      await standards.load();
      await projects.load();
    });

    // Start polling if sync is enabled
    const syncConfig = getSyncConfig();
    if (syncConfig.enabled) {
      startPolling();
    }
  });

  onDestroy(() => {
    stopPolling();
  });

  // Navigation handlers
  async function handleSelectStandard(e: CustomEvent<string>) {
    const standard = await standards.get(e.detail);
    if (standard) {
      selectedStandard = standard;
      currentView = { type: 'standard-detail', id: e.detail };
    }
  }

  function handleCreateStandard() {
    currentView = { type: 'standard-editor', id: null };
  }

  function handleCreateFromMissing(e: CustomEvent<MissingStandard>) {
    currentView = { type: 'standard-editor', id: null, prefill: e.detail };
  }

  function handleEditStandard(e: CustomEvent<string>) {
    currentView = { type: 'standard-editor', id: e.detail };
  }

  async function handleStandardSaved(e: CustomEvent<string>) {
    const standard = await standards.get(e.detail);
    if (standard) {
      selectedStandard = standard;
      currentView = { type: 'standard-detail', id: e.detail };
    }
  }

  function handleBackToStandards() {
    currentView = { type: 'standards-list' };
    selectedStandard = null;
  }

  function handleForkCreated(e: CustomEvent<string>) {
    $activeTab = 'projects';
    currentView = { type: 'project-editor', id: e.detail };
  }

  function handleSelectProject(e: CustomEvent<string>) {
    currentView = { type: 'project-editor', id: e.detail };
  }

  function handleBackToProjects() {
    currentView = { type: 'projects-list' };
  }
</script>

<div class="app">
  {#if isLoading}
    <div class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  {:else}
    <Navigation />

    <main class="main-content">
      {#if currentView.type === 'standards-list'}
        <StandardsList
          on:select={handleSelectStandard}
          on:create={handleCreateStandard}
          on:createFromMissing={handleCreateFromMissing}
        />
      {:else if currentView.type === 'standard-detail' && selectedStandard}
        <StandardDetail
          standard={selectedStandard}
          on:back={handleBackToStandards}
          on:edit={handleEditStandard}
          on:forkCreated={handleForkCreated}
        />
      {:else if currentView.type === 'standard-editor'}
        <StandardEditor
          standardId={currentView.id}
          prefill={currentView.prefill}
          on:back={handleBackToStandards}
          on:saved={handleStandardSaved}
        />
      {:else if currentView.type === 'projects-list'}
        <ProjectsList on:select={handleSelectProject} />
      {:else if currentView.type === 'project-editor'}
        <ProjectEditor
          projectId={currentView.id}
          on:back={handleBackToProjects}
        />
      {:else if currentView.type === 'settings'}
        <SettingsView />
      {/if}
    </main>
  {/if}

  <Toast />
  <ConfirmDialog />
</div>

<style>
  .app {
    min-height: 100vh;
    background: #f9fafb;
  }

  .main-content {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 16px;
    color: #6b7280;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (min-width: 768px) {
    .main-content {
      padding-top: 0;
    }
  }
</style>
