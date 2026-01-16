// UI state store

import { writable } from 'svelte/store';

export type Tab = 'standards' | 'projects' | 'settings';
export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Current active tab
export const activeTab = writable<Tab>('standards');

// Toast notifications
function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,

    show(message: string, type: ToastType = 'info') {
      const id = crypto.randomUUID();
      update(toasts => [...toasts, { id, message, type }]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        this.dismiss(id);
      }, 3000);
    },

    dismiss(id: string) {
      update(toasts => toasts.filter(t => t.id !== id));
    },

    success(message: string) {
      this.show(message, 'success');
    },

    error(message: string) {
      this.show(message, 'error');
    },

    info(message: string) {
      this.show(message, 'info');
    }
  };
}

export const toasts = createToastStore();

// Convenience function for showing toasts
export function showToast(message: string, type: ToastType = 'info') {
  toasts.show(message, type);
}

// Confirm dialog state
interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: (() => void) | null;
}

function createConfirmDialogStore() {
  const { subscribe, set } = writable<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: null
  });

  return {
    subscribe,

    show(title: string, message: string, onConfirm: () => void, confirmText = 'Delete') {
      set({
        isOpen: true,
        title,
        message,
        confirmText,
        onConfirm
      });
    },

    close() {
      set({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        onConfirm: null
      });
    },

    confirm() {
      // Will be called from the dialog component
    }
  };
}

export const confirmDialog = createConfirmDialogStore();

// Reference mode state
export const isReferenceMode = writable(false);

// View mode for standards list (persisted to localStorage)
export type ViewMode = 'all' | 'grouped' | 'hierarchy';

function createViewModeStore() {
  // Get saved preference from localStorage
  const saved = typeof localStorage !== 'undefined'
    ? localStorage.getItem('diagramView') as ViewMode | null
    : null;

  const { subscribe, set } = writable<ViewMode>(saved || 'all');

  return {
    subscribe,
    set: (value: ViewMode) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('diagramView', value);
      }
      set(value);
    }
  };
}

export const viewMode = createViewModeStore();

// Search query for filtering diagrams
export const searchQuery = writable<string>('');

// Filter for standards vs projects
export type DiagramFilter = 'all' | 'standards' | 'projects';

function createDiagramFilterStore() {
  // Get saved preference from localStorage
  const saved = typeof localStorage !== 'undefined'
    ? localStorage.getItem('diagramFilter') as DiagramFilter | null
    : null;

  const { subscribe, set } = writable<DiagramFilter>(saved || 'all');

  return {
    subscribe,
    set: (value: DiagramFilter) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('diagramFilter', value);
      }
      set(value);
    }
  };
}

export const diagramFilter = createDiagramFilterStore();

// Show all projects toggle (default shows first 6)
export const showAllProjects = writable<boolean>(false);
