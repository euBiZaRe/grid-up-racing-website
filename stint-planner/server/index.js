import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;
// Bind to loopback only by default so the gateway is not reachable from the network.
const host = process.env.HOST || '127.0.0.1';
// Optional shared secret. When set, the telemetry webhook and WebSocket require it.
const DASH_TOKEN = process.env.DASH_TOKEN || '';

const ALLOWED_ORIGINS = new Set([
  'https://gridup.online',
  'https://www.gridup.online',
  'https://eubizare.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  ...(process.env.EXTRA_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
]);

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function hasValidToken(req) {
  if (!DASH_TOKEN) return true;
  const header = req.headers.authorization || '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  return supplied !== '' && safeEqual(supplied, DASH_TOKEN);
}

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    // Non-browser clients (the local bridge) send no Origin header.
    if (!origin || ALLOWED_ORIGINS.has(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100kb', type: 'application/json' }));

const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  maxPayload: 64 * 1024,
  verifyClient: ({ origin, req }) => {
    if (origin && !ALLOWED_ORIGINS.has(origin)) return false;
    if (DASH_TOKEN) {
      try {
        const url = new URL(req.url, 'http://localhost');
        const supplied = url.searchParams.get('token') || '';
        if (!supplied || !safeEqual(supplied, DASH_TOKEN)) return false;
      } catch (_) {
        return false;
      }
    }
    return true;
  }
});

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
  if (!hasValidToken(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sample = req.body;
  if (!sample || typeof sample !== 'object' || Array.isArray(sample) || !sample.carNumber
      || String(sample.carNumber).length > 16) {
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
  if (!authHeader || authHeader.length > 512 || /[\r\n]/.test(authHeader)) {
    return res.status(401).json({ error: 'Missing Garage 61 token' });
  }

  try {
    const response = await fetch('https://garage61.net/api/v1/sessions', {
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'GRiD-UP-Live-Stint-Planner/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    const data = await response.json();
    res.status(response.ok ? 200 : response.status).json(data);
  } catch (err) {
    console.error('[Garage61 proxy]', err);
    res.status(502).json({ error: 'Failed to contact Garage 61 API' });
  }
});

// Never leak internal error details to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err && err.message === 'Origin not allowed' ? 403 : 400;
  res.status(status).json({ error: status === 403 ? 'Forbidden' : 'Bad request' });
});

server.listen(port, host, () => {
  console.log(`[GRiD UP Stint Server] Listening on http://${host}:${port}`);
});
