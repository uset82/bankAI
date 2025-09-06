# AI Bank — Demo for DNB Contest

Live demo: https://mybankai.netlify.app/

This is a conversational banking demo showcasing:
- Realtime voice (OpenAI Realtime, WebRTC)
- Text chat with streaming fallback
- Mock accounts and transactions (`public/mock/accounts.json`)
- Optional multi‑month ledger for analysis (`public/mock/ledger.json`)

Tech stack:
- Vite + React + TypeScript
- Zustand, SWR, shadcn‑ui, Tailwind CSS
- Node/Express bridge for OpenAI (chat/tts/transcribe/realtime)

Local development
```sh
npm i
npm run dev
# open http://localhost:8080 (or the port shown by Vite)
```

Environment variables (PowerShell example)
```powershell
$env:OPENAI_API_KEY="<your key>"
$env:OPENAI_CHAT_MODEL="gpt-5-mini-2025-08-07"
$env:OPENAI_REALTIME_API_KEY="<your key>"
$env:OPENAI_REALTIME_MODEL="gpt-4o-realtime-preview-2024-10-01"
npm run dev
```

Notes
- This is a demo only: no real banking access; the assistant reads mock data to answer balance/spend/savings queries.
- The assistant supports English, Spanish, and Norwegian.
