import { intentExamples, type ParsedIntent, type Intent } from './intents';

// Mock agent API that simulates OpenAI reasoning
export async function mockAgentAPI(text: string): Promise<ParsedIntent> {
  // Simulate some processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const lowerText = text.toLowerCase();
  
  // Simple intent matching logic
  if (lowerText.includes('balance')) {
    return {
      intent: "GET_BALANCE",
      slots: {},
      assistant_say: "Here's your current balance. Your Everyday account has NOK 12,450.75 and your Savings account has NOK 50,200.00."
    };
  }
  
  if (lowerText.includes('pay') || lowerText.includes('send')) {
    // Extract amount and recipient
    const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:nok|kroner?)?/i);
    const toMatch = text.match(/to\s+(\w+)/i);
    
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 100;
    const to = toMatch ? toMatch[1] : "recipient";
    
    return {
      intent: "PAY_DEMO",
      slots: { amount, to },
      assistant_say: `I can help you send NOK ${amount} to ${to}. Please confirm this payment.`,
      action_card: {
        title: `Pay NOK ${amount} to ${to}`,
        details: `This will transfer NOK ${amount} from your Everyday account to ${to}.`,
        confirmLabel: "Confirm Payment",
        onConfirmIntent: "PAY_DEMO",
        slots: { amount, to }
      }
    };
  }
  
  if (lowerText.includes('price') || lowerText.includes('coupon') || lowerText.includes('bleier') || lowerText.includes('diaper')) {
    const productMatch = text.match(/(bleier|diaper|milk|bread|[a-z]+)/i);
    const areaMatch = text.match(/in\s+(\w+)/i) || text.match(/(\w+)/i);
    
    const product = productMatch ? productMatch[1] : "bleier";
    const area = areaMatch ? areaMatch[1] : "Åsane";
    
    return {
      intent: "FIND_PRICE",
      slots: { product, area },
      assistant_say: `I found the best prices for ${product} in ${area}. Kiwi has the lowest price at NOK 69.90 per pakke.`,
      action_card: {
        title: `Best price: ${product} at Kiwi`,
        details: `NOK 69.90 per pakke - Save NOK 4.60 compared to Coop Extra`,
        confirmLabel: "Save Coupon",
        onConfirmIntent: "FIND_PRICE", 
        slots: { product, area, merchant: "Kiwi", price: 69.90 }
      }
    };
  }
  
  if (lowerText.includes('freeze') || lowerText.includes('block') || lowerText.includes('card')) {
    return {
      intent: "FREEZE_CARD_DEMO",
      slots: { cardId: "card-1234" },
      assistant_say: "I can freeze your card immediately for security. This will block all transactions until you unfreeze it.",
      action_card: {
        title: "Freeze Card ****1234",
        details: "This will immediately block all transactions on this card.",
        confirmLabel: "Freeze Card",
        onConfirmIntent: "FREEZE_CARD_DEMO",
        slots: { cardId: "card-1234" }
      }
    };
  }
  
  if (lowerText.includes('rate') || lowerText.includes('loan') || lowerText.includes('interest')) {
    return {
      intent: "LOWER_RATE_DEMO",
      slots: { loanId: "loan-456" },
      assistant_say: "I can submit a request to review your loan rate. Our team typically responds within 2 business days.",
      action_card: {
        title: "Request Lower Rate",
        details: "Submit a rate review request for your home loan (3.2% current rate)",
        confirmLabel: "Submit Request",
        onConfirmIntent: "LOWER_RATE_DEMO",
        slots: { loanId: "loan-456" }
      }
    };
  }
  
  if (lowerText.includes('nav') || lowerText.includes('tax') || lowerText.includes('gov') || lowerText.includes('message')) {
    return {
      intent: "CHECK_GOV",
      slots: {},
      assistant_say: "You have 2 government messages waiting: One from NAV about missing documents, and one from Skatteetaten about MVA submission. Both require action."
    };
  }
  
  // Default response
  return {
    intent: "GET_BALANCE",
    slots: {},
    assistant_say: "I'm not sure what you're asking for. You can ask me about your balance, make payments, find prices, or check government messages."
  };
}

// Mock voice API that simulates OpenAI gpt-4o-audio-preview
export async function mockVoiceAPI(audioBlob: Blob): Promise<{ text: string; audio_b64?: string }> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock transcription - in reality this would process the audio
  const mockTranscriptions = [
    "What's my balance?",
    "Send 500 kroner to Ola", 
    "Find best price for diapers",
    "Freeze my card please",
    "Check my government messages"
  ];
  
  const text = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
  
  // Mock audio response (empty for now - would need actual audio generation)
  return {
    text,
    audio_b64: undefined // In real implementation, this would be base64 encoded MP3
  };
}