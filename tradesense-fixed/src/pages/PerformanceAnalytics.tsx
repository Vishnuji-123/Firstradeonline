import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKPIs, getEquityCurve, getPnLBySymbol } from "@/lib/mockData";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { useTrades } from "@/contexts/TradesContext";
import { EmptyState } from "@/components/EmptyState";

export default function PerformanceAnalytics() {
  const { filteredTrades, loading, isDemo } = useTrades();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (filteredTrades.length === 0 && !isDemo) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div><h1 className="text-2xl font-heading font-bold">Performance Analytics</h1></div>
        <EmptyState />
      </div>
    );
  }

  const symbolPnL = getPnLBySymbol(filteredTrades);
  const wins = filteredTrades.filter((t) => t.profit > 0).length;
  const losses = filteredTrades.filter((t) => t.profit <= 0).length;
  const winLossData = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
  ];

  const pnlPerTrade = filteredTrades.slice(0, 50).map((t, i) => ({
    trade: i + 1,
    pnl: t.profit,
  }));

  let cum = 0;
  const cumPnL = [...filteredTrades]
    .sort((a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime())
    .map((t) => {
      cum += t.profit;
      return {
        date: new Date(t.close_time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        cumPnL: parseFloat(cum.toFixed(2)),
      };
    });

  const COLORS = ["hsl(160, 84%, 39%)", "hsl(0, 72%, 51%)"];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-heading font-bold">Performance Analytics</h1>
        <p className="text-sm text-muted-foreground">Detailed performance breakdown</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Win/Loss Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={winLossData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                    {winLossData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 10%)", border: "1px solid hsl(230, 12%, 18%)", borderRadius: "8px", color: "hsl(220, 20%, 92%)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-profit" />Wins: {wins}</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-loss" />Losses: {losses}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">P&L per Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlPerTrade}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                  <XAxis dataKey="trade" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 10%)", border: "1px solid hsl(230, 12%, 18%)", borderRadius: "8px", color: "hsl(220, 20%, 92%)", fontSize: 12 }} />
                  <Bar dataKey="pnl" fill="hsl(217, 91%, 60%)">
                    {pnlPerTrade.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Cumulative P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumPnL}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 10%)", border: "1px solid hsl(230, 12%, 18%)", borderRadius: "8px", color: "hsl(220, 20%, 92%)", fontSize: 12 }} />
                <Area type="monotone" dataKey="cumPnL" stroke="hsl(160, 84%, 39%)" fill="url(#cumGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">P&L by Symbol</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symbolPnL} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                <XAxis type="number" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="symbol" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} width={70} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 10%)", border: "1px solid hsl(230, 12%, 18%)", borderRadius: "8px", color: "hsl(220, 20%, 92%)", fontSize: 12 }} />
                <Bar dataKey="pnl">
                  {symbolPnL.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
