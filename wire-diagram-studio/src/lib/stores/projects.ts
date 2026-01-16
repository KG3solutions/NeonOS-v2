// Svelte store for Project Diagrams

import { writable, derived } from 'svelte/store';
import type { ProjectDiagram } from '../types';
import * as db from '../db';

function createProjectsStore() {
  const { subscribe, set, update } = writable<ProjectDiagram[]>([]);

  return {
    subscribe,

    // Load all projects from IndexedDB
    async load() {
      const projects = await db.getAllProjects();
      // Sort by most recently updated
      projects.sort((a, b) => b.updatedAt - a.updatedAt);
      set(projects);
    },

    // Add or update a project
    async save(project: ProjectDiagram) {
      await db.saveProject(project);
      await this.load();
    },

    // Delete a project
    async delete(id: string) {
      await db.deleteProject(id);
      update(projects => projects.filter(p => p.id !== id));
    },

    // Get a single project by ID
    async get(id: string): Promise<ProjectDiagram | undefined> {
      return db.getProject(id);
    },

    // Get projects derived from a specific standard
    async getByStandard(standardId: string): Promise<ProjectDiagram[]> {
      return db.getProjectsByStandard(standardId);
    }
  };
}

export const projects = createProjectsStore();

// Derived store for quick lookup
export const projectsById = derived(projects, $projects => {
  const map = new Map<string, ProjectDiagram>();
  for (const project of $projects) {
    map.set(project.id, project);
  }
  return map;
});

// Derived store for projects grouped by their source standard
export const projectsByStandard = derived(projects, $projects => {
  const map = new Map<string, ProjectDiagram[]>();
  for (const project of $projects) {
    const existing = map.get(project.derivedFromStandardId) || [];
    existing.push(project);
    map.set(project.derivedFromStandardId, existing);
  }
  return map;
});
