import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fetch from 'node-fetch';
import { WebSocketServer } from 'ws';
import http from 'http';
import FormData from 'form-data';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const upload = multer();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_REALTIME_API_KEY = process.env.OPENAI_REALTIME_API_KEY || OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Chat, transcription, and TTS will fail.');
}
if (!process.env.OPENAI_REALTIME_API_KEY && OPENAI_API_KEY) {
  console.warn('Info: OPENAI_REALTIME_API_KEY not set; realtime will use OPENAI_API_KEY.');
}

// Proxy OpenAI Chat Completions (for text agent)
app.post('/api/openai-chat', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY missing' });
    const { messages = [], model = process.env.OPENAI_CHAT_MODEL || 'gpt-5-mini-2025-08-07' } = req.body || {};

    const payload: any = { model, messages };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'OpenAI chat proxy error' });
  }
});

// Proxy transcription to OpenAI Whisper
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY missing' });
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Missing audio file' });

    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname || 'audio.webm',
      contentType: file.mimetype || 'audio/webm'
    });
    form.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        // Let form-data set the correct multipart boundary header
        ...form.getHeaders(),
      } as any,
      body: form as any
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Transcription proxy error' });
  }
});

// Proxy TTS to OpenAI
app.post('/api/tts', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY missing' });
    const { text, voice = 'alloy', model = 'tts-1', format = 'mp3' } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, input: text, voice, response_format: format })
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).send(errBody);
    }

    const buf = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', `audio/${format}`);
    res.send(buf);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'TTS proxy error' });
  }
});

// Proxy to Python Agent API (moved before server.listen)
app.post('/api/agent', async (req, res) => {
  try {
    const response = await fetch('http://localhost:8002/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (err: any) {
    console.error('Agent proxy error:', err);
    res.status(500).json({ error: err.message || 'Agent proxy error' });
  }
});

// Proxy to create Realtime ephemeral client secret for Voice/Agents SDK
app.post('/api/realtime/client_secret', async (req, res) => {
  try {
    if (!OPENAI_REALTIME_API_KEY) return res.status(500).json({ error: 'OPENAI_REALTIME_API_KEY missing' });

    const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-10-01';

    const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_REALTIME_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
        'Content-Type': 'application/json'
      } as any,
      body: JSON.stringify({
        model,
        voice: 'alloy'
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json(data);
    }

    res.json(data);
  } catch (err: any) {
    console.error('Realtime client_secret error:', err);
    res.status(500).json({ error: 'Failed to create client secret' });
  }
});

// Create HTTP server and WS proxy for OpenAI Realtime
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/realtime' });

wss.on('connection', async (client) => {
  if (!OPENAI_REALTIME_API_KEY) {
    client.close(1011, 'OPENAI_REALTIME_API_KEY missing');
    return;
  }

  // Track connection readiness and buffer outbound messages from client
  let upstreamOpen = false;
  const pending: Array<string | Buffer | ArrayBuffer | Buffer[]> = [];

  const upstream = new (await import('ws')).WebSocket(
    `wss://api.openai.com/v1/realtime?model=${process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview'}`,
    {
      headers: {
        Authorization: `Bearer ${OPENAI_REALTIME_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    }
  );

  upstream.on('open', () => {
    upstreamOpen = true;
    // Flush any messages that arrived from the browser while upstream was connecting
    for (const msg of pending) {
      try { upstream.send(msg as any); } catch (e) { /* noop */ }
    }
    pending.length = 0;
  });

  upstream.on('message', (data) => {
    try { client.send(data); } catch { /* noop */ }
  });

  upstream.on('close', (code, reason) => {
    upstreamOpen = false;
    try { client.close(code, reason.toString()); } catch { /* noop */ }
  });

  upstream.on('error', (err) => {
    upstreamOpen = false;
    try { client.close(1011, (err as any).message || 'Upstream error'); } catch { /* noop */ }
  });

  client.on('message', (msg) => {
    // If upstream not yet open, buffer
    if (!upstreamOpen) {
      pending.push(msg as any);
      return;
    }
    try { upstream.send(msg as any); } catch { /* noop */ }
  });

  client.on('close', () => {
    try { upstream.close(); } catch { /* noop */ }
  });
});

const PORT = process.env.PORT || 8787;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});