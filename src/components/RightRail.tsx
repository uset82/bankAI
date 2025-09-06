import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui";
import { useSessionStore } from "@/store/session";
import useSWR from "swr";
import { Wallet, FileText, Gift, Activity, Copy } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const RightRail = () => {
  const { activeTab, setActiveTab } = useUIStore();
  const { auditLog } = useSessionStore();
  
  const { data: accounts } = useSWR("/mock/accounts.json", fetcher);
  const { data: govData } = useSWR("/mock/gov.json", fetcher);  
  const { data: offers } = useSWR("/mock/offers.json", fetcher);

  const copyAuditToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(auditLog, null, 2));
  };

  return (
    <div className="w-full md:w-80 border-l border-border/50 bg-card/50 backdrop-blur-sm">
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as any)}>
        <TabsList className="grid w-full grid-cols-4 m-2">
          <TabsTrigger value="accounts" className="text-xs">
            <Wallet className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="gov" className="text-xs">
            <FileText className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="coupons" className="text-xs">
            <Gift className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs">
            <Activity className="h-3 w-3" />
          </TabsTrigger>
        </TabsList>

        <div className="p-3 space-y-3 h-[calc(100vh-120px)] overflow-y-auto">
          <TabsContent value="accounts" className="mt-0 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Accounts</h3>
            
            {accounts?.accounts?.map((account: any) => (
              <Card key={account.id} className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{account.name}</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono">
                    {account.iban}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-lg font-bold text-success">
                    {account.currency} {account.balance.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
            
            <div className="space-y-2">
              <h4 className="font-medium text-xs text-muted-foreground">Recent Transactions</h4>
              {accounts?.transactions?.slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="glass-card p-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{tx.desc}</p>
                      <p className="text-muted-foreground">{tx.date}</p>
                    </div>
                    <p className={`font-mono ${tx.amount > 0 ? 'text-success' : 'text-foreground'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gov" className="mt-0 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Government Inbox</h3>
            
            {govData?.messages?.map((msg: any) => (
              <Card key={msg.id} className="glass-card">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {msg.source}
                    </Badge>
                    <Badge 
                      variant={msg.status === "Åpen" ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {msg.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{msg.subject}</p>
                  <p className="text-xs text-muted-foreground">{msg.receivedAt}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="coupons" className="mt-0 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Coupon Vault</h3>
            <p className="text-xs text-muted-foreground">Best prices in {offers?.city}</p>
            
            {offers?.offers?.sort((a: any, b: any) => a.price - b.price).map((offer: any, index: number) => (
              <Card key={index} className="glass-card">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium">{offer.product}</p>
                    <p className="text-sm font-bold text-success">NOK {offer.price}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {offer.merchant} • {offer.unit}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Valid to {offer.validTo}
                    </p>
                    <Button size="sm" variant="outline" className="text-xs h-6">
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="audit" className="mt-0 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm text-foreground">Audit Trail</h3>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={copyAuditToClipboard}
                className="h-6 px-2"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            
            {auditLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">No audit events yet</p>
            ) : (
              auditLog.map((event) => (
                <Card key={event.id} className="glass-card">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.at).toLocaleTimeString()}
                      </p>
                    </div>
                    {Object.keys(event.slots).length > 0 && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {JSON.stringify(event.slots)}
                      </p>
                    )}
                    <div className="flex gap-1 mt-1">
                      {event.reasonCodes.map((code) => (
                        <Badge key={code} variant="secondary" className="text-xs">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};