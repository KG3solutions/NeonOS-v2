/**
 * Webhook Server for Wire Diagram Studio
 *
 * This server receives webhooks from Zapier when Notion records change.
 * It stores pending updates that the client app polls for.
 *
 * Run with: npx tsx server/webhook-server.ts
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Store pending webhook payloads (in-memory for MVP)
// In production, use Redis or a database
interface PendingUpdate {
  id: string;
  payload: any;
  timestamp: number;
  processed: boolean;
}

const pendingUpdates: PendingUpdate[] = [];
const MAX_PENDING = 100;
const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Receive webhook from Zapier (Notion → App)
app.post('/api/webhook/notion', (req, res) => {
  try {
    const payload = req.body;

    // Validate required field
    if (!payload.notionPageId) {
      return res.status(400).json({ error: 'Missing notionPageId' });
    }

    // Create pending update
    const update: PendingUpdate = {
      id: crypto.randomUUID(),
      payload,
      timestamp: Date.now(),
      processed: false
    };

    pendingUpdates.push(update);

    // Cleanup old updates
    cleanupOldUpdates();

    console.log(`[${new Date().toISOString()}] Received webhook from Notion:`, {
      notionPageId: payload.notionPageId,
      name: payload.name,
      isDeleted: payload.isDeleted
    });

    res.json({
      success: true,
      updateId: update.id,
      message: 'Update queued for processing'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Client polls for pending updates
app.get('/api/webhook/pending', (req, res) => {
  const unprocessed = pendingUpdates.filter(u => !u.processed);
  res.json({
    count: unprocessed.length,
    updates: unprocessed.map(u => ({
      id: u.id,
      payload: u.payload,
      timestamp: u.timestamp
    }))
  });
});

// Client marks updates as processed
app.post('/api/webhook/ack', (req, res) => {
  const { updateIds } = req.body;

  if (!Array.isArray(updateIds)) {
    return res.status(400).json({ error: 'updateIds must be an array' });
  }

  let acknowledged = 0;
  for (const id of updateIds) {
    const update = pendingUpdates.find(u => u.id === id);
    if (update) {
      update.processed = true;
      acknowledged++;
    }
  }

  res.json({ acknowledged });
});

// Cleanup old updates
function cleanupOldUpdates() {
  const cutoff = Date.now() - RETENTION_MS;

  // Remove old processed updates
  for (let i = pendingUpdates.length - 1; i >= 0; i--) {
    if (pendingUpdates[i].timestamp < cutoff || pendingUpdates[i].processed) {
      if (pendingUpdates[i].processed || pendingUpdates[i].timestamp < cutoff) {
        pendingUpdates.splice(i, 1);
      }
    }
  }

  // Trim to max size
  while (pendingUpdates.length > MAX_PENDING) {
    pendingUpdates.shift();
  }
}

app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/api/webhook/notion`);
});
