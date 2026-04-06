import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, RefreshCw, Trash2, Info, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTrades } from "@/contexts/TradesContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

function getSessionFromHour(hour: number): string {
  if (hour >= 0 && hour <= 7) return "Asian";
  if (hour >= 8 && hour <= 12) return "London";
  if (hour >= 13 && hour <= 20) return "NewYork";
  return "Asian";
}

export default function Import() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch } = useTrades();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<{ count: number; symbols: string[] } | null>(null);

  const handleResetTrades = async () => {
    if (!user) return;
    setResetting(true);
    const { error } = await supabase.from("trades").delete().eq("user_id", user.id);
    setResetting(false);
    setResetDialogOpen(false);
    if (error) {
      toast({ title: "Error", description: "Failed to reset trades.", variant: "destructive" });
    } else {
      toast({ title: "Trades Reset", description: "All your trades have been removed." });
      refetch();
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile || !user) return;
    setCsvUploading(true);
    try {
      const text = await csvFile.text();
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const trades = lines.slice(1).filter(l => l.trim()).map(line => {
        const vals = line.split(",");
        const row: any = {};
        headers.forEach((h, i) => { row[h] = vals[i]?.trim() || ""; });
        const openTime = new Date(row.open_time || row["open time"] || row.time);
        const closeTime = new Date(row.close_time || row["close time"] || row.time);
        const dur = Math.max(1, Math.round((closeTime.getTime() - openTime.getTime()) / 60000));
        const hour = openTime.getUTCHours();
        return {
          ticket: Number(row.ticket || 0),
          symbol: row.symbol || "",
          trade_type: (row.type || row.trade_type || "buy").toLowerCase(),
          volume: Number(row.volume || row.lots || 0),
          open_price: Number(row.open_price || row["open price"] || 0),
          close_price: Number(row.close_price || row["close price"] || 0),
          open_time: openTime.toISOString(),
          close_time: closeTime.toISOString(),
          commission: Number(row.commission || 0),
          swap: Number(row.swap || 0),
          profit: Number(row.profit || 0),
          duration_minutes: dur,
          session: getSessionFromHour(hour),
          user_id: user.id,
        };
      }).filter(t => t.symbol && t.ticket);

      if (trades.length === 0) {
        toast({ title: "No valid trades", description: "CSV didn't contain valid trade data.", variant: "destructive" });
        setCsvUploading(false);
        return;
      }
      const { error } = await supabase.from("trades").insert(trades);
      if (error) {
        toast({ title: "Error", description: "Failed to import trades.", variant: "destructive" });
      } else {
        const symbols = [...new Set(trades.map(t => t.symbol))];
        setImportSuccess({ count: trades.length, symbols });
        toast({ title: "Imported", description: `${trades.length} trades imported successfully.` });
        refetch();
      }
    } catch {
      toast({ title: "Error", description: "Failed to parse CSV file.", variant: "destructive" });
    }
    setCsvUploading(false);
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Import Your Trades</h1>
        <p className="text-sm text-muted-foreground">Upload your trade history from any trading platform</p>
      </div>

      {/* How to Export */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-heading">How to Export Your Trades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Open your trading platform",
            "Go to Trade History section",
            "Export history as CSV file",
            "Upload the file below",
          ].map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                {i + 1}
              </div>
              <p className="text-sm text-muted-foreground">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Import Success */}
      {importSuccess && (
        <Card className="border-profit/30 bg-profit/5">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-profit/20 flex items-center justify-center">
                <span className="text-profit text-sm">✓</span>
              </div>
              <p className="font-heading font-bold">{importSuccess.count} trades imported successfully</p>
            </div>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Symbols:</span> {importSuccess.symbols.join(", ")}</p>
            </div>
            <Button className="gradient-primary text-primary-foreground" onClick={() => navigate("/dashboard")}>
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CSV Upload */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-heading">Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border border-border/50">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Supported format: CSV file with columns: Ticket, Symbol, Type, Volume, Open Price, Close Price, Open Time, Close Time, Profit, Swap, Commission
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="csvfile">CSV File</Label>
            <Input id="csvfile" type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex gap-3">
            <Button className="gradient-primary text-primary-foreground" onClick={handleCSVUpload} disabled={!csvFile || csvUploading}>
              {csvUploading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Importing...</> : <><Upload className="h-4 w-4 mr-2" /> Import Trades</>}
            </Button>
            <Button variant="destructive" onClick={() => setResetDialogOpen(true)} disabled={resetting}>
              <Trash2 className="h-4 w-4 mr-2" /> Reset All Trades
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Trades</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your imported trades. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetTrades} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={resetting}>
              {resetting ? "Deleting..." : "Delete All Trades"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
