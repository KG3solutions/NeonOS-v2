# Zapier Copilot Prompts for Wire Diagram Studio v2

Copy and paste these prompts into Zapier's AI Copilot to quickly create your sync Zaps.

---

## Notion Database Setup

### Connected Database IDs (from MCP)

These are your actual Notion database IDs for API integration:

| Database | ID | Status |
|----------|-----|--------|
| Connector Templates | `240670c5-6475-80a7-bcc6-000ba54c56be` | ✅ Ready |
| Wire Diagrams | `240670c5-6475-8037-a43b-000be7af94ec` | ✅ Ready |
| KG3 All Jobs (Projects) | `21d670c5-6475-808b-8f3d-000b36fdf293` | ✅ Ready |

### Database 1: "Connector Templates Diagram Creator"
This is your master template database with blank connector images.
**ID:** `240670c5-6475-80a7-bcc6-000ba54c56be`

| Property Name | Type | Property ID | Purpose |
|---------------|------|-------------|---------|
| Name | Title | `title` | Connector name (e.g., "7-Pin Molex") |
| Female Image | Files | `n\Ir` | Blank female connector diagram image |
| Male Image | Files | `_IP]` | Blank male connector diagram image |
| Part Number (Female) | Text | `%3FuPq` | Female connector part number |
| Part Number (Male) | Text | `nZwG` | Male connector part number |
| Pinout JSON | Text | `Wh\`U` | JSON configuration for pin positions |
| App ID | Text | `QFfy` | Local app ID for sync |
| Pin Count | Number | `Fhw%3B` | Total number of pins |
| Category | Multi-select | `%3FU%5EM` | Tags like "Power", "LED", "Data" |
| Manufacturer | Select | `o%3DMQ` | Manufacturer name |
| Type | Select | `kj%40m` | Connector type (NL4, XLR, etc.) |
| Mount Type | Select | `NT%7B%40` | Cable Connector or Panel Mount |
| Last Synced | Date | `sBOn` | When last synced with app |

### Database 2: "Wire Diagrams" (Standards)
For your completed standard diagrams.
**ID:** `240670c5-6475-8037-a43b-000be7af94ec`

| Property Name | Type | Property ID | Purpose |
|---------------|------|-------------|---------|
| Name | Title | `title` | Diagram name |
| Diagram Data | Text | `s%40tc` | JSON diagram data |
| Connector Variant | Select | `%3FB%3D%60` | "Male" or "Female" |
| Connector Type | Select | `MDML` | Type of connector used |
| Pin Count | Number | `sHs%40` | Circle size for pins |
| App ID | Text | `dqDZ` | Local app ID for sync |
| Status | Status | `%60%3DUk` | Not started, In progress, Complete |
| Project | Relation | `riF~` | Link to KG3 All Jobs |
| Thumbnail | Files | `k%3EEk` | Diagram preview image |
| Exported PNG | Files | `nSp%3C` | Exported diagram image |
| Notes | Text | `%7BxnH` | Additional notes |
| Last Synced | Date | `d%3CJX` | When last synced |

### Database 3: "KG3 All Jobs" (Projects)
For project-specific diagrams. Wire Diagrams link to this.
**ID:** `21d670c5-6475-808b-8f3d-000b36fdf293`

| Property Name | Type | Purpose |
|---------------|------|---------|
| Project name | Title | Project/job name |
| Stage | Select | Pipeline, Active, Archived, Warehouse |
| Type | Select | Client Job, Warehouse, Internal |
| Client | Text | Client name |
| Priority | Select | High, Medium, Low |
| Due Date | Date | Project due date |
| Assignee | People | Who's assigned |

---

## Example Pinout JSON Format

Store this in the "Pinout JSON" property of your Connector Templates:

```json
{
  "pins": [
    {
      "pinLabel": "1",
      "x": 100,
      "y": 80,
      "defaultWireColor": "Red",
      "defaultWireColorHex": "#ff0000",
      "defaultFunctionLabel": "+24V DC"
    },
    {
      "pinLabel": "2",
      "x": 130,
      "y": 80,
      "defaultWireColor": "Black",
      "defaultWireColorHex": "#000000",
      "defaultFunctionLabel": "GND"
    },
    {
      "pinLabel": "3",
      "x": 160,
      "y": 80,
      "defaultWireColor": "Yellow",
      "defaultWireColorHex": "#ffff00",
      "defaultFunctionLabel": "Data"
    }
  ],
  "pinSize": 15,
  "displayOptions": {
    "showPinNumber": true,
    "showWireColor": false,
    "showLedColor": false
  }
}
```

---

## Zap 0: App → Notion (Update Template Pinout JSON)

This is the KEY Zap for defining pin positions. When you configure pins in the app, this sends the JSON back to Notion.

### Prompt:
```
Create a Zap that catches a webhook and updates the Pinout JSON property in my Notion "Connector Templates Diagram Creator" database.

Trigger: Webhooks by Zapier - Catch Hook

Filter: Only continue if "event" equals "template_loaded"

Action: Notion - Update Database Item
- Database: Connector Templates Diagram Creator
- Page ID: use "notionPageId" from webhook
- Update these fields:
  - Pinout JSON (text): use "data pinoutJson" from webhook
  - Pin Count (number): use "data pinCount" from webhook
  - Last Synced (date): current date/time

Webhook payload structure:
{
  "event": "template_loaded",
  "notionPageId": "notion-page-id",
  "data": {
    "name": "7-Pin Molex",
    "pinoutJson": "{\"pins\":[{\"pinLabel\":\"1\",\"x\":100,\"y\":80},...],\"pinSize\":15,...}",
    "pinCount": 7
  },
  "timestamp": "2026-01-12T..."
}

This Zap receives pin configurations created in the Wire Diagram Studio app and saves them back to your Notion template database.
```

---

## Zap 1: Load Connector Templates (Notion → App)

### Prompt:
```
Create a Zap that triggers when a database item is updated in my Notion "Connector Templates Diagram Creator" database, then sends the template data to my webhook server.

Trigger: Notion - Updated Database Item
- Database: Connector Templates Diagram Creator
- Trigger on any property change

Action: Webhooks by Zapier - POST
- URL: http://localhost:3001/api/webhook/notion
- Payload Type: JSON
- Data fields to send:
  - entityType: "template"
  - notionPageId: the Notion page ID
  - name: the "Name" property from Notion
  - femaleImageUrl: first file URL from "Female Image" property (if exists)
  - femalePartNumber: the "Part Number (Female)" property
  - maleImageUrl: first file URL from "Male Image" property (if exists)
  - malePartNumber: the "Part Number (Male)" property
  - pinoutJson: the "Pinout JSON" property (raw text)
  - category: the "Category" property (as comma-separated string)
  - manufacturer: the "Manufacturer" property
  - pinCount: the "Pin Count" property
  - updatedAt: the "Last edited time" from Notion
  - isDeleted: false

The receiving server expects this JSON structure:
{
  "entityType": "template",
  "notionPageId": "notion-page-id",
  "name": "7-Pin Molex",
  "femaleImageUrl": "https://...",
  "femalePartNumber": "MLX-F-7",
  "maleImageUrl": "https://...",
  "malePartNumber": "MLX-M-7",
  "pinoutJson": "{\"pins\":[...],\"pinSize\":15,...}",
  "category": "Power,LED",
  "manufacturer": "Molex",
  "pinCount": 7,
  "updatedAt": "2026-01-12T...",
  "isDeleted": false
}
```

---

## Zap 2: App → Notion (Create/Update Standards)

### Prompt:
```
Create a Zap that catches a webhook and creates or updates an item in my Notion "Wire Diagrams" database.

Use Paths to handle two scenarios:

Path A - Update existing (when notionPageId exists):
- Filter: notionPageId exists and is not empty
- Action: Update Database Item in Notion
- Page ID: use notionPageId from webhook
- Update these fields:
  - Name (title): use "data name" from webhook
  - Connector (text): use "data connectorLabel" from webhook
  - Template ID (text): use "data templateId" from webhook
  - Variant (select): use "data connectorVariant" from webhook
  - Pins JSON (text): stringify "data pins" from webhook
  - Pin Size (number): use "data pinSize" from webhook
  - Display Options (text): stringify "data displayOptions" from webhook
  - Image URL (url): use "data imageUrl" from webhook
  - Last Synced (date): current date/time

Path B - Create new (when notionPageId is empty):
- Filter: notionPageId does not exist or is empty
- Action: Create Database Item in Notion
- Set all fields above plus:
  - App ID (text): use "appId" from webhook

Webhook payload structure:
{
  "event": "standard_created" or "standard_updated",
  "appId": "unique-app-id",
  "notionPageId": "notion-page-id-if-updating" or null,
  "data": {
    "name": "24V Motor Controller",
    "connectorLabel": "7-Pin Molex",
    "templateId": "template-id",
    "connectorVariant": "female",
    "imageUrl": "https://...",
    "pins": [{
      "id": "pin-id",
      "pinLabel": "1",
      "functionLabel": "+24V DC",
      "wireName": "Power +",
      "wireColor": "Red",
      "wireColorHex": "#ff0000",
      "ledFunctionColor": "V+",
      "ledFunctionHex": "#ff0000",
      "cableToUse": "18AWG",
      "notes": "Fused at 10A",
      "sortOrder": 0,
      "x": 100,
      "y": 80,
      "textColor": "#ffffff"
    }],
    "pinSize": 15,
    "displayOptions": {
      "showPinNumber": true,
      "showWireColor": false,
      "showLedColor": false
    }
  },
  "timestamp": "2026-01-12T..."
}
```

---

## Zap 3: Notion → App (Sync Standard Changes Back)

### Prompt:
```
Create a Zap that triggers when a database item is updated in my Notion "Wire Diagrams" database, then sends a POST request to my webhook server.

Trigger: Notion - Updated Database Item
- Database: Wire Diagrams
- Trigger on any property change

Action: Webhooks by Zapier - POST
- URL: http://localhost:3001/api/webhook/notion
- Payload Type: JSON
- Data fields to send:
  - entityType: "standard"
  - notionPageId: the Notion page ID
  - appId: the "App ID" property from Notion
  - name: the "Name" property from Notion
  - connectorLabel: the "Connector" property from Notion
  - templateId: the "Template ID" property from Notion
  - connectorVariant: the "Variant" property from Notion (lowercase)
  - imageUrl: the "Image URL" property from Notion
  - pinsJson: the "Pins JSON" property from Notion
  - pinSize: the "Pin Size" property from Notion
  - displayOptionsJson: the "Display Options" property from Notion
  - updatedAt: the "Last edited time" from Notion
  - isDeleted: false

The receiving server expects this JSON structure:
{
  "entityType": "standard",
  "notionPageId": "notion-page-id",
  "appId": "app-id-if-exists",
  "name": "24V Motor Controller",
  "connectorLabel": "7-Pin Molex",
  "templateId": "template-id",
  "connectorVariant": "female",
  "imageUrl": "https://...",
  "pinsJson": "[{...}]",
  "pinSize": 15,
  "displayOptionsJson": "{...}",
  "updatedAt": "2026-01-12T...",
  "isDeleted": false
}
```

---

## Zap 4: App → Notion (Create/Update Projects)

### Prompt:
```
Create a Zap that catches a webhook and creates or updates an item in my Notion "Wire Diagram Projects" database.

Use Paths to handle two scenarios:

Path A - Update existing (when notionPageId exists):
- Filter: notionPageId exists and is not empty
- Action: Update Database Item in Notion
- Page ID: use notionPageId from webhook
- Update these fields:
  - Name (title): use "data name" from webhook
  - Connector (text): use "data connectorLabel" from webhook
  - Project Name (text): use "data projectName" from webhook
  - Location (text): use "data location" from webhook
  - Variant (select): use "data connectorVariant" from webhook
  - Pins JSON (text): stringify "data pins" from webhook
  - Last Synced (date): current date/time

Path B - Create new (when notionPageId is empty):
- Filter: notionPageId does not exist or is empty
- Action: Create Database Item in Notion
- Set all fields above plus:
  - App ID (text): use "appId" from webhook
  - Standard ID (text): use "standardId" from webhook

Webhook payload structure:
{
  "event": "project_created" or "project_updated",
  "appId": "unique-app-id",
  "notionPageId": "notion-page-id-if-updating" or null,
  "standardId": "parent-standard-id",
  "data": {
    "name": "Hilton Lobby Fountain Motor",
    "connectorLabel": "7-Pin Molex",
    "projectName": "Hilton Lobby Fountain",
    "location": "Building A, Panel 3",
    "connectorVariant": "female",
    "pins": [{...}]
  },
  "timestamp": "2026-01-12T..."
}
```

---

## Zap 5: Notion → App (Sync Project Changes Back)

### Prompt:
```
Create a Zap that triggers when a database item is updated in my Notion "Wire Diagram Projects" database, then sends a POST request to my webhook server.

Trigger: Notion - Updated Database Item
- Database: Wire Diagram Projects
- Trigger on any property change

Action: Webhooks by Zapier - POST
- URL: http://localhost:3001/api/webhook/notion
- Payload Type: JSON
- Data fields to send:
  - entityType: "project"
  - notionPageId: the Notion page ID
  - appId: the "App ID" property from Notion
  - name: the "Name" property from Notion
  - connectorLabel: the "Connector" property from Notion
  - standardId: the "Standard ID" property from Notion
  - projectName: the "Project Name" property from Notion
  - location: the "Location" property from Notion
  - connectorVariant: the "Variant" property from Notion (lowercase)
  - pinsJson: the "Pins JSON" property from Notion
  - updatedAt: the "Last edited time" from Notion
  - isDeleted: false

The receiving server expects this JSON structure:
{
  "entityType": "project",
  "notionPageId": "notion-page-id",
  "appId": "app-id-if-exists",
  "name": "Hilton Lobby Fountain Motor",
  "connectorLabel": "7-Pin Molex",
  "standardId": "parent-standard-id",
  "projectName": "Hilton Lobby Fountain",
  "location": "Building A, Panel 3",
  "connectorVariant": "female",
  "pinsJson": "[{...}]",
  "updatedAt": "2026-01-12T...",
  "isDeleted": false
}
```

---

## Quick Setup Checklist

After creating your Zaps, verify:

- [ ] Zap 0 is ON (Pinout JSON: App → Notion) **REQUIRED for pin configuration**
- [ ] Zap 1 is ON (Templates: Notion → App)
- [ ] Zap 2 is ON (Standards: App → Notion)
- [ ] Zap 3 is ON (Standards: Notion → App)
- [ ] Zap 4 is ON (Projects: App → Notion)
- [ ] Zap 5 is ON (Projects: Notion → App)
- [ ] All three Notion databases exist with correct properties
- [ ] Webhook URL is saved in Wire Diagram Studio Settings
- [ ] Webhook server is running (`npm run server` or `npm run dev:full`)

---

## Creating Pinout JSON for New Templates (IN-APP METHOD - RECOMMENDED)

The app now includes a built-in pinout editor. Here's the workflow:

### Step 1: Add Template to Notion (Images Only)
1. Create a new entry in "Connector Templates Diagram Creator"
2. Add the connector name
3. Upload Male and/or Female blank connector images
4. Leave "Pinout JSON" empty - the app will fill this in!

### Step 2: Configure Pins in the App
1. Open Wire Diagram Studio
2. Go to Templates tab
3. Templates without pinout JSON will show with a **red dashed border**
4. Click on the unconfigured template
5. The Pinout Editor opens

### Step 3: Define Pin Positions
1. Click on the connector image to place pins
2. Pins are numbered automatically (1, 2, 3...)
3. Adjust pin labels if needed (e.g., "A", "B", "GND")
4. Use the slider to adjust pin circle size
5. Reposition pins by clicking the ↻ button

### Step 4: Save & Sync
1. Click "Save & Sync to Notion" - JSON is sent to Notion via Zap 0
2. Click "Download JSON" to save a local backup file
3. The template now shows in the "Available Templates" section

### Pin Position Tips:
- Click directly on the pin locations in the image
- Use larger pin sizes for easier visibility on mobile
- Test different pin sizes to find what looks best

---

## Testing Prompts

### Test Template Sync:
```
Test my template sync Zap by editing a template in the "Connector Templates Diagram Creator" database and verify the webhook is sent to http://localhost:3001/api/webhook/notion with entityType: "template".
```

### Test Standard Sync (App → Notion):
```
Test my webhook Zap by sending this sample data:

{
  "event": "standard_created",
  "appId": "test-123",
  "data": {
    "name": "Test Standard",
    "connectorLabel": "Test Connector",
    "connectorVariant": "female",
    "pins": [
      {
        "id": "pin-1",
        "pinLabel": "1",
        "functionLabel": "+24V",
        "wireName": "Power +",
        "wireColor": "Red",
        "wireColorHex": "#ff0000",
        "sortOrder": 0,
        "x": 100,
        "y": 80
      }
    ],
    "pinSize": 15,
    "displayOptions": {
      "showPinNumber": true,
      "showWireColor": false,
      "showLedColor": false
    }
  },
  "timestamp": "2026-01-12T00:00:00Z"
}
```

### Test Standard Sync (Notion → App):
```
Test my Notion trigger Zap by editing a record in the Wire Diagrams database and verify the webhook is sent to http://localhost:3001/api/webhook/notion with the correct JSON payload including entityType: "standard".
```

---

## Troubleshooting Prompts

### If templates aren't loading:
```
Debug my template Zap. Check:
- Is the trigger connected to "Connector Templates Diagram Creator"?
- Are the Files properties (Female Image, Male Image) correctly mapped?
- Is pinoutJson being sent as raw text, not parsed JSON?
```

### If standards aren't syncing:
```
Debug my standard sync Zap. Verify:
- The trigger database is correct
- All field mappings match property names exactly
- JSON fields (pinsJson, displayOptionsJson) are passed as strings
- entityType is correctly set to "standard"
```

### If images aren't appearing:
```
Check your Notion Files properties:
- Ensure images are uploaded to Notion (not just linked)
- Verify the Zap is extracting the first file URL
- Check CORS settings if using external image URLs
```

---

## Production Deployment Notes

For production:

1. **Deploy webhook server** to Railway, Render, or Fly.io
2. **Update all Zap URLs** from localhost:3001 to your deployed URL
3. **Add authentication** to webhook endpoints (API key recommended)
4. **Use environment variables** for webhook URLs in the app
5. **Consider rate limiting** on incoming webhooks
