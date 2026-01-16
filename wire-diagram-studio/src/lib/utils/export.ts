// PNG Export functionality using html2canvas

import html2canvas from 'html2canvas';
import type { Diagram, Pin } from '../types';

export interface ExportOptions {
  includeLegend: boolean;
  scale: number;
  filename?: string;
}

// Render diagram element to PNG and trigger download
export async function exportDiagramToPng(
  element: HTMLElement,
  diagram: Diagram,
  options: ExportOptions
): Promise<void> {
  const { includeLegend, scale, filename } = options;

  // Create a wrapper element for export
  const exportWrapper = document.createElement('div');
  exportWrapper.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    background: white;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Clone the diagram content
  const diagramClone = element.cloneNode(true) as HTMLElement;
  diagramClone.style.width = '600px';
  exportWrapper.appendChild(diagramClone);

  // Add legend if requested
  if (includeLegend) {
    const legend = createLegendElement(diagram.pins);
    exportWrapper.appendChild(legend);
  }

  // Add to DOM temporarily
  document.body.appendChild(exportWrapper);

  try {
    // Render to canvas
    const canvas = await html2canvas(exportWrapper, {
      scale: scale,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `${diagram.name.replace(/[^a-z0-9]/gi, '-')}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  } finally {
    // Clean up
    document.body.removeChild(exportWrapper);
  }
}

// Create legend element for export
function createLegendElement(pins: Pin[]): HTMLElement {
  const legend = document.createElement('div');
  legend.style.cssText = `
    margin-top: 24px;
    padding-top: 16px;
    border-top: 2px solid #e5e7eb;
  `;

  const title = document.createElement('div');
  title.textContent = 'Wire Color Legend';
  title.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #374151;
  `;
  legend.appendChild(title);

  // Get unique colors
  const uniqueColors = new Map<string, Pin>();
  for (const pin of pins) {
    const key = `${pin.wireColor}-${pin.wireColorHex}`;
    if (!uniqueColors.has(key)) {
      uniqueColors.set(key, pin);
    }
  }

  const grid = document.createElement('div');
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  `;

  for (const pin of uniqueColors.values()) {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background: #f9fafb;
      border-radius: 4px;
    `;

    const swatch = document.createElement('div');
    swatch.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid #d1d5db;
      background-color: ${pin.wireColorHex};
      flex-shrink: 0;
    `;
    item.appendChild(swatch);

    const text = document.createElement('div');
    text.style.cssText = `
      font-size: 12px;
      color: #374151;
    `;

    let labelText = pin.wireColor;
    if (pin.wireName) {
      labelText += ` - ${pin.wireName}`;
    }
    text.textContent = labelText;
    item.appendChild(text);

    grid.appendChild(item);
  }

  legend.appendChild(grid);
  return legend;
}

// Export app data as JSON file
export function exportDataAsJson(data: object, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Read JSON file
export function readJsonFile(file: File): Promise<object> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        resolve(data);
      } catch (e) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
