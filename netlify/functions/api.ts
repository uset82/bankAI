import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const path = event.path.replace(/^\/\.netlify\/functions\//, "");
  if (path === 'api/openai-chat' && event.httpMethod === 'POST') {
    const apiKey = process.env.OPENAI_API_KEY;
    const body = JSON.parse(event.body || '{}');
    const model = body?.model || process.env.OPENAI_CHAT_MODEL || 'gpt-5-mini-2025-08-07';
    const messages = body?.messages || [];
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'OPENAI_API_KEY missing' }) };
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages })
      });
      const data = await r.json();
      return { statusCode: r.status, body: JSON.stringify(data) };
    } catch (e: any) {
      return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'chat proxy error' }) };
    }
  }

  if (path === 'api/tts' && event.httpMethod === 'POST') {
    const apiKey = process.env.OPENAI_API_KEY;
    const body = JSON.parse(event.body || '{}');
    const { text, voice = 'alloy', model = 'tts-1', format = 'mp3' } = body;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'OPENAI_API_KEY missing' }) };
    if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'Missing text' }) };
    try {
      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: text, voice, response_format: format })
      });
      const buf = Buffer.from(await r.arrayBuffer());
      return { statusCode: r.status, headers: { 'Content-Type': `audio/${format}` }, body: buf.toString('base64'), isBase64Encoded: true };
    } catch (e: any) {
      return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'tts proxy error' }) };
    }
  }

  if (path === 'api/transcribe' && event.httpMethod === 'POST') {
    return { statusCode: 501, body: JSON.stringify({ error: 'Transcription not enabled in Netlify function' }) };
  }

  return { statusCode: 404, body: 'Not Found' };
};


