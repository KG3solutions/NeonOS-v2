// Sync configuration storage

import type { SyncConfig } from './types';
import { DEFAULT_SYNC_CONFIG } from './types';

const SYNC_CONFIG_KEY = 'wire-diagram-sync-config';
const NOTION_ID_MAP_KEY = 'wire-diagram-notion-map';

// Store sync config in localStorage (simple key-value, not IndexedDB)
export function getSyncConfig(): SyncConfig {
  try {
    const stored = localStorage.getItem(SYNC_CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_SYNC_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error reading sync config:', e);
  }
  return DEFAULT_SYNC_CONFIG;
}

export function saveSyncConfig(config: SyncConfig): void {
  try {
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving sync config:', e);
  }
}

// Map between our app IDs and Notion page IDs
export interface NotionIdMapping {
  [appId: string]: string;  // appId -> notionPageId
}

export function getNotionIdMap(): NotionIdMapping {
  try {
    const stored = localStorage.getItem(NOTION_ID_MAP_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading Notion ID map:', e);
  }
  return {};
}

export function saveNotionIdMap(map: NotionIdMapping): void {
  try {
    localStorage.setItem(NOTION_ID_MAP_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving Notion ID map:', e);
  }
}

export function setNotionIdMapping(appId: string, notionPageId: string): void {
  const map = getNotionIdMap();
  map[appId] = notionPageId;
  saveNotionIdMap(map);
}

export function getNotionPageId(appId: string): string | undefined {
  return getNotionIdMap()[appId];
}

export function getAppIdByNotionPageId(notionPageId: string): string | undefined {
  const map = getNotionIdMap();
  return Object.entries(map).find(([_, nid]) => nid === notionPageId)?.[0];
}

export function removeNotionIdMapping(appId: string): void {
  const map = getNotionIdMap();
  delete map[appId];
  saveNotionIdMap(map);
}
