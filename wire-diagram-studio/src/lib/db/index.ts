// IndexedDB operations for Wire Diagram Studio v2

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { StandardDiagram, ProjectDiagram, ConnectorTemplate, AppData } from '../types';

interface WireDiagramDB extends DBSchema {
  templates: {
    key: string;
    value: ConnectorTemplate;
    indexes: {
      'by-name': string;
      'by-updated': number;
      'by-notion-id': string;
    };
  };
  standards: {
    key: string;
    value: StandardDiagram;
    indexes: {
      'by-name': string;
      'by-updated': number;
      'by-notion-id': string;
    };
  };
  projects: {
    key: string;
    value: ProjectDiagram;
    indexes: {
      'by-name': string;
      'by-updated': number;
      'by-standard': string;
      'by-notion-id': string;
    };
  };
}

const DB_NAME = 'wire-diagram-studio';
const DB_VERSION = 2; // Bumped for new templates store

let dbInstance: IDBPDatabase<WireDiagramDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<WireDiagramDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<WireDiagramDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Templates store (new in v2)
      if (!db.objectStoreNames.contains('templates')) {
        const templatesStore = db.createObjectStore('templates', { keyPath: 'id' });
        templatesStore.createIndex('by-name', 'name');
        templatesStore.createIndex('by-updated', 'updatedAt');
        templatesStore.createIndex('by-notion-id', 'notionPageId');
      }

      // Standards store
      if (!db.objectStoreNames.contains('standards')) {
        const standardsStore = db.createObjectStore('standards', { keyPath: 'id' });
        standardsStore.createIndex('by-name', 'name');
        standardsStore.createIndex('by-updated', 'updatedAt');
        standardsStore.createIndex('by-notion-id', 'notionPageId');
      } else if (oldVersion < 2) {
        // Add notion-id index to existing store
        const tx = db.transaction as any;
        if (tx && tx.objectStore) {
          const store = tx.objectStore('standards');
          if (!store.indexNames.contains('by-notion-id')) {
            store.createIndex('by-notion-id', 'notionPageId');
          }
        }
      }

      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectsStore.createIndex('by-name', 'name');
        projectsStore.createIndex('by-updated', 'updatedAt');
        projectsStore.createIndex('by-standard', 'derivedFromStandardId');
        projectsStore.createIndex('by-notion-id', 'notionPageId');
      } else if (oldVersion < 2) {
        const tx = db.transaction as any;
        if (tx && tx.objectStore) {
          const store = tx.objectStore('projects');
          if (!store.indexNames.contains('by-notion-id')) {
            store.createIndex('by-notion-id', 'notionPageId');
          }
        }
      }
    }
  });

  return dbInstance;
}

// ============================================================================
// CONNECTOR TEMPLATE OPERATIONS
// ============================================================================

export async function getAllTemplates(): Promise<ConnectorTemplate[]> {
  const db = await getDB();
  return db.getAllFromIndex('templates', 'by-updated');
}

export async function getTemplate(id: string): Promise<ConnectorTemplate | undefined> {
  const db = await getDB();
  return db.get('templates', id);
}

export async function getTemplateByNotionId(notionPageId: string): Promise<ConnectorTemplate | undefined> {
  const db = await getDB();
  const results = await db.getAllFromIndex('templates', 'by-notion-id', notionPageId);
  return results[0];
}

export async function saveTemplate(template: ConnectorTemplate): Promise<void> {
  const db = await getDB();
  template.updatedAt = Date.now();
  await db.put('templates', template);
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('templates', id);
}

// Check if template has pinout configured
export function templateHasPinout(template: ConnectorTemplate): boolean {
  return !!(
    template.defaultPinout &&
    template.defaultPinout.pins &&
    template.defaultPinout.pins.length > 0
  );
}

// Get templates that need pinout configuration
export async function getUnconfiguredTemplates(): Promise<ConnectorTemplate[]> {
  const templates = await getAllTemplates();
  return templates.filter(t => !templateHasPinout(t));
}

// Get templates that are ready to use
export async function getConfiguredTemplates(): Promise<ConnectorTemplate[]> {
  const templates = await getAllTemplates();
  return templates.filter(t => templateHasPinout(t));
}

// ============================================================================
// STANDARD DIAGRAM OPERATIONS
// ============================================================================

export async function getAllStandards(): Promise<StandardDiagram[]> {
  const db = await getDB();
  return db.getAllFromIndex('standards', 'by-updated');
}

export async function getStandard(id: string): Promise<StandardDiagram | undefined> {
  const db = await getDB();
  return db.get('standards', id);
}

export async function getStandardByNotionId(notionPageId: string): Promise<StandardDiagram | undefined> {
  const db = await getDB();
  const results = await db.getAllFromIndex('standards', 'by-notion-id', notionPageId);
  return results[0];
}

export async function saveStandard(standard: StandardDiagram): Promise<void> {
  const db = await getDB();
  standard.updatedAt = Date.now();
  await db.put('standards', standard);
}

export async function deleteStandard(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('standards', id);
}

// ============================================================================
// PROJECT DIAGRAM OPERATIONS
// ============================================================================

export async function getAllProjects(): Promise<ProjectDiagram[]> {
  const db = await getDB();
  return db.getAllFromIndex('projects', 'by-updated');
}

export async function getProject(id: string): Promise<ProjectDiagram | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function getProjectByNotionId(notionPageId: string): Promise<ProjectDiagram | undefined> {
  const db = await getDB();
  const results = await db.getAllFromIndex('projects', 'by-notion-id', notionPageId);
  return results[0];
}

export async function getProjectsByStandard(standardId: string): Promise<ProjectDiagram[]> {
  const db = await getDB();
  return db.getAllFromIndex('projects', 'by-standard', standardId);
}

export async function saveProject(project: ProjectDiagram): Promise<void> {
  const db = await getDB();
  project.updatedAt = Date.now();
  await db.put('projects', project);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
}

// ============================================================================
// DATA EXPORT/IMPORT
// ============================================================================

export async function exportAllData(): Promise<AppData> {
  const db = await getDB();
  const templates = await db.getAll('templates');
  const standards = await db.getAll('standards');
  const projects = await db.getAll('projects');

  return {
    templates,
    standards,
    projects,
    exportedAt: Date.now(),
    version: '2.0.0'
  };
}

export async function importData(data: AppData): Promise<{ templates: number; standards: number; projects: number }> {
  const db = await getDB();

  let templatesImported = 0;
  let standardsImported = 0;
  let projectsImported = 0;

  // Import templates
  if (data.templates) {
    const tx0 = db.transaction('templates', 'readwrite');
    for (const template of data.templates) {
      const newTemplate: ConnectorTemplate = {
        ...template,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await tx0.store.put(newTemplate);
      templatesImported++;
    }
    await tx0.done;
  }

  // Import standards
  const tx1 = db.transaction('standards', 'readwrite');
  for (const standard of data.standards) {
    const newStandard: StandardDiagram = {
      ...standard,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await tx1.store.put(newStandard);
    standardsImported++;
  }
  await tx1.done;

  // Import projects
  const tx2 = db.transaction('projects', 'readwrite');
  for (const project of data.projects) {
    const newProject: ProjectDiagram = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await tx2.store.put(newProject);
    projectsImported++;
  }
  await tx2.done;

  return { templates: templatesImported, standards: standardsImported, projects: projectsImported };
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('templates');
  await db.clear('standards');
  await db.clear('projects');
}

// ============================================================================
// PINOUT JSON EXPORT
// ============================================================================

export function exportPinoutJson(template: ConnectorTemplate): string {
  return JSON.stringify(template.defaultPinout, null, 2);
}

export function downloadPinoutJson(template: ConnectorTemplate): void {
  const json = exportPinoutJson(template);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-pinout.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
