import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getKPIs } from "@/lib/mockData";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine
} from "recharts";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useTrades } from "@/contexts/TradesContext";
import { EmptyState } from "@/components/EmptyState";

export default function RiskAnalytics() {
  const { filteredTrades, loading, isDemo } = useTrades();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (filteredTrades.length === 0 && !isDemo) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div><h1 className="text-2xl font-heading font-bold">Risk Analytics</h1></div>
        <EmptyState />
      </div>
    );
  }

  const kpis = getKPIs(filteredTrades);
  const sorted = [...filteredTrades].sort(
    (a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime()
  );

  let peak = 0;
  let cumPnL = 0;
  const drawdownData = sorted.map((t) => {
    cumPnL += t.profit + t.swap + t.commission;
    if (cumPnL > peak) peak = cumPnL;
    const dd = peak > 0 ? ((peak - cumPnL) / (10000 + peak)) * 100 : 0;
    return {
      date: new Date(t.close_time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      drawdown: -parseFloat(dd.toFixed(2)),
    };
  });

  const rrData: { range: string; count: number }[] = [];
  const ranges = ["<0.5", "0.5-1", "1-1.5", "1.5-2", "2-3", "3+"];
  const wins = filteredTrades.filter((t) => t.profit > 0);
  const losses = filteredTrades.filter((t) => t.profit < 0);
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.profit, 0) / losses.length) : 1;
  wins.forEach((t) => {
    const rr = t.profit / avgLoss;
    if (rr < 0.5) rrData.push({ range: "<0.5", count: 1 });
    else if (rr < 1) rrData.push({ range: "0.5-1", count: 1 });
    else if (rr < 1.5) rrData.push({ range: "1-1.5", count: 1 });
    else if (rr < 2) rrData.push({ range: "1.5-2", count: 1 });
    else if (rr < 3) rrData.push({ range: "2-3", count: 1 });
    else rrData.push({ range: "3+", count: 1 });
  });
  const rrHistogram = ranges.map((r) => ({
    range: r,
    count: rrData.filter((d) => d.range === r).length,
  }));

  const lotData = sorted.map((t, i) => ({ trade: i + 1, volume: t.volume }));
  const volumes = filteredTrades.map((t) => t.volume);
  const avgVol = volumes.reduce((s, v) => s + v, 0) / volumes.length;
  const volStd = Math.sqrt(volumes.reduce((s, v) => s + (v - avgVol) ** 2, 0) / volumes.length);

  const alerts: string[] = [];
  if (kpis.maxDrawdownPct > 10) alerts.push("High Drawdown Detected");
  if (volStd > avgVol * 0.5) alerts.push("Inconsistent Lot Sizing");

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Risk Analytics</h1>
          <p className="text-sm text-muted-foreground">Monitor risk exposure and drawdowns</p>
        </div>
        {alerts.length > 0 && (
          <div className="flex gap-2">
            {alerts.map((a) => (
              <Badge key={a} variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />{a}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Drawdown Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownData}>
                <defs>
                  <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 10%)", border: "1px solid hsl(230, 12%, 18%)", borderRadius: "8px", color: "hsl(220, 20%, 92%)", fontSize: 12 }} />
                <Area type="monotone" dataKey="drawdown" stroke="hsl(0, 72%, 51%)" fill="url(#ddGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Risk-Reward Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rrHistogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                  <XAxis dataKey="range" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 10%)", border: "1px solid hsl(230, 12%, 18%)", borderRadius: "8px", color: "hsl(220, 20%, 92%)", fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Lot Size Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lotData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                  <XAxis dataKey="trade" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 10%)", border: "1px solid hsl(230, 12%, 18%)", borderRadius: "8px", color: "hsl(220, 20%, 92%)", fontSize: 12 }} />
                  <ReferenceLine y={avgVol} stroke="hsl(38, 92%, 50%)" strokeDasharray="5 5" label={{ value: "Avg", fill: "hsl(38, 92%, 50%)", fontSize: 11 }} />
                  <Line type="stepAfter" dataKey="volume" stroke="hsl(217, 91%, 60%)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
