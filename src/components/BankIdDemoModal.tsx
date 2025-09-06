import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSessionStore } from "@/store/session";
import { CheckCircle, Smartphone } from "lucide-react";

interface BankIdDemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BankIdDemoModal = ({ open, onOpenChange }: BankIdDemoModalProps) => {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { setBankidVerified } = useSessionStore();

  const handleVerify = async () => {
    setIsVerifying(true);
    
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Any 6-digit OTP works in demo
    if (otp.length === 6) {
      setBankidVerified(true);
      onOpenChange(false);
      setOtp("");
    }
    
    setIsVerifying(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setOtp("");
    setIsVerifying(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <span>BankID Demo</span>
          </DialogTitle>
          <DialogDescription>
            This is a demo authentication. Enter any 6-digit code to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="text-center">
            <div className="glass-card p-6 rounded-xl mb-4">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">
                Demo BankID Request
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Enter any 6-digit code
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleVerify}
                disabled={otp.length !== 6 || isVerifying}
                className="flex-1"
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Demo mode: Any 6-digit code will work
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};