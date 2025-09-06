Perfect—here’s your **one-shot Super Prompt** for Lovable that builds the **AI Bank** demo with:

* **Voice I/O:** `gpt-4o-audio-preview` (OpenAI Responses API)
* **Reasoning/intent:** `gpt-5-mini-2025-08-07` (OpenAI)
* **Siri-style talking orb** (Web Audio API visualizer)
* **Zero-UI console** with one decisive action per reply
* **Mocked banking/government data** (safe demo)

Copy–paste it into Lovable:

---

# 🚀 Lovable Super Prompt — **AI Bank** (Voice + OpenAI + Siri Orb, Demo-Only)

**Goal:** Create a production-looking demo named **AI Bank** that showcases “no menus—just ask” banking. Voice in/out via **GPT-4o Audio Preview**, intent parsing via **OpenAI gpt-5-mini-2025-08-07**, a **Siri-like animated orb** while the AI speaks, and a **Zero-UI console** with confirmable action cards. **No real money movement**—everything is mocked.

## 0) Tech & Env

* Next.js (App Router, TypeScript), Tailwind, Zustand, SWR.
* **Env vars** (define in Lovable):

```
OPENAI_API_KEY=sk-...
AI_BANK_DEMO=true
```

## 1) File tree

Create this structure and files:

```
/app
  /(landing)/page.tsx
  /console/page.tsx
  /api/voice/route.ts
  /api/agent/route.ts
  /api/mocks/ais/route.ts
  /api/mocks/gov/route.ts
  /api/mocks/offers/route.ts
/mock
  accounts.json
  gov.json
  offers.json
/components
  ChatComposer.tsx
  MessageList.tsx
  ActionCard.tsx
  RightRail.tsx
  BankIdDemoModal.tsx
  SiriOrb.tsx
/lib
  audio.ts
  orchestrator.ts
  intents.ts
/store
  ui.ts
  app.ts
```

## 2) Landing page  (`/app/(landing)/page.tsx`)

* Full-bleed **blue→salmon** gradient (Lovable vibe).
* H1: “**AI Bank — No menus, just ask.**”
* Sub: “BankID-secure (demo), explainable AI, coupons, NAV/Tax inbox — all mocked for safety.”
* CTA → **Open Console** (`/console`).
* Footer disclaimer: “**Demo only — no real banking or government access.**”

## 3) Console layout (`/app/console/page.tsx`)

Top bar: left **AI Bank**; right **BankID (Demo)** badge + button (opens `BankIdDemoModal`) and **<SiriOrb />**.
Three columns:

* **Left**: `ChatComposer` (textarea + Push-to-Talk mic).
* **Center**: `MessageList`. Assistant replies may include **ActionCard** (exactly one decisive action).
* **RightRail** tabs: **Accounts**, **Gov inbox**, **Coupon Vault**, **Audit trail** (SWR from `/api/mocks/*`).
  Sticky banner: “**Demo Mode — all actions simulated.**”

## 4) Mock data (`/mock/*.json`)

**/mock/accounts.json**

```json
{
  "accounts":[
    {"id":"chk-1","name":"Everyday","iban":"NO93 8601 1117 947","currency":"NOK","balance":12450.75},
    {"id":"sav-1","name":"Savings","iban":"NO17 9835 1234 567","currency":"NOK","balance":50200.00}
  ],
  "transactions":[
    {"id":"t1","accountId":"chk-1","amount":-429.00,"desc":"Rema 1000 Åsane","date":"2025-03-18"},
    {"id":"t2","accountId":"chk-1","amount":-199.00,"desc":"Bergen Kino","date":"2025-03-17"},
    {"id":"t3","accountId":"chk-1","amount":-1200.00,"desc":"Rent","date":"2025-03-15"},
    {"id":"t4","accountId":"chk-1","amount":21000.00,"desc":"Salary","date":"2025-03-14"},
    {"id":"t5","accountId":"sav-1","amount":500.00,"desc":"Auto-save","date":"2025-03-12"}
  ]
}
```

**/mock/gov.json**

```json
{
  "messages":[
    {"id":"g1","source":"NAV","subject":"Dokumentinnsending – mangler vedlegg","receivedAt":"2025-03-10","status":"Åpen"},
    {"id":"g2","source":"Skatteetaten","subject":"MVA – påminnelse om innsending","receivedAt":"2025-03-05","status":"Åpen"}
  ]
}
```

**/mock/offers.json**

```json
{
  "city":"Åsane",
  "offers":[
    {"merchant":"Kiwi","product":"Bleier","unit":"pakke","price":69.90,"validTo":"2025-03-31","deepLink":"#"},
    {"merchant":"Rema 1000","product":"Bleier","unit":"pakke","price":72.00,"validTo":"2025-03-31","deepLink":"#"},
    {"merchant":"Coop Extra","product":"Bleier","unit":"pakke","price":74.50,"validTo":"2025-03-31","deepLink":"#"}
  ]
}
```

## 5) Mocks API

**/app/api/mocks/ais/route.ts**

```ts
import { NextResponse } from "next/server";
import data from "@/mock/accounts.json";
export const GET = async () => NextResponse.json(data);
```

**/app/api/mocks/gov/route.ts**

```ts
import { NextResponse } from "next/server";
import data from "@/mock/gov.json";
export const GET = async () => NextResponse.json(data);
```

**/app/api/mocks/offers/route.ts**

```ts
import { NextResponse } from "next/server";
import data from "@/mock/offers.json";
export const GET = async () => NextResponse.json(data);
```

## 6) Intent DSL

**/lib/intents.ts**

```ts
export type Intent =
  | "GET_BALANCE"
  | "PAY_DEMO"
  | "FIND_PRICE"
  | "CHECK_GOV"
  | "FREEZE_CARD_DEMO"
  | "LOWER_RATE_DEMO";

export const systemPrompt = `
You are the AI Bank intent parser.
Map user text to one Intent with JSON:
{ "intent": <Intent>, "slots": { ... }, "assistant_say": "short reply" }

Intents:
- GET_BALANCE
- PAY_DEMO { amount:number, to:string }
- FIND_PRICE { product:string, area:string }
- CHECK_GOV
- FREEZE_CARD_DEMO { cardId:string }
- LOWER_RATE_DEMO { loanId:string }

Always return strict JSON only.
`;
```

## 7) Reasoning API (OpenAI)

**/app/api/agent/route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { systemPrompt } from "@/lib/intents";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text ?? "" }
      ],
      temperature: 0.2
    })
  });
  const data = await r.json();
  let content = data?.choices?.[0]?.message?.content ?? "{}";
  try { content = JSON.parse(content); } catch { content = { intent:"GET_BALANCE", slots:{}, assistant_say:"Here’s your balance." }; }
  return NextResponse.json(content);
}
```

## 8) Voice API (OpenAI `gpt-4o-audio-preview`)

**/app/api/voice/route.ts**

```ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("audio") as File; // webm/wav blob
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const body = {
    model: "gpt-4o-audio-preview",
    modalities: ["text","audio"],
    audio: { voice: "alloy", format: "mp3" },
    input_audio: [{ audio: base64, format: "wav" }],
    instructions: "You are AI Bank’s voice. Be concise and friendly."
  };

  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await r.json();
  const text =
    data.output_text ||
    data.choices?.[0]?.message?.content ||
    "";
  // attempt common shapes for audio content:
  const audio_b64 =
    data.output?.[0]?.content?.find?.((c:any)=>c.type==="output_audio")?.audio?.data ??
    data.content?.find?.((c:any)=>c.type==="audio")?.audio?.data ??
    null;

  return new Response(JSON.stringify({ text, audio_b64 }), {
    headers: { "Content-Type": "application/json" }
  });
}
```

## 9) Stores

**/store/ui.ts**

```ts
import { create } from "zustand";
type UI = {
  bankidVerified: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  speakLevel: number;
  setBankId: (v:boolean)=>void;
  setListening: (v:boolean)=>void;
  setSpeaking: (v:boolean)=>void;
  setSpeakLevel: (n:number)=>void;
};
export const useUI = create<UI>((set)=>({
  bankidVerified:false, isListening:false, isSpeaking:false, speakLevel:0,
  setBankId:(v)=>set({bankidVerified:v}),
  setListening:(v)=>set({isListening:v}),
  setSpeaking:(v)=>set({isSpeaking:v}),
  setSpeakLevel:(n)=>set({speakLevel:Math.max(0,Math.min(1,n))})
}));
```

**/store/app.ts**

```ts
import { create } from "zustand";
type Msg = { role:"user"|"assistant"; text:string; id:string; action?:any };
type Audit = { type:string; slots:any; at:string; reasonCodes:string[] };
type AppState = {
  thread: Msg[];
  audit: Audit[];
  addMsg: (m:Msg)=>void;
  addAudit: (a:Audit)=>void;
  clear: ()=>void;
};
export const useApp = create<AppState>((set)=>({
  thread:[], audit:[],
  addMsg:(m)=>set(s=>({thread:[...s.thread, m]})),
  addAudit:(a)=>set(s=>({audit:[a, ...s.audit].slice(0,50)})),
  clear:()=>set({thread:[], audit:[]})
}));
```

## 10) Audio utils (+ **Siri orb** analyzer)

**/lib/audio.ts**

```ts
import { useUI } from "@/store/ui";

let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let srcNode: MediaElementAudioSourceNode | null = null;

export async function recordOnceMs(ms=5000): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
  const rec = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  return new Promise((resolve)=>{
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = ()=> resolve(new Blob(chunks, { type:"audio/webm" }));
    rec.start(); setTimeout(()=> rec.stop(), ms);
  });
}

export async function playBase64Mp3(b64:string): Promise<HTMLAudioElement> {
  const el = new Audio(`data:audio/mpeg;base64,${b64}`);
  el.muted = true;
  if (!ctx) ctx = new AudioContext();
  if (!analyser) { analyser = ctx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.75; }
  if (srcNode) srcNode.disconnect();
  srcNode = ctx.createMediaElementSource(el);
  srcNode.connect(analyser); analyser.connect(ctx.destination);
  await ctx.resume(); await el.play();

  const { setSpeaking, setSpeakLevel } = useUI.getState();
  setSpeaking(true);
  const buf = new Uint8Array(analyser.frequencyBinCount);
  let raf = 0;
  const tick = () => {
    if (!analyser) return;
    analyser.getByteTimeDomainData(buf);
    let sum = 0; for (let i=0;i<buf.length;i++){ const v=(buf[i]-128)/128; sum += v*v; }
    const rms = Math.sqrt(sum / buf.length);
    setSpeakLevel(Math.min(1, rms * 2.2));
    raf = requestAnimationFrame(tick);
  };
  tick();
  el.onended = () => { cancelAnimationFrame(raf); setSpeakLevel(0); useUI.getState().setSpeaking(false); };
  return el;
}
```

**/components/SiriOrb.tsx**

```tsx
"use client";
import { useUI } from "@/store/ui";

export default function SiriOrb({ size=72, className="" }:{size?:number; className?:string;}) {
  const { isSpeaking, speakLevel, isListening } = useUI();
  const w = size, h = size, mid = h/2;
  const scale = 1 + speakLevel*0.9;
  const glow = 12 + speakLevel*14;
  const amp = 6 + speakLevel*18;

  const steps = 24, pts:string[] = [];
  for (let i=0;i<=steps;i++){
    const x = (i/steps)*w, y = mid + Math.sin((i/steps)*Math.PI*2)*amp;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return (
    <div className={`relative select-none ${className}`} style={{width:w, height:h}} aria-label={isSpeaking?"AI is speaking": isListening?"Listening":"Idle"}>
      <div className="absolute inset-0 rounded-full" style={{
        filter:`blur(${glow}px)`, transform:`scale(${scale})`,
        transition:"transform 80ms linear, filter 120ms linear",
        background:"conic-gradient(from 180deg at 50% 50%, #6366f1, #22d3ee, #fb7185, #6366f1)",
        opacity: isSpeaking ? 0.9 : 0.45
      }} />
      <div className="absolute inset-0 rounded-full" style={{
        background:"radial-gradient(65% 65% at 50% 45%, rgba(255,255,255,0.7), rgba(255,255,255,0) 60%), radial-gradient(80% 80% at 50% 60%, rgba(99,102,241,0.85), rgba(34,211,238,0.8), rgba(251,113,133,0.85))",
        boxShadow:"inset 0 0 30px rgba(255,255,255,0.15)",
        transform:`scale(${0.98 + speakLevel*0.05})`,
        transition:"transform 80ms linear"
      }} />
      <svg className="absolute inset-0" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <clipPath id="clip"><circle cx={w/2} cy={h/2} r={h/2} /></clipPath>
          <linearGradient id="waveGrad" x1="0" x2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.85"/><stop offset="100%" stopColor="#fff" stopOpacity="0.2"/></linearGradient>
        </defs>
        <g clipPath="url(#clip)">
          <ellipse cx={w/2} cy={mid + amp*0.25} rx={w/2} ry={mid*(0.6 + speakLevel*0.2)} fill="url(#waveGrad)" opacity={0.18}/>
          <polyline points={pts.join(" ")} fill="none" stroke="url(#waveGrad)" strokeWidth={3.2} strokeLinecap="round" opacity={0.9}/>
        </g>
      </svg>
      {!isSpeaking && !isListening && <div className="absolute inset-0 grid place-items-center"><div className="h-2 w-2 rounded-full bg-white/70"/></div>}
      {isListening && <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <div className="absolute inset-0 h-12 w-12 rounded-full border border-white/40 animate-ping" />
          <div className="h-2 w-2 rounded-full bg-white/80" />
        </div>
      </div>}
    </div>
  );
}
```

## 11) Orchestrator (client helper)

**/lib/orchestrator.ts**

```ts
import { useApp } from "@/store/app";

export type Confirmable = {
  title: string; confirmLabel: string; onConfirm: ()=>Promise<void>; guardBankId?: boolean;
};

export function buildAction(intent:string, slots:any, guardBankId=true): Confirmable | null {
  const { addAudit } = useApp.getState();
  const confirm = async (msg:string) => {
    addAudit({ type:intent, slots, at:new Date().toISOString(), reasonCodes:["demo","policy_ok"] });
    useApp.getState().addMsg({ role:"assistant", id:crypto.randomUUID(), text:msg });
  };

  if (intent==="PAY_DEMO")
    return { title:`Pay NOK ${slots.amount} to ${slots.to}`, confirmLabel:"Pay now", guardBankId, onConfirm:()=>confirm("Payment simulated. Receipt saved.") };
  if (intent==="FIND_PRICE")
    return { title:`Use coupon at Kiwi (NOK 69.90)`, confirmLabel:"Use coupon", guardBankId:false, onConfirm:()=>confirm("Coupon saved to your vault (demo).") };
  if (intent==="FREEZE_CARD_DEMO")
    return { title:`Freeze card ending ••7947?`, confirmLabel:"Freeze", onConfirm:()=>confirm("Card frozen (demo)."), guardBankId:true };
  if (intent==="LOWER_RATE_DEMO")
    return { title:`Request lower rate`, confirmLabel:"Send request", onConfirm:()=>confirm("Request sent to human reviewer (demo)."), guardBankId:true };
  return null;
}
```

## 12) Chat components

**/components/ActionCard.tsx**

```tsx
"use client";
import { useUI } from "@/store/ui";

export default function ActionCard({ title, confirmLabel, onConfirm, guardBankId=true }:{
  title:string; confirmLabel:string; onConfirm:()=>void|Promise<void>; guardBankId?:boolean;
}) {
  const { bankidVerified } = useUI();
  const blocked = guardBankId && !bankidVerified;
  return (
    <div className="mt-3 rounded-2xl bg-white/5 backdrop-blur p-3 border border-white/10">
      <div className="text-sm">{title}</div>
      <div className="mt-2">
        <button
          className={`px-3 py-1.5 rounded-xl text-sm ${blocked ? "bg-zinc-700/60 cursor-not-allowed" : "bg-emerald-500/80 hover:bg-emerald-500"} `}
          disabled={blocked}
          title={blocked ? "Sign in with BankID (Demo) first" : ""}
          onClick={()=>onConfirm()}
        >{confirmLabel}</button>
      </div>
    </div>
  );
}
```

**/components/MessageList.tsx**

```tsx
"use client";
import ActionCard from "./ActionCard";
import { useApp } from "@/store/app";

export default function MessageList(){
  const { thread } = useApp();
  return (
    <div className="flex flex-col gap-3">
      {thread.map(m=>(
        <div key={m.id} className={`max-w-xl ${m.role==="assistant"?"self-start":"self-end"} bg-white/5 rounded-2xl p-3`}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
          {m.action && <ActionCard {...m.action} />}
        </div>
      ))}
    </div>
  );
}
```

**/components/BankIdDemoModal.tsx**

```tsx
"use client";
import { useUI } from "@/store/ui";
export default function BankIdDemoModal(){
  const { setBankId } = useUI();
  // Keep it simple: expose a button that sets verified=true
  return (
    <button onClick={()=>setBankId(true)} className="rounded-xl bg-blue-500/80 px-3 py-1.5 text-sm hover:bg-blue-500">
      Sign in with BankID (Demo)
    </button>
  );
}
```

**/components/RightRail.tsx**

```tsx
"use client";
import useSWR from "swr";
const fetcher = (u:string)=>fetch(u).then(r=>r.json());
export default function RightRail(){
  const { data:ais } = useSWR("/api/mocks/ais", fetcher);
  const { data:gov } = useSWR("/api/mocks/gov", fetcher);
  const { data:offers } = useSWR("/api/mocks/offers", fetcher);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 p-3">
        <h3 className="text-sm font-semibold mb-2">Accounts</h3>
        {ais?.accounts?.map((a:any)=>(
          <div key={a.id} className="text-xs flex justify-between py-1">
            <span>{a.name}</span><span>{a.currency} {a.balance.toLocaleString("no-NO")}</span>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-white/10 p-3">
        <h3 className="text-sm font-semibold mb-2">Gov inbox</h3>
        {gov?.messages?.map((m:any)=>(
          <div key={m.id} className="text-xs py-1"><strong>{m.source}</strong>: {m.subject}</div>
        ))}
      </section>
      <section className="rounded-2xl border border-white/10 p-3">
        <h3 className="text-sm font-semibold mb-2">Coupon Vault</h3>
        {offers?.offers?.map((o:any)=>(
          <div key={o.merchant} className="text-xs py-1">{o.merchant}: {o.product} — {o.price} NOK</div>
        ))}
      </section>
    </div>
  );
}
```

**/components/ChatComposer.tsx**

```tsx
"use client";
import { useState } from "react";
import { useApp } from "@/store/app";
import { useUI } from "@/store/ui";
import { recordOnceMs, playBase64Mp3 } from "@/lib/audio";
import { buildAction } from "@/lib/orchestrator";

export default function ChatComposer(){
  const [text, setText] = useState("");
  const { addMsg } = useApp();
  const { setListening } = useUI();

  async function sendText(t: string){
    const user = { role:"user" as const, id:crypto.randomUUID(), text:t };
    addMsg(user);

    const r = await fetch("/api/agent", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ text: t }) });
    const { intent, slots, assistant_say } = await r.json();

    const action = buildAction(intent, slots);
    addMsg({ role:"assistant", id:crypto.randomUUID(), text:assistant_say, action });
  }

  async function talk(){
    setListening(true);
    const blob = await recordOnceMs(4000);
    setListening(false);

    const fd = new FormData(); fd.append("audio", blob, "voice.webm");
    const r = await fetch("/api/voice", { method:"POST", body: fd });
    const { text, audio_b64 } = await r.json();

    if (text) await sendText(text);
    if (audio_b64) await playBase64Mp3(audio_b64);
  }

  return (
    <div className="flex gap-2">
      <textarea className="flex-1 rounded-2xl bg-white/5 p-3 text-sm" rows={2}
        placeholder='Try: "What’s my balance?" or "Pay 200 NOK to Ola".'
        value={text} onChange={e=>setText(e.target.value)} />
      <button onClick={()=>{ if(text.trim()) { sendText(text.trim()); setText(""); } }}
        className="rounded-xl bg-emerald-500/80 px-3 text-sm hover:bg-emerald-500">Send</button>
      <button onClick={talk} className="rounded-xl bg-indigo-500/80 px-3 text-sm hover:bg-indigo-500">🎙️ Talk</button>
    </div>
  );
}
```

## 13) Stitch the console page

In **`/app/console/page.tsx`**, render:

* Header: **AI Bank**, `<BankIdDemoModal />`, `<SiriOrb />`
* 3-column layout using CSS grid: left `ChatComposer`, center `MessageList`, right `RightRail`.

## 14) Styling

* Dark mode default; glassmorphism cards (`rounded-2xl`, `border-white/10`, `bg-white/5`, `backdrop-blur`).
* Landing gradient background; subtle scroll shadows; micro-animations on confirm buttons.

## 15) Seed prompts (show below the composer)

* “What’s my balance?”
* “Pay 200 NOK to Ola.”
* “Find best price for diapers in Åsane.”
* “Freeze my card.”
* “Can I get a lower rate?”
* “Check my NAV/Tax messages.”

## 16) Behavior rules

* **Demo-only**: never call real banking/gov APIs.
* **Guardrails**: Confirm buttons blocked until **BankID (Demo)** verified.
* **Explainability hint** (copy in confirmations): “Under NOK 5,000 threshold; low risk; explicit user confirm.”

---




here are the apis in order the app will work

gpt-5-mini-2025-08-07:   <YOUR_OPENAI_API_KEY>

add the real time voice of open ai api :

gpt-4o-realtime-preview:  <YOUR_OPENAI_API_KEY>



import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";

const agent = new RealtimeAgent({
    name: "Assistant",
    instructions: "You are a helpful assistant.",
});

const session = new RealtimeSession(agent);

// Automatically connects your microphone and audio output
await session.connect({
    apiKey: "<client-api-key>",
});




Sweet—here’s a **ready-to-use design system** (colors + layout structure) for **AI Bank**. It’s futuristic, modern, and professional, with dark-first styling, glass surfaces, and neon accents.

# Colors (Dark-first)

## Brand palette

* **Space** `#0B1220` – deepest bg
* **Mid-Space** `#101B2D` – page bg
* **Steel** `#1B2840` – section bg
* **Primary / Electric Blue** `#5B8CFF`
* **Aqua / Cyan** `#22D3EE`
* **Coral / CTA** `#FB7185`
* **Violet / Depth** `#7C3AED`

## Functional

* **Success** `#22C55E`
* **Warning** `#F59E0B`
* **Danger** `#EF4444`
* **Info** `#38BDF8`
* **Focus Ring** `#8B5CF6` (violet) or `#22D3EE` (cyan)

## Neutrals

* `#0B0F1A` (bg-alt), `#111827`, `#1F2937`, `#374151`, `#6B7280`,
  `#9CA3AF`, `#D1D5DB`, `#E5E7EB`, `#F3F4F6` (light text on dark surfaces)

## Gradients

* **Hero / App bg**: `linear-gradient(145deg, #0B1220 0%, #101B2D 45%, #1B2840 100%)`
* **Brand accent**: `linear-gradient(135deg, #5B8CFF 0%, #22D3EE 50%, #FB7185 100%)`
* **Siri-orb conic**: `conic-gradient(from 180deg at 50% 50%, #6366F1, #22D3EE, #FB7185, #6366F1)`

## Glass surfaces (use with blur)

* **Surface-1** `rgba(255,255,255,0.04)` border `rgba(255,255,255,0.08)`
* **Surface-2** `rgba(255,255,255,0.06)` border `rgba(255,255,255,0.12)`
* **Surface-Elevated** `rgba(16,27,45,0.6)` border `rgba(255,255,255,0.10)`

---

# Design Tokens (CSS variables – drop in `globals.css`)

```css
:root {
  /* Brand */
  --space:#0B1220; --space-mid:#101B2D; --steel:#1B2840;
  --primary:#5B8CFF; --aqua:#22D3EE; --coral:#FB7185; --violet:#7C3AED;

  /* Functional */
  --success:#22C55E; --warning:#F59E0B; --danger:#EF4444; --info:#38BDF8; --focus:#22D3EE;

  /* Text */
  --txt:#E5E7EB; --txt-dim:#B6BDC9; --txt-muted:#9CA3AF;

  /* Surfaces */
  --surface-1:rgba(255,255,255,.04);
  --surface-2:rgba(255,255,255,.06);
  --surface-3:rgba(16,27,45,.6);
  --border-1:rgba(255,255,255,.08);
  --border-2:rgba(255,255,255,.12);

  /* Gradients */
  --grad-hero: linear-gradient(145deg,#0B1220 0%,#101B2D 45%,#1B2840 100%);
  --grad-accent: linear-gradient(135deg,#5B8CFF 0%,#22D3EE 50%,#FB7185 100%);
  --grad-orb: conic-gradient(from 180deg at 50% 50%, #6366F1, #22D3EE, #FB7185, #6366F1);

  /* Radii & Blur */
  --radius-lg: 1.25rem; /* 20px */
  --radius-xl: 1.5rem;  /* 24px */
  --blur: 12px;
}
html,body { background: var(--grad-hero); color: var(--txt); }
.card {
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  backdrop-filter: blur(var(--blur));
  border-radius: var(--radius-xl);
}
.btn-primary {
  background: var(--grad-accent);
  color:#0A0A0A; border-radius: 999px; padding:.7rem 1.1rem;
  box-shadow: 0 6px 24px rgba(91,140,255,.25);
}
.btn-primary:hover { filter: brightness(1.05); }
.focus-ring { outline: 2px solid var(--focus); outline-offset: 2px; }
```

---

# Tailwind theme extension (optional)

```ts
// tailwind.config.ts
export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        space: "#0B1220", spacemid:"#101B2D", steel:"#1B2840",
        primary:"#5B8CFF", aqua:"#22D3EE", coral:"#FB7185", violet:"#7C3AED",
        success:"#22C55E", warning:"#F59E0B", danger:"#EF4444", info:"#38BDF8",
      },
      borderRadius: { xl: "1.5rem", "2xl": "2rem" },
      backdropBlur: { md: "12px" },
      boxShadow: {
        glow: "0 10px 30px rgba(91,140,255,.25)",
        innersoft: "inset 0 0 24px rgba(255,255,255,.12)"
      }
    }
  }
}
```

---

# Structure (IA & layout)

## Global layout

* **Sticky top-nav** (glass): Logo “AI Bank”, Nav: *Product*, *Console*, *Pricing*, *Security*, *Docs*, Right: language, **Sign in (Demo)**, **Open Console**.
* **Container width**: 1280px max; 12-column grid; generous 24–32px gaps.
* **Footer**: logo, short mission, columns: Product, Company, Legal, Social; mini fine-print.

## Pages & sections

### 1) Landing (`/`)

1. **Hero**

   * Massive headline; subcopy; two CTAs: **Open Console**, **View Security**.
   * Right: **Siri-style orb** idle animation.
2. **Value grid (3 columns)**

   * Trust & Safety, Time Back, SavingsIQ (each card w/ neon underline).
3. **How it works**

   * 3 steps with tiny diagrams (intent → guardrails → confirm).
4. **Live Console preview**

   * Embedded mock frame; sample prompts chips.
5. **Security & Compliance**

   * BankID (demo), explainability, audit, rate-limit; badges row.
6. **Pricing (demo tiers)**

   * Basic / Plus / Pro SMB cards; clear “Demo only.”
7. **FAQ**

   * 6 Q\&A accordions.
8. **Footer**

### 2) Console (`/console`)

* **Top bar**: AI Bank logo, **BankID (Demo) badge**, *Sign in (Demo)*, Siri orb.
* **Layout**: 3 columns

  * **Left (320px)**: **Composer** (text + 🎙️ Push-to-Talk), hint chips.
  * **Center (flex)**: **Thread** with **ActionCard** (single decisive button).
  * **Right (360px)**: **Tabs** → *Accounts*, *Gov inbox*, *Coupon Vault*, *Audit*.
* **Toast area** bottom-right.

### 3) Legal

* **Privacy**, **Terms**, **Security whitepaper (pdf link)**.

---

# Component styling rules

* **Cards**: `.card` class (glass + border); inner padding 16–20px; titles \~`text-sm font-semibold`.
* **Buttons**:

  * Primary → gradient **btn-primary**.
  * Secondary → `bg-white/10 hover:bg-white/15 border border-white/15`.
  * Destructive → `bg-danger/90 hover:bg-danger`.
* **Badges**: rounded-full pills (e.g., “BankID (Demo) ✓ Verified”: `bg-emerald-500/20 text-emerald-300`).
* **ActionCard**: one primary action only; subtle explanatory caption (“Under NOK 5k threshold; explicit user confirm.”)
* **Focus & a11y**: visible focus rings (`--focus`), 4.5:1 contrast on text; large text on neon backgrounds.

---

# Usage recipes

**Hero gradient background**

```html
<section class="min-h-[70vh] flex items-center"
         style="background:var(--grad-hero)">
  ...
</section>
```

**Glassy section**

```html
<div class="card shadow-innersoft p-6">
  <h3 class="text-lg font-semibold">Trust & Safety</h3>
  <p class="text-sm text-[color:var(--txt-dim)]">BankID (demo), explainability…</p>
</div>
```

**Primary CTA**

```html
<a class="btn-primary inline-flex items-center gap-2" href="/console">
  Open Console
</a>
```

**Siri orb container**

```html
<div class="w-[72px] h-[72px]">
  <!-- <SiriOrb /> component here -->
</div>
```

---

## Color pairing guide

* **Primary text** on dark → `var(--txt)`; muted copy → `var(--txt-dim)`.
* **CTA** uses the brand gradient; never pure white over neon without shadow—use dark text for readability.
* **Error/Warning** only in toasts, badges, or inline hints—keep the UI calm.
