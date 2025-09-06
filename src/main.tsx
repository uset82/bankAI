import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { BANK_ASSISTANT_INSTRUCTIONS } from './lib/assistant-prompt'
import './index.css'

;(window as any).AI_BANK_ASSISTANT_PROMPT = BANK_ASSISTANT_INSTRUCTIONS
createRoot(document.getElementById("root")!).render(<App />);
