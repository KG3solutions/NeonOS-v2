// Main sync module - re-exports all sync functionality

export * from './types';
export * from './config';
export * from './outgoing';
export * from './incoming';
export * from './polling';

// Sync status store
import { writable } from 'svelte/store';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
  pendingChanges: number;
}

function createSyncStatusStore() {
  const { subscribe, set, update } = writable<SyncStatus>({
    isSyncing: false,
    lastSyncAt: null,
    lastError: null,
    pendingChanges: 0
  });

  return {
    subscribe,

    startSync() {
      update(s => ({ ...s, isSyncing: true, lastError: null }));
    },

    endSync(success: boolean, error?: string) {
      update(s => ({
        ...s,
        isSyncing: false,
        lastSyncAt: success ? Date.now() : s.lastSyncAt,
        lastError: error || null
      }));
    },

    incrementPending() {
      update(s => ({ ...s, pendingChanges: s.pendingChanges + 1 }));
    },

    decrementPending() {
      update(s => ({ ...s, pendingChanges: Math.max(0, s.pendingChanges - 1) }));
    },

    clearPending() {
      update(s => ({ ...s, pendingChanges: 0 }));
    }
  };
}

export const syncStatus = createSyncStatusStore();
