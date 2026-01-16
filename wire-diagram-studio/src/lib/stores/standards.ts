// Svelte store for Standard Diagrams

import { writable, derived } from 'svelte/store';
import type { StandardDiagram } from '../types';
import * as db from '../db';
import { getSyncConfig, getNotionPageId } from '../sync/config';
import { syncStandardToNotion, syncStandardDeletionToNotion } from '../sync/outgoing';
import { syncStatus } from '../sync';
import { loadWireDiagramsFromNotion } from '../sync/notion-direct';

function createStandardsStore() {
  const { subscribe, set, update } = writable<StandardDiagram[]>([]);

  return {
    subscribe,

    // Load all standards from IndexedDB
    async load() {
      const standards = await db.getAllStandards();
      // Sort by most recently updated
      standards.sort((a, b) => b.updatedAt - a.updatedAt);
      set(standards);
    },

    // Sync standards from Notion Wire Diagrams database
    async syncFromNotion() {
      try {
        console.log('Syncing standards from Notion...');
        const notionDiagrams = await loadWireDiagramsFromNotion();

        // Get existing standards to preserve local-only data
        const existingStandards = await db.getAllStandards();
        const existingMap = new Map(existingStandards.map(s => [s.notionPageId || s.id, s]));

        // Merge: Notion data takes precedence, but preserve local-only standards
        for (const notionDiagram of notionDiagrams) {
          await db.saveStandard(notionDiagram);
        }

        console.log(`Synced ${notionDiagrams.length} standards from Notion`);
        await this.load();
        return notionDiagrams.length;
      } catch (error) {
        console.error('Failed to sync standards from Notion:', error);
        // Fall back to cached data
        await this.load();
        throw error;
      }
    },

    // Add or update a standard (with optional sync)
    async save(standard: StandardDiagram, skipSync = false) {
      const isNew = !(await db.getStandard(standard.id));
      await db.saveStandard(standard);
      await this.load();

      // Sync to Notion if enabled
      const config = getSyncConfig();
      if (!skipSync && config.enabled && config.syncOnSave) {
        const notionPageId = getNotionPageId(standard.id);
        const eventType = isNew || !notionPageId ? 'standard_created' : 'standard_updated';

        syncStatus.startSync();
        const result = await syncStandardToNotion(standard, eventType);
        syncStatus.endSync(result.success, result.error);
      }
    },

    // Delete a standard (with optional sync)
    async delete(id: string, skipSync = false) {
      // Sync deletion to Notion first (need the mapping before we delete)
      const config = getSyncConfig();
      if (!skipSync && config.enabled) {
        syncStatus.startSync();
        const result = await syncStandardDeletionToNotion(id);
        syncStatus.endSync(result.success, result.error);
      }

      await db.deleteStandard(id);
      update(standards => standards.filter(s => s.id !== id));
    },

    // Get a single standard by ID
    async get(id: string): Promise<StandardDiagram | undefined> {
      return db.getStandard(id);
    }
  };
}

export const standards = createStandardsStore();

// Derived store for quick lookup
export const standardsById = derived(standards, $standards => {
  const map = new Map<string, StandardDiagram>();
  for (const standard of $standards) {
    map.set(standard.id, standard);
  }
  return map;
});
