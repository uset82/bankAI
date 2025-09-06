import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, LogOut, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSessionStore } from "@/store/session";
import { useUIStore } from "@/store/ui";
import { MessageList } from "@/components/MessageList";
import { RightRail } from "@/components/RightRail";
// Removed BankID demo modal import
// import { BankIdDemoModal } from "@/components/BankIdDemoModal";
// Switch to realtime mic via OpenAIRealtimeClient for low-latency voice
// import { mockAgentAPI } from "@/lib/mockApi";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { OpenAIRealtimeClient } from "@/lib/openai-realtime";
import { BANK_ASSISTANT_INSTRUCTIONS } from "@/lib/assistant-prompt";

const Console = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    bankidVerified, 
    thread, 
    addMessage,
    updateLastAssistantMessageContent
  } = useSessionStore();
  
  const { 
    isBankIdModalOpen, 
    setIsBankIdModalOpen 
  } = useUIStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Realtime WS client (text streaming)
  const rtRef = useRef<OpenAIRealtimeClient | null>(null);

  useEffect(() => {
    const client = new OpenAIRealtimeClient();
    rtRef.current = client;

    (async () => {
      try {
        await client.connect({
          onMessage: (delta) => {
            // Stream text deltas into the last assistant message
            updateLastAssistantMessageContent((prev) => prev + delta);
          },
          onError: (err) => {
            console.error("Realtime error:", err);
            setVoiceError(typeof err === 'string' ? err : 'Realtime connection error');
          },
          onConnectionChange: (connected) => {
            console.log("Realtime connected:", connected);
          }
        });
      } catch (e) {
        console.error("Failed to initialize realtime WS:", e);
        setVoiceError('Failed to initialize realtime service');
      }
    })();

    return () => {
      try { client.disconnect(); } catch {}
    };
  }, [updateLastAssistantMessageContent]);

  const sendTextMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage = message;
    setMessage("");
    setIsLoading(true);
    
    // Add user message
    addMessage({
      role: "user",
      content: userMessage
    });

    try {
      const client = rtRef.current;
      if (client && client.isConnectedToService()) {
        try {
          // Create an empty assistant message to stream into
          addMessage({ role: "assistant", content: "" });
          // Send text over realtime WS (text-only; no mic)
          client.sendTextMessage(userMessage);
          return; // streaming will update the last assistant message
        } catch (rtErr) {
          console.error('Realtime send failed, falling back to REST:', rtErr);
        }
      }

      // Load demo accounts context for the model (so it can reason over mock balances/transactions)
      let demoContext: any = null;
      try {
        const ctxResp = await fetch('/mock/accounts.json');
        if (ctxResp.ok) demoContext = await ctxResp.json();
      } catch {}

      // Fallback: call chat completions REST proxy
      const resp = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: BANK_ASSISTANT_INSTRUCTIONS },
            demoContext ? { role: 'system', content: `DEMO_ACCOUNTS_JSON: ${JSON.stringify(demoContext)}` } : undefined,
            { role: 'user', content: userMessage }
          ].filter(Boolean)
        })
      });
      const rawText = await resp.text();
      let data: any = undefined;
      try { data = rawText ? JSON.parse(rawText) : undefined; } catch {}
      if (!resp.ok) {
        const errMsg = data?.error?.message || data?.error || rawText || 'Chat completion failed';
        addMessage({ role: 'assistant', content: `Error from chat service: ${errMsg}` });
        return;
      }
      const content = data?.choices?.[0]?.message?.content || 'Sorry, I could not respond.';
      addMessage({ role: 'assistant', content });

    } catch (error) {
      console.error(error);
      const msg = (error as any)?.message ? `Error: ${(error as any).message}` : 'Sorry, I encountered an error. Please try again.';
      addMessage({
        role: "assistant", 
        content: msg
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRecording = async () => {
    const client = rtRef.current;
    if (!client) return;
    try {
      setVoiceError(null);
      if (!client.isConnectedToService()) {
        await client.connect({
          onMessage: (delta) => {
            console.log('Voice delta:', delta);
            updateLastAssistantMessageContent((prev) => prev + delta);
          },
          onError: (err) => {
            console.error('Voice error:', err);
            setVoiceError(typeof err === 'string' ? err : 'Realtime connection error');
          },
          onConnectionChange: (connected) => {
            console.log('Voice connection changed:', connected);
          },
        });
      }
      if (isRecording) {
        client.stopRecording();
        setIsRecording(false);
        setIsProcessing(true);
        // Ask for response after audio commit handled inside stopRecording
        setTimeout(() => setIsProcessing(false), 200); // minimal UI lag
      } else {
        setIsProcessing(false);
        await client.startRecording();
        setIsRecording(true);
        // Create an empty assistant message to stream into
        addMessage({ role: "assistant", content: "" });
      }
    } catch (e) {
      console.error(e);
      setVoiceError('Failed to toggle recording');
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  return (
    <div className="min-h-screen app-liquid-bg flex flex-col">
      
      {/* Top Bar */}
      <header className="border-b border-border/50 p-4 glass-card rounded-none">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-primary">AI Bank</h1>
          </Link>
          
          <div className="flex items-center space-x-4">
            {/* Removed BankID (Demo) badge and Sign in (Demo) button */}
            <Link to="/">
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Voice Error Alert */}
      {voiceError && (
        <Alert variant="destructive" className="mx-4 mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {voiceError}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setVoiceError(null)}
              className="ml-2 h-auto p-0 text-destructive-foreground underline"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Chat */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <MessageList messages={thread} />
          </div>
          
          {/* Composer */}
          <div className="border-t border-border/50 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-4 rounded-2xl">
                <div className="flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything... (Press Enter to send)"
                    className="flex-1 min-h-[60px] md:min-h-[60px] resize-none bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                  
                  <div className="flex md:flex-col md:space-y-2 space-x-2 md:space-x-0">
                    <Button
                      onClick={sendTextMessage}
                      disabled={!message.trim() || isLoading}
                      size="sm"
                      className="flex-1 md:flex-initial"
                    >
                      Send
                    </Button>
                    
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      onClick={handleToggleRecording}
                      disabled={isLoading || isProcessing}
                      className={`${isRecording ? "voice-recording animate-pulse" : ""} md:w-auto flex-1 md:flex-initial`}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {/* Test Prompts */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "What's my balance?",
                    "How much did I spend last month?",
                    "Do I have any loan options?",
                    "How much money do I have left?",
                    "What are my accounts?"
                  ].map((prompt) => (
                    <Button
                      key={prompt}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setMessage(prompt)}
                      disabled={isLoading}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Rail hidden on mobile */}
        <div className="hidden md:block">
          <RightRail />
        </div>
      </div>

      {/* Removed BankID demo modal */}
      {/* <BankIdDemoModal 
        open={isBankIdModalOpen}
        onOpenChange={setIsBankIdModalOpen}
      /> */}
    </div>
  );
};

export default Console;