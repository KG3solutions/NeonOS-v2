// Seed data for Wire Diagram Studio

import type { StandardDiagram, ProjectDiagram, DisplayOptions } from '../types';
import { saveStandard, saveProject, getAllStandards } from './index';

const SEED_STANDARD_ID = 'seed-24v-motor-controller';

const defaultDisplayOptions: DisplayOptions = {
  showPinNumber: true,
  showWireColor: false,
  showLedColor: false
};

export const seedStandard: StandardDiagram = {
  id: SEED_STANDARD_ID,
  name: '24V DC Motor Controller',
  connectorLabel: '7-Pin Molex',
  connectorVariant: 'female',
  pinSize: 15,
  displayOptions: defaultDisplayOptions,
  pins: [
    {
      id: 'pin-1',
      pinLabel: '1',
      functionLabel: '+24V DC',
      wireName: 'Power +',
      wireColor: 'Red',
      wireColorHex: '#dc2626',
      notes: 'Fused at 10A',
      sortOrder: 0
    },
    {
      id: 'pin-2',
      pinLabel: '2',
      functionLabel: 'GND',
      wireName: 'Power -',
      wireColor: 'Black',
      wireColorHex: '#1a1a1a',
      notes: '',
      sortOrder: 1
    },
    {
      id: 'pin-3',
      pinLabel: '3',
      functionLabel: 'Enable',
      wireName: 'Motor Enable',
      wireColor: 'Yellow',
      wireColorHex: '#eab308',
      notes: 'Active high',
      sortOrder: 2
    },
    {
      id: 'pin-4',
      pinLabel: '4',
      functionLabel: 'Speed PWM',
      wireName: 'Speed Control',
      wireColor: 'Blue',
      wireColorHex: '#2563eb',
      notes: '0-10V analog',
      sortOrder: 3
    },
    {
      id: 'pin-5',
      pinLabel: '5',
      functionLabel: 'Direction',
      wireName: 'FWD/REV',
      wireColor: 'Green',
      wireColorHex: '#16a34a',
      notes: 'High=FWD, Low=REV',
      sortOrder: 4
    },
    {
      id: 'pin-6',
      pinLabel: '6',
      functionLabel: 'Fault Out',
      wireName: 'Fault Signal',
      wireColor: 'Orange',
      wireColorHex: '#ea580c',
      notes: 'N.O. contact',
      sortOrder: 5
    },
    {
      id: 'pin-7',
      pinLabel: '7',
      functionLabel: 'Shield',
      wireName: 'Cable Shield',
      wireColor: 'Bare/Copper',
      wireColorHex: '#b87333',
      notes: 'Connect to chassis',
      sortOrder: 6
    }
  ],
  createdAt: Date.now() - 86400000, // 1 day ago
  updatedAt: Date.now() - 86400000
};

export const seedProject: ProjectDiagram = {
  id: 'seed-hilton-fountain',
  name: 'Hilton Lobby Fountain Motor',
  connectorLabel: '7-Pin Molex (Panel Side)',
  derivedFromStandardId: SEED_STANDARD_ID,
  connectorVariant: 'female',
  pinSize: 15,
  displayOptions: defaultDisplayOptions,
  projectName: 'Hilton Lobby Fountain',
  location: 'Building A, Panel 3',
  pins: [
    {
      id: 'proj-pin-1',
      pinLabel: '1',
      functionLabel: '+24V DC',
      wireName: 'Main Power',
      wireColor: 'Red',
      wireColorHex: '#dc2626',
      notes: 'From Panel TB-3',
      sortOrder: 0
    },
    {
      id: 'proj-pin-2',
      pinLabel: '2',
      functionLabel: 'GND',
      wireName: 'Common',
      wireColor: 'Black',
      wireColorHex: '#1a1a1a',
      notes: 'To Panel TB-3',
      sortOrder: 1
    },
    {
      id: 'proj-pin-3',
      pinLabel: '3',
      functionLabel: 'Enable',
      wireName: 'Run Signal',
      wireColor: 'Yellow',
      wireColorHex: '#eab308',
      notes: 'From PLC DO-4',
      sortOrder: 2
    },
    {
      id: 'proj-pin-4',
      pinLabel: '4',
      functionLabel: 'Speed PWM',
      wireName: 'Speed Ref',
      wireColor: 'Blue',
      wireColorHex: '#2563eb',
      notes: 'From PLC AO-1',
      sortOrder: 3
    },
    {
      id: 'proj-pin-5',
      pinLabel: '5',
      functionLabel: 'Direction',
      wireName: 'Direction Sel',
      wireColor: 'Green',
      wireColorHex: '#16a34a',
      notes: 'Jumpered HIGH',
      sortOrder: 4
    },
    {
      id: 'proj-pin-6',
      pinLabel: '6',
      functionLabel: 'Fault Out',
      wireName: 'Fault Alarm',
      wireColor: 'Orange',
      wireColorHex: '#ea580c',
      notes: 'To PLC DI-8',
      sortOrder: 5
    },
    {
      id: 'proj-pin-7',
      pinLabel: '7',
      functionLabel: 'Shield',
      wireName: 'Drain Wire',
      wireColor: 'Bare/Copper',
      wireColorHex: '#b87333',
      notes: 'To Panel Ground Bar',
      sortOrder: 6
    }
  ],
  createdAt: Date.now() - 3600000, // 1 hour ago
  updatedAt: Date.now() - 3600000
};

// Additional standard for RS-485 communication
export const seedStandard2: StandardDiagram = {
  id: 'seed-rs485-comm',
  name: 'RS-485 Communication',
  connectorLabel: '4-Pin Terminal Block',
  connectorVariant: 'female',
  pinSize: 15,
  displayOptions: defaultDisplayOptions,
  pins: [
    {
      id: 'rs485-pin-1',
      pinLabel: 'A',
      functionLabel: 'Data+',
      wireName: 'RS485 A',
      wireColor: 'Blue',
      wireColorHex: '#2563eb',
      notes: 'Non-inverting',
      sortOrder: 0
    },
    {
      id: 'rs485-pin-2',
      pinLabel: 'B',
      functionLabel: 'Data-',
      wireName: 'RS485 B',
      wireColor: 'Blue/White',
      wireColorHex: '#4a7ab8',
      notes: 'Inverting',
      sortOrder: 1
    },
    {
      id: 'rs485-pin-3',
      pinLabel: 'G',
      functionLabel: 'Signal GND',
      wireName: 'Reference',
      wireColor: 'Black',
      wireColorHex: '#1a1a1a',
      notes: '',
      sortOrder: 2
    },
    {
      id: 'rs485-pin-4',
      pinLabel: 'S',
      functionLabel: 'Shield',
      wireName: 'Cable Shield',
      wireColor: 'Bare/Copper',
      wireColorHex: '#b87333',
      notes: 'Ground at one end only',
      sortOrder: 3
    }
  ],
  createdAt: Date.now() - 172800000, // 2 days ago
  updatedAt: Date.now() - 172800000
};

export async function seedDatabase(): Promise<boolean> {
  try {
    const existingStandards = await getAllStandards();

    // Only seed if database is empty
    if (existingStandards.length === 0) {
      await saveStandard(seedStandard);
      await saveStandard(seedStandard2);
      await saveProject(seedProject);
      console.log('Database seeded with sample data');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}
