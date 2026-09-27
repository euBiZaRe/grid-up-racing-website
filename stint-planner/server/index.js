import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Connected WebSocket clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('[WebSocket] Client connected. Total:', clients.size);

  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    source: 'GRiD UP Race Telemetry Gateway',
    timestamp: Date.now()
  }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[WebSocket] Client disconnected. Total:', clients.size);
  });
});

function broadcast(event) {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'GRiD UP Live Stint Planner API',
    version: '1.0.0',
    clients: clients.size,
    timestamp: Date.now()
  });
});

// Telemetry webhook endpoint for local iRacing apps / bridge
app.post('/api/telemetry/sample', (req, res) => {
  const sample = req.body;
  if (!sample || !sample.carNumber) {
    return res.status(400).json({ error: 'Invalid telemetry payload' });
  }

  // Broadcast to all active dashboards
  broadcast({
    type: 'TELEMETRY_SAMPLE',
    data: sample,
    timestamp: Date.now()
  });

  res.json({ success: true, processed: true });
});

// Garage 61 Secure Server Proxy
app.get('/api/garage61/sessions', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Garage 61 token' });
  }

  try {
    const response = await fetch('https://garage61.net/api/v1/sessions', {
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'GRiD-UP-Live-Stint-Planner/1.0'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to contact Garage 61 API', details: err.message });
  }
});

server.listen(port, () => {
  console.log(`[GRiD UP Stint Server] Listening on http://localhost:${port}`);
});
