// Svelte store for connector templates

import { writable, derived } from 'svelte/store';
import type { ConnectorTemplate, PinoutConfig } from '../types';
import {
  getAllTemplates,
  getTemplate,
  saveTemplate as saveTemplateToDb,
  deleteTemplate,
  templateHasPinout,
  downloadPinoutJson
} from '../db';
import { loadTemplatesFromNotion } from '../sync/notion-direct';

function createTemplatesStore() {
  const { subscribe, set, update } = writable<ConnectorTemplate[]>([]);

  return {
    subscribe,

    // Load from IndexedDB (cached)
    async load() {
      const templates = await getAllTemplates();
      // Sort: configured first, then by name
      templates.sort((a, b) => {
        const aConfigured = templateHasPinout(a);
        const bConfigured = templateHasPinout(b);
        if (aConfigured !== bConfigured) {
          return aConfigured ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      set(templates);
      return templates;
    },

    // Sync from Notion and update IndexedDB
    async syncFromNotion() {
      try {
        console.log('Syncing templates from Notion...');
        const notionTemplates = await loadTemplatesFromNotion();

        // Get existing templates to preserve local pinout configs
        const existingTemplates = await getAllTemplates();
        const existingMap = new Map(existingTemplates.map(t => [t.notionPageId || t.id, t]));

        // Merge: Notion data + preserve local pinout if Notion has none
        for (const notionTemplate of notionTemplates) {
          const existing = existingMap.get(notionTemplate.id);

          // If existing has pinout but Notion doesn't, preserve local pinout
          if (existing && templateHasPinout(existing) && !templateHasPinout(notionTemplate)) {
            notionTemplate.defaultPinout = existing.defaultPinout;
            notionTemplate.pinCount = existing.pinCount;
          }

          await saveTemplateToDb(notionTemplate);
        }

        console.log(`Synced ${notionTemplates.length} templates from Notion`);
        await this.load();
        return notionTemplates.length;
      } catch (error) {
        console.error('Failed to sync from Notion:', error);
        // Fall back to cached data
        await this.load();
        throw error;
      }
    },

    async get(id: string) {
      return getTemplate(id);
    },

    async save(template: ConnectorTemplate) {
      await saveTemplateToDb(template);
      await this.load();
    },

    async delete(id: string) {
      await deleteTemplate(id);
      await this.load();
    },

    async savePinout(templateId: string, pinout: PinoutConfig) {
      const template = await getTemplate(templateId);
      if (template) {
        template.defaultPinout = pinout;
        template.pinCount = pinout.pins.length;
        await saveTemplateToDb(template);
        await this.load();
        return template;
      }
      return null;
    },

    downloadPinout(template: ConnectorTemplate) {
      downloadPinoutJson(template);
    }
  };
}

export const templates = createTemplatesStore();

// Derived store for configured templates only
export const configuredTemplates = derived(templates, ($templates) =>
  $templates.filter(t => templateHasPinout(t))
);

// Derived store for unconfigured templates (need pinout)
export const unconfiguredTemplates = derived(templates, ($templates) =>
  $templates.filter(t => !templateHasPinout(t))
);

// Check if a specific template is configured
export function isTemplateConfigured(template: ConnectorTemplate): boolean {
  return templateHasPinout(template);
}
