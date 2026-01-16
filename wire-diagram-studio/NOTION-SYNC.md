# Notion Sync Setup Guide

This guide explains how to set up two-way sync between Wire Diagram Studio and your Notion "Wire Diagrams" database using Zapier.

## Overview

The sync architecture uses two Zapier "Zaps":

1. **App → Notion**: When you create/edit/delete a standard in the app, it syncs to Notion
2. **Notion → App**: When you edit a record in Notion, it syncs back to the app

## Prerequisites

1. A [Zapier account](https://zapier.com) (free tier works for testing)
2. A Notion workspace with access to integrations
3. Wire Diagram Studio running locally or deployed

---

## Step 1: Create Your Notion Database

Create a new database in Notion with these properties:

| Property Name | Type | Purpose |
|---------------|------|---------|
| Name | Title | Diagram name |
| Connector | Text | Connector label |
| Pins JSON | Text | JSON array of pin data |
| App ID | Text | Links to app's internal ID |
| Last Synced | Date | When last synced |

### Example Pins JSON format:
```json
[
  {
    "pinLabel": "1",
    "functionLabel": "+24V DC",
    "wireName": "Power +",
    "wireColor": "Red",
    "wireColorHex": "#dc2626",
    "notes": "Fused at 10A",
    "sortOrder": 0
  },
  {
    "pinLabel": "2",
    "functionLabel": "GND",
    "wireName": "Power -",
    "wireColor": "Black",
    "wireColorHex": "#1a1a1a",
    "notes": "",
    "sortOrder": 1
  }
]
```

---

## Step 2: Create Zap 1 (App → Notion)

This Zap sends changes from the app to Notion.

### Trigger Setup
1. Create a new Zap in Zapier
2. **Trigger App**: Webhooks by Zapier
3. **Trigger Event**: Catch Hook
4. Click **Continue** and copy the webhook URL
5. Paste this URL in Wire Diagram Studio: **Settings → Notion Sync → Zapier Webhook URL**
6. Save a standard in the app to send a test webhook
7. Click **Test trigger** in Zapier to see the test data

### Action Setup (Create or Update in Notion)

#### Option A: Simple - Always Create New
1. **Action App**: Notion
2. **Action Event**: Create Database Item
3. **Database**: Select your Wire Diagrams database
4. Map fields:
   - **Name**: `data name`
   - **Connector**: `data connectorLabel`
   - **Pins JSON**: `data pins` (Zapier will stringify it)
   - **App ID**: `appId`
   - **Last Synced**: Use current timestamp

#### Option B: Advanced - Update Existing
For true two-way sync (update existing records):

1. Add a **Filter** step between trigger and action:
   - Only continue if `notionPageId` exists AND is not empty

2. **Action 1**: Update Database Item (when notionPageId exists)
   - **Page**: `notionPageId`
   - Map the fields as above

3. Add a **Path** to create new items when `notionPageId` is empty

---

## Step 3: Create Zap 2 (Notion → App)

This Zap sends changes from Notion back to the app.

### Trigger Setup
1. Create another new Zap
2. **Trigger App**: Notion
3. **Trigger Event**: Updated Database Item
4. **Database**: Select your Wire Diagrams database
5. Test to see available fields

### Action Setup
1. **Action App**: Webhooks by Zapier
2. **Action Event**: POST
3. **URL**: `http://localhost:3001/api/webhook/notion`
   - For production, use your deployed server URL
4. **Payload Type**: JSON
5. **Data** (map from Notion fields):

```json
{
  "notionPageId": "{{ID}}",
  "appId": "{{App ID}}",
  "name": "{{Name}}",
  "connectorLabel": "{{Connector}}",
  "pinsJson": "{{Pins JSON}}",
  "updatedAt": "{{Last edited time}}",
  "isDeleted": false
}
```

Replace `{{field}}` with Zapier's field picker for your Notion properties.

---

## Step 4: Start the Webhook Server

The app needs a webhook server running to receive incoming updates:

```bash
cd wire-diagram-studio

# Run both frontend and webhook server
npm run dev:full

# Or run them separately:
npm run dev      # Frontend on port 5173
npm run server   # Webhook server on port 3001
```

---

## Step 5: Enable Sync in the App

1. Open Wire Diagram Studio
2. Go to **Settings** tab
3. Under **Notion Sync**:
   - Toggle sync **Enabled**
   - Paste your Zapier webhook URL (from Zap 1)
   - Save
4. Toggle **Auto-sync when saving standards** as desired

---

## Testing the Sync

### Test App → Notion
1. Create or edit a standard in the app
2. Save it
3. Check your Notion database - new/updated record should appear
4. Check Zapier task history for any errors

### Test Notion → App
1. Edit a record in your Notion database
2. Wait ~30 seconds (Zapier polling interval + app polling)
3. Check the app - the standard should be updated
4. Check server console for incoming webhook logs

---

## Troubleshooting

### Changes not syncing to Notion
- Verify the webhook URL is correct in Settings
- Check Zapier task history for errors
- Ensure sync is enabled and "Auto-sync on save" is on

### Changes not syncing from Notion
- Make sure the webhook server is running (`npm run server`)
- Check the server console for incoming requests
- Verify the Zap is turned on
- Check Zapier task history

### Duplicate records appearing
- Make sure you're using the App ID field to link records
- Consider using Zapier's "Update or Create" pattern

### Data format issues
- Pins must be valid JSON in Notion
- Check that all required fields are mapped

---

## Production Deployment

For production use:

1. **Deploy the webhook server** to a hosting service:
   - Railway, Render, Fly.io, or your server
   - Update Zap 2's URL to your deployed webhook endpoint

2. **Deploy the frontend** to a static host:
   - Vercel, Netlify, Cloudflare Pages
   - Run `npm run build` and deploy the `dist` folder

3. **Use environment variables** for webhook URLs

4. **Consider using a database** instead of in-memory storage for the webhook queue (Redis, PostgreSQL)

---

## Notion Database Template

You can duplicate this template to get started:

```
Wire Diagrams Database
├── Name (Title) - "24V DC Motor Controller"
├── Connector (Text) - "7-Pin Molex"
├── Pins JSON (Text) - "[{...}]"
├── App ID (Text) - "abc123-def456"
└── Last Synced (Date) - "Jan 12, 2026"
```

---

## Security Notes

- The webhook server accepts unauthenticated requests
- For production, add authentication (API key, JWT, etc.)
- Consider rate limiting the incoming webhook endpoint
- The App ID links records - keep it unique per diagram
