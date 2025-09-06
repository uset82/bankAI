export type Intent =
  | "GET_BALANCE"
  | "PAY_DEMO"
  | "FIND_PRICE"
  | "CHECK_GOV"
  | "FREEZE_CARD_DEMO"
  | "LOWER_RATE_DEMO";

export type ActionCardPayload = {
  title: string;
  details?: string;
  confirmLabel: string;
  onConfirmIntent: Intent;
  slots: Record<string, any>;
};

export const intentExamples = `
Your job: map user requests to one of these intents with slots.

Intents:
- GET_BALANCE
- PAY_DEMO { amount:number, to:string }
- FIND_PRICE { product:string, area:string }
- CHECK_GOV
- FREEZE_CARD_DEMO { cardId:string }
- LOWER_RATE_DEMO { loanId:string }

Rules: return strict JSON with { intent, slots, assistant_say }.
`;

export type ParsedIntent = {
  intent: Intent;
  slots: Record<string, any>;
  assistant_say: string;
  action_card?: ActionCardPayload;
};