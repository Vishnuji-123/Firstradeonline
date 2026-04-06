import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Upload, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTrades } from "@/contexts/TradesContext";

export function EmptyState() {
  const navigate = useNavigate();
  const { enableDemoMode } = useTrades();

  return (
    <Card className="border-border/50 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-heading font-bold mb-2">No trades yet</h2>
        <p className="text-muted-foreground text-sm max-w-md mb-8">
          Import your trade history to get started. Once your trades are uploaded,
          you'll see analytics, charts, and insights right here.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/import")} className="gradient-primary text-primary-foreground gap-2">
            <Upload className="h-4 w-4" /> Import Trades
          </Button>
          <Button variant="outline" onClick={enableDemoMode} className="gap-2">
            <Play className="h-4 w-4" /> Try Demo Mode
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
