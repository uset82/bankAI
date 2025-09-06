import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { useSessionStore } from "@/store/session";
import { motion } from "framer-motion";

interface ActionCardProps {
  actionCard: {
    title: string;
    details?: string;
    confirmLabel: string;
    onConfirmIntent: string;
    slots: Record<string, any>;
  };
}

export const ActionCard = ({ actionCard }: ActionCardProps) => {
  const { addAuditEvent, addMessage } = useSessionStore();
  
  const handleConfirm = () => {
    // Removed BankID (Demo) gating; allow confirm directly
    
    // Add audit event
    addAuditEvent({
      type: actionCard.onConfirmIntent,
      slots: actionCard.slots,
      reasonCodes: ["demo", "policy_ok"]
    });
    
    // Generate success message based on intent
    let successMessage = "Action completed successfully.";
    
    switch (actionCard.onConfirmIntent) {
      case "PAY_DEMO":
        successMessage = `Payment of NOK ${actionCard.slots.amount} to ${actionCard.slots.to} simulated. Receipt saved.`;
        break;
      case "FIND_PRICE":
        successMessage = `Coupon saved to your vault (demo).`;
        break;
      case "FREEZE_CARD_DEMO":
        successMessage = `Card frozen (demo).`;
        break;
      case "LOWER_RATE_DEMO":
        successMessage = `Rate request sent to human reviewer (demo).`;
        break;
    }
    
    addMessage({
      role: "assistant",
      content: successMessage
    });
  };
  
  const handleCancel = () => {
    addMessage({
      role: "assistant", 
      content: "Action cancelled."
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="action-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-foreground">
            {actionCard.title}
          </CardTitle>
          {actionCard.details && (
            <p className="text-sm text-muted-foreground">
              {actionCard.details}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex space-x-3">
            <Button
              onClick={handleConfirm}
              className="flex-1"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {actionCard.confirmLabel}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};