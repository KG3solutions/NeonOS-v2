// Utility functions for standard diagrams

import type { ConnectorTemplate, StandardDiagram } from '../types';

// Represents a missing standard that should be created
export interface MissingStandard {
  templateId: string;
  templateName: string;
  connectorType: string;
  gender: 'male' | 'female';
  signalType: string; // Data, SPI, PWM, Power
  hasPartNumber: boolean;
  imageUrl?: string;
}

/**
 * Find all missing standards based on templates and existing standards.
 * A standard is needed for each combination of: Template + Signal Type
 *
 * New structure: Each template IS a specific gender variant (1 page per gender).
 * We check if standards exist for each template + category combination.
 */
export function findMissingStandards(
  templates: ConnectorTemplate[],
  standards: StandardDiagram[]
): MissingStandard[] {
  const missing: MissingStandard[] = [];

  // Create a lookup set for existing standards
  // Key format: "connectorType|gender|signalType" (normalized lowercase)
  const existingStandards = new Set<string>();

  for (const standard of standards) {
    // Build key from connector label, variant, and signal type
    const key = buildStandardKey(
      standard.connectorLabel,
      standard.connectorVariant,
      standard.signalType
    );
    existingStandards.add(key);
  }

  // Check each template - each template IS a specific gender variant
  for (const template of templates) {
    // Skip templates without categories
    const categories = template.category || [];
    if (categories.length === 0) continue;

    // Skip templates without part number or image
    if (!template.partNumber && !template.imageUrl) continue;

    // Check each category/signal type for this template's gender
    for (const signalType of categories) {
      const key = buildStandardKey(template.type, template.gender, signalType);
      if (!existingStandards.has(key)) {
        missing.push({
          templateId: template.id,
          templateName: template.name,
          connectorType: template.type,
          gender: template.gender,
          signalType,
          hasPartNumber: !!template.partNumber,
          imageUrl: template.imageUrl,
        });
      }
    }
  }

  // Sort by connector type, then gender, then signal type
  missing.sort((a, b) => {
    const typeCompare = a.connectorType.localeCompare(b.connectorType);
    if (typeCompare !== 0) return typeCompare;

    const genderCompare = a.gender.localeCompare(b.gender);
    if (genderCompare !== 0) return genderCompare;

    return a.signalType.localeCompare(b.signalType);
  });

  return missing;
}

/**
 * Build a normalized key for standard lookup
 */
function buildStandardKey(
  connectorName: string,
  gender: 'male' | 'female',
  signalType?: string
): string {
  const parts = [
    connectorName.toLowerCase().trim(),
    gender,
    (signalType || '').toLowerCase().trim(),
  ];
  return parts.join('|');
}

/**
 * Group standards by connector type
 */
export function groupStandardsByConnector(
  standards: StandardDiagram[]
): Map<string, StandardDiagram[]> {
  const groups = new Map<string, StandardDiagram[]>();

  for (const standard of standards) {
    const key = standard.connectorLabel || 'Unknown';
    const existing = groups.get(key) || [];
    existing.push(standard);
    groups.set(key, existing);
  }

  // Sort each group by name
  for (const [key, items] of groups) {
    items.sort((a, b) => a.name.localeCompare(b.name));
  }

  return groups;
}

/**
 * Build hierarchy structure for tree view
 * Structure: Connector Type → Gender → Signal Type → Standards
 */
export interface HierarchyNode {
  type: 'connector' | 'gender' | 'signal' | 'standard';
  label: string;
  id: string;
  children: HierarchyNode[];
  standard?: StandardDiagram;
  count?: number;
}

export function buildHierarchy(standards: StandardDiagram[]): HierarchyNode[] {
  const connectorMap = new Map<string, Map<string, Map<string, StandardDiagram[]>>>();

  // Build nested structure
  for (const standard of standards) {
    const connectorKey = standard.connectorLabel || 'Unknown';
    const genderKey = standard.connectorVariant;
    const signalKey = standard.signalType || 'General';

    if (!connectorMap.has(connectorKey)) {
      connectorMap.set(connectorKey, new Map());
    }
    const genderMap = connectorMap.get(connectorKey)!;

    if (!genderMap.has(genderKey)) {
      genderMap.set(genderKey, new Map());
    }
    const signalMap = genderMap.get(genderKey)!;

    if (!signalMap.has(signalKey)) {
      signalMap.set(signalKey, []);
    }
    signalMap.get(signalKey)!.push(standard);
  }

  // Convert to hierarchy nodes
  const root: HierarchyNode[] = [];

  for (const [connector, genderMap] of connectorMap) {
    const connectorNode: HierarchyNode = {
      type: 'connector',
      label: connector,
      id: `connector-${connector}`,
      children: [],
      count: 0,
    };

    for (const [gender, signalMap] of genderMap) {
      const genderNode: HierarchyNode = {
        type: 'gender',
        label: gender === 'male' ? '♂ Male' : '♀ Female',
        id: `${connector}-${gender}`,
        children: [],
        count: 0,
      };

      for (const [signal, items] of signalMap) {
        const signalNode: HierarchyNode = {
          type: 'signal',
          label: signal,
          id: `${connector}-${gender}-${signal}`,
          children: items.map(s => ({
            type: 'standard' as const,
            label: s.name,
            id: s.id,
            children: [],
            standard: s,
          })),
          count: items.length,
        };

        genderNode.children.push(signalNode);
        genderNode.count! += items.length;
      }

      connectorNode.children.push(genderNode);
      connectorNode.count! += genderNode.count!;
    }

    root.push(connectorNode);
  }

  // Sort root by connector name
  root.sort((a, b) => a.label.localeCompare(b.label));

  return root;
}
