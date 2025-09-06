import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  const apiKey = process.env.OPENAI_REALTIME_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-10-01';
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OPENAI_REALTIME_API_KEY missing' })
    };
  }

  try {
    const resp = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
      },
      body: JSON.stringify({ session: { type: 'realtime', model } })
    });
    const data = await resp.json();
    return {
      statusCode: resp.status,
      body: JSON.stringify(data)
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e?.message || 'Failed to create client secret' })
    };
  }
};


