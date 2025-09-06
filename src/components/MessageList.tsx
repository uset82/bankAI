import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { Message } from "@/store/session";
import { ActionCard } from "./ActionCard";

interface MessageListProps {
  messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Welcome to AI Bank
          </h3>
          <p className="text-muted-foreground">
            Ask me anything about your accounts, payments, or government messages.
          </p>
        </motion.div>
      )}
      
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            
            {/* Message Content */}
            <div className="space-y-3">
              <div
                className={`glass-card p-4 rounded-2xl ${
                  message.role === 'user' 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'bg-secondary/50 border-border/50'
                }`}
              >
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
              
              {/* Action Card */}
              {message.actionCard && (
                <ActionCard actionCard={message.actionCard} />
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};