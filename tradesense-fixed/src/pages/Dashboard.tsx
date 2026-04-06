import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
import { Button } from "@/components/ui/button";
import {
  BarChart3, TrendingUp, TrendingDown, Activity,
  ShieldAlert, Target, DollarSign, Gauge, CalendarDays
} from "lucide-react";
import { getKPIs, getEquityCurve, getAvgPnL, getConsistencyScore, getBestWorstDay } from "@/lib/mockData";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { useTrades } from "@/contexts/TradesContext";
import { EmptyState } from "@/components/EmptyState";

export default function Dashboard() {
  const { filteredTrades, loading, isDemo, dateRange, setDateRange, exitDemoMode } = useTrades();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (filteredTrades.length === 0 && !isDemo) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your trading overview</p>
        </div>
        <EmptyState />
      </div>
    );
  }

  const kpis = getKPIs(filteredTrades);
  const equityCurve = getEquityCurve(filteredTrades);
  const recentTrades = filteredTrades.slice(0, 10);
  const avgPnL = getAvgPnL(filteredTrades);
  const consistencyScore = getConsistencyScore(filteredTrades);
  const bestWorst = getBestWorstDay(filteredTrades);
  const consistencyLabel = consistencyScore >= 71 ? "Consistent" : consistencyScore >= 41 ? "Developing" : "Erratic";

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {isDemo && <Badge variant="secondary" className="mr-2 text-xs">Demo Mode</Badge>}
            Your trading overview
          </p>
        </div>
        <div className="flex gap-2">
          {isDemo && (
            <Button variant="outline" size="sm" onClick={exitDemoMode}>Exit Demo</Button>
          )}
          {(["7d", "30d", "all"] as const).map((r) => (
            <Button key={r} variant={dateRange === r ? "default" : "outline"} size="sm"
              onClick={() => setDateRange(r)}>
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "All Time"}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard title="Total Trades" value={kpis.totalTrades} icon={BarChart3} />
        <KPICard title="Win Rate" value={kpis.winRate} suffix="%" icon={Target}
          trend={kpis.winRate >= 50 ? "positive" : "negative"} />
        <KPICard title="Net P&L" value={`$${kpis.netPnL.toLocaleString()}`} icon={kpis.netPnL >= 0 ? TrendingUp : TrendingDown}
          trend={kpis.netPnL >= 0 ? "positive" : "negative"} />
        <KPICard title="Risk/Reward" value={kpis.riskReward} icon={Activity}
          trend={kpis.riskReward >= 1 ? "positive" : "negative"} />
        <KPICard title="Max Drawdown" value={kpis.maxDrawdownPct} suffix="%" icon={ShieldAlert}
          trend={kpis.maxDrawdownPct <= 5 ? "positive" : "negative"} />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Profit Factor" value={kpis.profitFactor} icon={TrendingUp}
          trend={kpis.profitFactor >= 1 ? "positive" : "negative"} />
        <KPICard title="Avg P&L per Trade" value={`${avgPnL >= 0 ? "+" : ""}$${Math.abs(avgPnL).toFixed(2)}`} icon={DollarSign}
          trend={avgPnL >= 0 ? "positive" : "negative"} suffix="" />
        <Card className="gradient-card border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Consistency Score</p>
                <p className="text-2xl font-bold font-mono-num text-foreground">{consistencyScore}<span className="text-sm text-muted-foreground">/100</span></p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${consistencyScore >= 71 ? "bg-profit" : consistencyScore >= 41 ? "bg-warning" : "bg-loss"}`} style={{ width: `${consistencyScore}%` }} />
                  </div>
                  <span className={`text-xs font-medium ${consistencyScore >= 71 ? "text-profit" : consistencyScore >= 41 ? "text-warning" : "text-loss"}`}>{consistencyLabel}</span>
                </div>
              </div>
              <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary/10">
                <Gauge className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Best / Worst Day</p>
                {bestWorst.best ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-profit">↑ Best</span>
                      <span className="text-xs font-mono-num text-profit truncate">
                        {new Date(bestWorst.best.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · +${bestWorst.best.pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-loss">↓ Worst</span>
                      <span className="text-xs font-mono-num text-loss truncate">
                        {bestWorst.worst && new Date(bestWorst.worst.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${bestWorst.worst?.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </div>
              <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary/10">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equity Curve */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(230, 14%, 10%)",
                    border: "1px solid hsl(230, 12%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(220, 20%, 92%)",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Equity"]}
                />
                <Area type="monotone" dataKey="equity" stroke="hsl(217, 91%, 60%)" fill="url(#equityGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Trades Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium text-xs uppercase">Date</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium text-xs uppercase">Symbol</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium text-xs uppercase">Direction</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium text-xs uppercase">Lots</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium text-xs uppercase">P&L</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium text-xs uppercase">Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-mono-num text-xs">
                      {new Date(t.close_time).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 font-medium">{t.symbol}</td>
                    <td className="py-3 px-2">
                      <Badge variant={t.trade_type === "buy" ? "default" : "secondary"} className="text-xs">
                        {t.trade_type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right font-mono-num">{t.volume}</td>
                    <td className={`py-3 px-2 text-right font-mono-num font-medium ${t.profit >= 0 ? "text-profit" : "text-loss"}`}>
                      {t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono-num text-muted-foreground text-xs">
                      {t.duration_minutes < 60
                        ? `${t.duration_minutes}m`
                        : `${Math.floor(t.duration_minutes / 60)}h ${t.duration_minutes % 60}m`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
