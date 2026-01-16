<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { StandardDiagram } from '../types';
  import { buildHierarchy, type HierarchyNode } from '../utils/standards';

  export let standards: StandardDiagram[];

  const dispatch = createEventDispatcher<{
    select: string;
  }>();

  // Build hierarchy from standards
  $: hierarchy = buildHierarchy(standards);

  // Track expanded nodes
  let expandedNodes = new Set<string>();

  // Initialize with all connectors expanded
  $: {
    if (expandedNodes.size === 0 && hierarchy.length > 0) {
      expandedNodes = new Set(hierarchy.map(n => n.id));
    }
  }

  function toggleNode(id: string) {
    if (expandedNodes.has(id)) {
      expandedNodes.delete(id);
    } else {
      expandedNodes.add(id);
    }
    expandedNodes = expandedNodes;
  }

  function handleStandardClick(node: HierarchyNode) {
    if (node.standard) {
      dispatch('select', node.standard.id);
    }
  }
</script>

<div class="hierarchy-view">
  {#each hierarchy as connector (connector.id)}
    <div class="tree-node connector-node">
      <button class="node-header" onclick={() => toggleNode(connector.id)}>
        <span class="expand-icon">{expandedNodes.has(connector.id) ? '▼' : '▶'}</span>
        <span class="node-label">{connector.label}</span>
        <span class="node-count">{connector.count}</span>
      </button>

      {#if expandedNodes.has(connector.id)}
        <div class="node-children">
          {#each connector.children as gender (gender.id)}
            <div class="tree-node gender-node">
              <button class="node-header sub" onclick={() => toggleNode(gender.id)}>
                <span class="tree-line"></span>
                <span class="expand-icon">{expandedNodes.has(gender.id) ? '▼' : '▶'}</span>
                <span class="node-label">{gender.label}</span>
                <span class="node-count">{gender.count}</span>
              </button>

              {#if expandedNodes.has(gender.id)}
                <div class="node-children">
                  {#each gender.children as signal (signal.id)}
                    <div class="tree-node signal-node">
                      <button class="node-header sub sub2" onclick={() => toggleNode(signal.id)}>
                        <span class="tree-line"></span>
                        <span class="tree-line"></span>
                        <span class="expand-icon">{expandedNodes.has(signal.id) ? '▼' : '▶'}</span>
                        <span class="node-label signal-label">{signal.label}</span>
                        <span class="node-count">{signal.count}</span>
                      </button>

                      {#if expandedNodes.has(signal.id)}
                        <div class="node-children standards">
                          {#each signal.children as standardNode (standardNode.id)}
                            <button
                              class="standard-item"
                              onclick={() => handleStandardClick(standardNode)}
                            >
                              <span class="tree-line"></span>
                              <span class="tree-line"></span>
                              <span class="tree-line"></span>
                              <span class="standard-dot"></span>
                              <span class="standard-name">{standardNode.label}</span>
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .hierarchy-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tree-node {
    background: white;
    border-radius: 8px;
  }

  .connector-node {
    border: 1px solid #e5e7eb;
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 12px 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s;
  }

  .node-header:hover {
    background: #f9fafb;
  }

  .node-header.sub {
    padding-left: 8px;
  }

  .node-header.sub2 {
    padding-left: 8px;
  }

  .tree-line {
    width: 20px;
    height: 2px;
    background: #d1d5db;
    flex-shrink: 0;
  }

  .expand-icon {
    font-size: 10px;
    color: #6b7280;
    width: 14px;
    flex-shrink: 0;
  }

  .node-label {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: #111827;
  }

  .signal-label {
    color: #92400e;
    background: #fef3c7;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .node-count {
    font-size: 12px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .node-children {
    padding-left: 8px;
    border-left: 2px solid #e5e7eb;
    margin-left: 16px;
  }

  .node-children.standards {
    padding: 8px 0;
  }

  .standard-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s;
    border-radius: 6px;
  }

  .standard-item:hover {
    background: #eff6ff;
  }

  .standard-dot {
    width: 8px;
    height: 8px;
    background: #2563eb;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .standard-name {
    font-size: 13px;
    color: #374151;
  }

  .gender-node, .signal-node {
    border: none;
    background: transparent;
  }
</style>
