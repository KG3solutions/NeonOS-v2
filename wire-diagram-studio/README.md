# Wire Diagram Studio

A mobile-first web application for creating, managing, and exporting wire diagrams. Built with Svelte + Vite.

## Features

- **Standard Diagrams**: Create and maintain baseline wire diagram templates
- **Project Diagrams**: Fork standards into project-specific versions
- **Reference Mode**: Large-text, read-only view optimized for phone-on-bench usage
- **PNG Export**: High-resolution export with optional wire color legend
- **Offline-First**: All data stored locally in IndexedDB
- **Mobile-First**: Designed primarily for phone use in the shop
- **Notion Sync**: Two-way sync with Notion via Zapier (optional)

## Quick Start

```bash
cd ~/Desktop/CC/BLM/wire-diagram-studio

# Install dependencies
npm install

# Start development server (frontend only)
npm run dev

# Start with Notion sync support (frontend + webhook server)
npm run dev:full

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server runs at `http://localhost:5173`

## Notion Sync

Wire Diagram Studio supports two-way sync with a Notion database via Zapier:

- **App → Notion**: Changes sync automatically when you save
- **Notion → App**: Changes poll every 10 seconds

See [NOTION-SYNC.md](NOTION-SYNC.md) for complete setup instructions.

### Quick Setup
1. Go to **Settings** → **Notion Sync**
2. Enable sync and paste your Zapier webhook URL
3. Run `npm run dev:full` to start both frontend and webhook server

## Usage

### Creating a Standard Diagram
1. Go to the **Standards** tab
2. Tap **+ New** to create a new standard
3. Enter diagram name and optional connector label
4. Add pins with labels, functions, wire names, colors, and notes
5. Tap **Save**

### Creating a Project from a Standard
1. Go to **Standards** and select a standard diagram
2. Tap **"Update for Your Project"**
3. A new project copy is created automatically
4. Customize the name, connector, and any pin details
5. Tap **Save**

### Reference Mode
- Open any diagram (standard or project)
- Tap the **book icon** to enter Reference Mode
- Large text and high contrast for easy reading in the shop
- Tap **Exit Reference Mode** to return

### Exporting PNG
1. Open a standard or project diagram
2. Tap **Export PNG**
3. Choose options:
   - Include legend (adds wire color key)
   - Resolution (1x, 2x recommended, 3x for print)
4. Tap **Export PNG** to download

### Data Backup
1. Go to **Settings** tab
2. **Export All Data**: Downloads a JSON backup file
3. **Import from File**: Restore from a backup
4. All standards and projects are included

## Tech Stack

- **Framework**: Svelte 5 + TypeScript
- **Build Tool**: Vite 7
- **Storage**: IndexedDB (via idb library)
- **PNG Export**: html2canvas
- **Webhook Server**: Express (for Notion sync)
- **Styling**: CSS (no external UI framework)

## Project Structure

```
wire-diagram-studio/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ColorPicker.svelte
│   │   │   ├── ConfirmDialog.svelte
│   │   │   ├── DiagramCard.svelte
│   │   │   ├── DiagramView.svelte
│   │   │   ├── ExportDialog.svelte
│   │   │   ├── Navigation.svelte
│   │   │   ├── PinEditor.svelte
│   │   │   ├── PinRow.svelte
│   │   │   ├── SyncSettings.svelte
│   │   │   └── Toast.svelte
│   │   ├── views/             # Page-level components
│   │   ├── stores/            # Svelte stores
│   │   ├── db/                # IndexedDB operations
│   │   ├── sync/              # Notion sync module
│   │   │   ├── config.ts      # Sync configuration
│   │   │   ├── incoming.ts    # Notion → App
│   │   │   ├── outgoing.ts    # App → Notion
│   │   │   ├── polling.ts     # Poll for updates
│   │   │   └── types.ts       # Sync types
│   │   ├── utils/             # Utility functions
│   │   └── types.ts           # Core types
│   ├── App.svelte
│   ├── app.css
│   └── main.ts
├── server/
│   └── webhook-server.ts      # Incoming webhook handler
├── NOTION-SYNC.md             # Sync setup guide
└── SPEC.md                    # Product specification
```

## Data Model

### Standard Diagram
```typescript
interface StandardDiagram {
  id: string;
  name: string;
  connectorLabel: string;
  pins: Pin[];
  createdAt: number;
  updatedAt: number;
}
```

### Project Diagram
```typescript
interface ProjectDiagram {
  id: string;
  name: string;
  connectorLabel: string;
  derivedFromStandardId: string;
  pins: Pin[];
  createdAt: number;
  updatedAt: number;
}
```

### Pin
```typescript
interface Pin {
  id: string;
  pinLabel: string;        // "1", "2", "A", etc.
  functionLabel: string;   // "GND", "+24V", etc.
  wireName: string;        // "Power +", "Data In"
  wireColor: string;       // "Red", "Black/White"
  wireColorHex: string;    // "#dc2626"
  notes: string;
  sortOrder: number;
}
```

## Seed Data

The app includes sample data on first run:

1. **24V DC Motor Controller** (7-pin standard)
   - Power, control, and fault signals

2. **RS-485 Communication** (4-pin standard)
   - Data+, Data-, GND, Shield

3. **Hilton Lobby Fountain Motor** (project)
   - Derived from the motor controller standard
   - Site-specific wire names and notes

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:full` | Start frontend + webhook server |
| `npm run server` | Start webhook server only |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | TypeScript type checking |

## Browser Support

- Chrome/Edge 88+
- Safari 14+
- Firefox 78+

IndexedDB is required for local storage.

## License

MIT
