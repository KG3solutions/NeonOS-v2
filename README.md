# NeonOS v2 🔵

**Modern Warehouse Management System for KG3 LLC**

NeonOS is a production-grade inventory and job management system built for LED lighting warehouse operations. Features real-time collaboration, barcode scanning, time tracking, and seamless Notion integration.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

![NeonOS Dashboard](./docs/screenshot.png)

---

## ✨ Features

### 📦 Inventory Management
- **Real-time tracking** - Live quantity updates across all devices
- **Barcode scanning** - Camera or USB/Bluetooth scanner support
- **Smart search** - Filter by SKU, name, category, location
- **Transaction history** - Complete audit trail of all movements
- **Low stock alerts** - Never run out of critical items
- **Bulk operations** - Update multiple items at once

### 📅 Job Management
- **Multiple job types** - Rentals, Installs, Builds, Service
- **Calendar view** - Visual timeline of all active jobs
- **Pull lists** - Generate picking lists for warehouse crew
- **Item allocation** - Track what equipment is on which job
- **Project values** - Monitor revenue per job
- **Customer tracking** - Complete job history per client

### ⏱️ Time Tracking
- **Quick clock in/out** - One-tap time tracking
- **Weekly timesheets** - View hours by employee and date range
- **Automatic calculations** - Daily and weekly totals
- **Manager approval** - Review and approve time entries
- **CSV export** - Export for payroll processing
- **Overtime tracking** - Flag entries over 40 hours/week

### 🔧 Controller Builder
- **Component library** - Pre-built recipes for common builds
- **Interactive builder** - Drag-and-drop component assembly
- **Availability check** - Real-time stock validation
- **Cost calculator** - Automatic pricing based on components
- **Build instructions** - Step-by-step assembly guides
- **Recipe library** - Save and reuse successful builds

### 📱 Mobile-First Design
- **Progressive Web App** - Install on home screen like native app
- **Offline mode** - Basic functionality without internet
- **Touch-optimized** - 44px tap targets, gesture controls
- **Bottom navigation** - Quick access on mobile
- **Responsive grids** - Adapts to any screen size
- **Camera access** - Scan barcodes with phone camera

### 🔄 Real-Time Collaboration
- **Live updates** - See changes as they happen
- **Socket.io integration** - Sub-second synchronization
- **Multi-user support** - Entire team works simultaneously
- **Conflict prevention** - Smart locking and merge strategies
- **Activity feed** - See who's doing what in real-time

### 🔗 Notion Integration
- **Bidirectional sync** - Updates flow both directions
- **Automatic mapping** - Notion databases ↔ NeonOS
- **Webhook support** - Instant updates via Zapier
- **Conflict resolution** - Last-write-wins with timestamps
- **Bulk import** - Sync thousands of items at once

### 🎨 Modern UI/UX
- **Dark mode** - Easy on the eyes for long shifts
- **Cyber-industrial aesthetic** - Professional terminal-inspired design
- **Keyboard shortcuts** - Power user features
- **Contextual actions** - Right-click menus and quick actions
- **Drag-and-drop** - Intuitive file uploads
- **Toast notifications** - Non-intrusive feedback

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/kg3/neonos-v2.git
cd neonos-v2

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local
```

### Environment Variables

Create `.env.local` in the root directory:

```env
# Backend API
VITE_API_URL=https://api.neonos.kg3.io

# Google OAuth (for production)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Zapier Webhooks (optional)
VITE_ZAPIER_INVENTORY_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
VITE_ZAPIER_PULLLIST_WEBHOOK=https://hooks.zapier.com/hooks/catch/...

# Feature Flags
VITE_ENABLE_NOTION_SYNC=true
VITE_ENABLE_CAMERA_SCANNER=true
VITE_ENABLE_PWA=true
```

### Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview

# Test production build at http://localhost:4173
```

---

## 📁 Project Structure

```
neonos-v2/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   ├── icon-192.png          # App icons
│   └── icon-512.png
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx      # Main dashboard with stats
│   │   ├── Inventory.tsx      # Inventory list and search
│   │   ├── ItemDetail.tsx     # Single item details
│   │   ├── Jobs.tsx           # Jobs calendar and list
│   │   ├── JobDetail.tsx      # Single job details
│   │   ├── Scanner.tsx        # Barcode scanner interface
│   │   ├── TimeClock.tsx      # Clock in/out widget
│   │   ├── Timesheets.tsx     # Weekly timesheet view
│   │   ├── Settings.tsx       # User preferences
│   │   ├── ControllerBuilder.tsx  # Interactive builder
│   │   ├── Recipes.tsx        # Build recipe library
│   │   ├── CameraScanner.tsx  # Camera barcode scanning
│   │   ├── Sidebar.tsx        # Desktop navigation
│   │   ├── BottomTabBar.tsx   # Mobile navigation
│   │   └── [modals]/          # All modal components
│   ├── state.tsx              # Global state management
│   ├── types.ts               # TypeScript definitions
│   ├── mockData.ts            # Demo data for development
│   ├── NeonOS.tsx             # Main app component
│   ├── main.tsx               # App entry point
│   └── index.css              # Global styles
├── .env.example               # Environment template
├── .env.local                 # Your local config (gitignored)
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite bundler config
├── tailwind.config.js         # Tailwind CSS config
└── README.md                  # This file
```

---

## 🎮 Usage Guide

### First Time Setup

1. **Login with Google**
   - Click "Sign in with Google"
   - Authorize NeonOS
   - First user becomes Owner automatically

2. **Configure Settings**
   - Click Settings (⚙️ icon)
   - Set your preferences:
     - Display density (compact/comfortable/spacious)
     - Default scan mode
     - Barcode format
     - Theme preferences

3. **Import Inventory** (if migrating)
   - Settings → Data → Import JSON
   - Upload your inventory export
   - Or sync from Notion (if configured)

### Daily Workflow

#### **Warehouse Staff:**

**Morning:**
1. Clock in via Time Clock widget
2. Check pull lists for today's jobs
3. Scan items as you pull them

**During Work:**
1. Update item quantities as used
2. Mark pull lists as completed
3. Add notes for managers

**End of Day:**
1. Return unused items
2. Clock out
3. Review tomorrow's schedule

#### **Managers:**

**Planning:**
1. Create jobs for upcoming events
2. Add items to job manifests
3. Generate pull lists 1-2 days before

**Execution:**
1. Monitor pull list progress
2. Approve time entries
3. Track item availability

**Review:**
1. Check inventory levels
2. Reorder low stock items
3. Review job profitability

#### **Owners:**

**Strategic:**
1. Monitor revenue metrics
2. Review utilization rates
3. Analyze job profitability
4. Track team productivity

**Operational:**
1. Approve large purchases
2. Manage user permissions
3. Configure integrations
4. Export data for accounting

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `Ctrl+K` | Command palette |
| `Ctrl+N` | New item/job |
| `Ctrl+S` | Save current form |
| `Esc` | Close modal |
| `?` | Show shortcuts |

### Scanner Modes

**Add Mode** - Scan to add items to inventory
**Remove Mode** - Scan to remove/use items
**Pull Mode** - Scan items for a job pull list
**Return Mode** - Scan items being returned from job

---

## 🔧 Configuration

### Role Permissions

| Feature | Owner | Manager | Staff |
|---------|-------|---------|-------|
| View inventory | ✅ | ✅ | ✅ |
| Create/edit items | ✅ | ✅ | ❌ |
| Delete items | ✅ | ❌ | ❌ |
| Adjust quantities | ✅ | ✅ | ✅ |
| View jobs | ✅ | ✅ | ✅ |
| Create/edit jobs | ✅ | ✅ | ❌ |
| Clock in/out | ✅ | ✅ | ✅ |
| View own timesheet | ✅ | ✅ | ✅ |
| View all timesheets | ✅ | ✅ | ❌ |
| Approve time entries | ✅ | ✅ | ❌ |
| Access settings | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ |
| Export data | ✅ | ✅ | ❌ |

### Customization

**Display Settings:**
- Theme: Dark / Light / Auto
- Density: Compact / Comfortable / Spacious
- Date format: MM/DD/YYYY or DD/MM/YYYY
- Time format: 12-hour or 24-hour

**Scanning Settings:**
- Default scan mode
- Auto-generate internal barcodes
- Barcode format (text or QR)
- Beep on successful scan
- Camera preference (front/back)

**Notification Settings:**
- Low stock alerts
- Job reminders
- Pull list notifications
- Clock-in reminders

---

## 🔌 API Integration

### Backend API

NeonOS connects to a Node.js backend API. See [neonos-backend](https://github.com/kg3/neonos-backend) for setup.

**Base URL:** `https://api.neonos.kg3.io`

### Key Endpoints

```typescript
// Authentication
POST   /api/auth/google           // OAuth login
GET    /api/auth/me               // Current user
POST   /api/auth/logout           // Logout

// Inventory
GET    /api/inventory             // List all items
GET    /api/inventory/:id         // Single item
POST   /api/inventory             // Create item
PUT    /api/inventory/:id         // Update item
POST   /api/inventory/:id/adjust  // Adjust quantity

// Jobs
GET    /api/jobs                  // List all jobs
POST   /api/jobs                  // Create job
GET    /api/jobs/:id              // Single job
POST   /api/jobs/:id/items        // Add items to job

// Timesheets
GET    /api/timesheets            // List entries
POST   /api/timesheets/clock-in   // Clock in
POST   /api/timesheets/clock-out  // Clock out

// Real-time (Socket.io)
WS     /socket.io                 // WebSocket connection
```

### Authentication

NeonOS uses JWT tokens stored in localStorage:

```typescript
// Token stored after Google OAuth
localStorage.getItem('neonos-token')

// All API requests include:
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## 🧩 Notion Integration

### Setup

1. **Create Notion Integration:**
   - Visit https://notion.so/my-integrations
   - Click "+ New integration"
   - Name: "NeonOS Integration"
   - Copy the Internal Integration Token

2. **Share Databases:**
   - Open each database in Notion
   - Click "..." → "Add connections"
   - Select "NeonOS Integration"

3. **Configure Zapier (Option A - Quick):**
   - Create 4 Zaps using prompts in `/docs/zapier-setup.md`
   - Map Notion properties to NeonOS fields
   - Test webhooks

4. **Configure Backend Sync (Option B - Advanced):**
   - Set `NOTION_API_KEY` in backend
   - Set database IDs in environment
   - Run sync: `POST /api/notion/sync/full`

### Database Mapping

**Main Inventory:**
```
Notion Property    → NeonOS Field
─────────────────────────────────
SKU                → sku
Name               → name
Quantity           → quantity
Location           → location
Category           → category
Min Stock          → minStock
Rental Rate        → rentalRate
```

**KG3 All Jobs:**
```
Notion Property    → NeonOS Field
─────────────────────────────────
Job Name           → name
Client             → customer
Type               → type
Status             → status
Start Date         → startDate
End Date           → endDate
Venue              → venue
Project Value      → projectValue
```

---

## 📱 Progressive Web App

### Installation

**iOS (iPhone/iPad):**
1. Open NeonOS in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

**Android:**
1. Open NeonOS in Chrome
2. Tap menu (⋮)
3. Tap "Install app" or "Add to Home Screen"
4. Tap "Install"

**Desktop (Chrome/Edge):**
1. Open NeonOS
2. Click install icon (⊕) in address bar
3. Click "Install"

### Offline Mode

NeonOS caches static assets for offline use:
- App shell and UI
- Recent inventory data
- Recent jobs data
- User preferences

**Note:** Real-time updates and API calls require internet connection.

---

## 🏗️ Tech Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.3** - Type safety
- **Vite 5.0** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first styling
- **Lucide React** - Icon library
- **@zxing/browser** - Barcode scanning
- **Socket.io-client** - Real-time updates
- **React Router** - Client-side routing
- **date-fns** - Date utilities

### Backend (separate repo)
- **Node.js 18+** - Runtime
- **Express 4** - Web framework
- **Prisma 5** - ORM and migrations
- **PostgreSQL 15** - Database
- **Passport.js** - OAuth authentication
- **Socket.io** - WebSocket server
- **Winston** - Logging

### Infrastructure
- **Railway** - Backend hosting + PostgreSQL
- **Render** - Frontend hosting
- **Cloudflare** - DNS and CDN
- **Zapier** - Workflow automation (optional)

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# E2E tests (coming soon)
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Manual Testing Checklist

```
Core Flows:
□ Login with Google OAuth
□ View inventory list
□ Search and filter items
□ Create new inventory item
□ Update item quantity
□ Scan barcode (camera and USB)
□ Create rental job
□ Add items to job
□ Generate pull list
□ Complete pull list
□ Clock in
□ Clock out
□ View timesheets
□ Export timesheet CSV
□ Update settings
□ Test on mobile device
□ Install as PWA
□ Test offline mode
```

---

## 🐛 Troubleshooting

### Common Issues

**"Failed to fetch" on API calls**
- Check `VITE_API_URL` in `.env.local`
- Verify backend is running
- Check CORS settings in backend

**Google OAuth not working**
- Verify `GOOGLE_CLIENT_ID` is correct
- Check authorized redirect URIs in Google Console
- Ensure callback URL matches exactly

**Camera scanner won't open**
- Browser must be served over HTTPS (or localhost)
- Grant camera permissions when prompted
- Try different browser (Chrome recommended)

**Real-time updates not working**
- Check Socket.io connection in browser console
- Verify WebSocket port open (default: 3000)
- Check firewall/proxy settings

**PWA won't install**
- Must be served over HTTPS
- Check manifest.json is valid
- Ensure service worker registered
- Try hard refresh (Ctrl+Shift+R)

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('debug', 'neonos:*')

// Reload page
location.reload()
```

### Getting Help

1. **Check console** - Press F12, look for errors
2. **Check network** - F12 → Network tab, look for failed requests
3. **Clear cache** - Ctrl+Shift+Delete, clear all
4. **Try incognito** - Rules out extension conflicts
5. **File issue** - [GitHub Issues](https://github.com/kg3/neonos-v2/issues)

---

## 🚢 Deployment

### Production Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output in dist/ directory
ls dist/
```

### Deploy to Render

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/neonos-v2.git
   git push -u origin main
   ```

2. **Create Render Service:**
   - Go to https://render.com
   - New → Static Site
   - Connect repository
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`

3. **Set Environment Variables:**
   - `VITE_API_URL` = your backend URL
   - `VITE_GOOGLE_CLIENT_ID` = your Google OAuth client ID

4. **Deploy!**
   - Render auto-deploys on git push

### Deploy to Vercel (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Follow prompts
# Set environment variables when asked
```

### Custom Domain

**Render:**
1. Settings → Custom Domains
2. Add: `neonos.kg3.io`
3. Add DNS records as shown

**DNS (Cloudflare/GoDaddy):**
```
Type: CNAME
Name: neonos (or @)
Value: your-app.onrender.com
TTL: Auto
```

---

## 📊 Performance

### Lighthouse Scores (Target)

- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 90+
- **PWA:** ✅ Installable

### Bundle Size

```
Dist output:
├── index.html              2 KB
├── assets/
│   ├── index-[hash].js   450 KB (115 KB gzipped)
│   ├── index-[hash].css   80 KB (12 KB gzipped)
│   └── vendor-[hash].js  250 KB (65 KB gzipped)
└── icons/                  50 KB

Total: ~780 KB raw, ~190 KB gzipped
```

### Optimization Tips

1. **Code Splitting:**
   - Routes loaded on-demand
   - Heavy components lazy-loaded

2. **Image Optimization:**
   - Use WebP format
   - Lazy load images
   - Compress with TinyPNG

3. **Caching:**
   - Service worker caches assets
   - API responses cached 5 minutes
   - Static assets: 1 year cache

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

### Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Airbnb config
- **Prettier** - Consistent formatting
- **Tailwind** - Utility-first CSS

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

---

## 📜 License

**Proprietary - KG3 LLC**

Copyright © 2026 KG3 LLC. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this software, via any medium, is strictly prohibited.

---

## 👥 Team

**Built by:**
- Kenny Graham - Owner, Lead Developer
- Zach Freeman - Warehouse Manager, Product Testing
- KG3 Team - Feature Feedback & Testing

**Powered by:**
- Claude (Anthropic) - AI Development Assistant
- Ralph Loop - Automated Code Generation

---

## 🙏 Acknowledgments

- **Anthropic** - Claude AI for development assistance
- **React Team** - Amazing framework
- **Tailwind Labs** - Beautiful utility CSS
- **Vercel** - Vite bundler and tooling
- **Notion** - Integration and workflow automation
- **Google** - OAuth authentication

---

## 📞 Support

**For KG3 Team:**
- **Internal Slack:** #neonos-support`
- **Developer:** Kenny Graham

**Technical Issues:**
- **GitHub Issues:** [Report Bug](https://github.com/kg3/neonos-v2/issues)
- **Email:** support@kg3.io (coming soon)

---

## 🗺️ Roadmap

### ✅ Completed (v2.0)
- Core inventory management
- Job tracking and calendar
- Time clock with timesheets
- Barcode scanning (USB + Camera)
- Pull list generation
- Controller builder
- PWA with offline mode
- Mobile-responsive UI
- Real-time collaboration
- Notion integration

### 🚧 In Progress (v2.1)
- Advanced reporting and analytics
- Barcode label printing
- Inventory forecasting
- Auto-reorder alerts
- Advanced search filters
- Bulk import/export improvements

### 🔮 Planned (v2.2+)
- Mobile native apps (iOS/Android)
- QR code check-in/out at venues
- Photo documentation
- Maintenance scheduling
- Equipment calibration tracking
- Client portal
- Invoicing integration (QuickBooks)
- Multi-warehouse support
- Advanced permissions (custom roles)
- API webhooks for third-party integrations

---

## 📈 Version History

### v2.0.0 (January 2026) - Production Launch
- Complete rewrite in React + TypeScript
- Modern UI with cyber-industrial design
- PWA support
- Camera barcode scanning
- Real-time collaboration via Socket.io
- Notion bidirectional sync
- Mobile-first responsive design
- Google OAuth authentication
- Role-based permissions

### v1.0.0 (2024) - Legacy System
- Initial Notion-based system
- Manual processes
- Spreadsheet tracking
- Basic inventory management

---

## 🎯 Project Goals

**Mission:** Streamline warehouse operations for KG3 LLC, eliminating manual processes and providing real-time visibility into inventory, jobs, and team productivity.

**Vision:** Become the industry standard for entertainment lighting warehouse management, expanding to other companies and touring productions.

**Values:**
- **Speed** - Fast, responsive, reliable
- **Simplicity** - Easy for warehouse staff to use
- **Accuracy** - Real-time, trustworthy data
- **Collaboration** - Seamless team coordination
- **Innovation** - Continuously improving

---

## 📸 Screenshots

### Desktop Dashboard
![Dashboard](./docs/screenshots/dashboard.png)

### Inventory Management
![Inventory](./docs/screenshots/inventory.png)

### Mobile Scanner
![Scanner](./docs/screenshots/scanner-mobile.png)

### Job Calendar
![Jobs](./docs/screenshots/jobs.png)

### Controller Builder
![Builder](./docs/screenshots/builder.png)

---

**Built with ❤️ in Nashville, TN**

**NeonOS v2.0 - Modern Warehouse Management for Modern Productions** 🔵✨
