import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trade } from "@/lib/mockData";
import { useTrades } from "@/contexts/TradesContext";
import { EmptyState } from "@/components/EmptyState";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine
} from "recharts";
import { Clock, AlertTriangle, Target, Lightbulb, Star } from "lucide-react";

interface SessionStats {
  name: string;
  emoji: string;
  trades: Trade[];
  winRate: number;
  netPnL: number;
  avgPnL: number;
  profitFactor: number;
  avgDuration: number;
  bestSymbol: string;
  tradeCount: number;
}

function computeSessionStats(trades: Trade[], sessionName: string, emoji: string): SessionStats {
  const sessionTrades = trades.filter(t => t.session === sessionName);
  const wins = sessionTrades.filter(t => t.profit > 0);
  const losses = sessionTrades.filter(t => t.profit < 0);
  const winRate = sessionTrades.length > 0 ? (wins.length / sessionTrades.length) * 100 : 0;
  const netPnL = sessionTrades.reduce((s, t) => s + t.profit + t.swap + t.commission, 0);
  const avgPnL = sessionTrades.length > 0 ? netPnL / sessionTrades.length : 0;
  const grossProfit = wins.reduce((s, t) => s + t.profit, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const avgDuration = sessionTrades.length > 0 ? sessionTrades.reduce((s, t) => s + t.duration_minutes, 0) / sessionTrades.length : 0;

  const symbolMap: Record<string, number> = {};
  sessionTrades.forEach(t => { symbolMap[t.symbol] = (symbolMap[t.symbol] || 0) + t.profit; });
  const bestSymbol = Object.entries(symbolMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  return { name: sessionName, emoji, trades: sessionTrades, winRate, netPnL, avgPnL, profitFactor, avgDuration, bestSymbol, tradeCount: sessionTrades.length };
}

export default function SessionAnalysis() {
  const { filteredTrades, loading, isDemo } = useTrades();
  const [chartTab, setChartTab] = useState("pnl");
  const [hourMetric, setHourMetric] = useState("avgPnL");

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const SESSION_NAMES = ["Asian", "London", "New York"];

  const heatmapData = useMemo(() => {
    if (filteredTrades.length === 0) return {};
    const data: Record<string, Record<string, { pnl: number; count: number; winRate: number }>> = {};
    DAYS.forEach(d => {
      data[d] = {};
      SESSION_NAMES.forEach(s => { data[d][s] = { pnl: 0, count: 0, winRate: 0 }; });
    });
    filteredTrades.forEach(t => {
      const d = new Date(t.open_time);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      if (!DAYS.includes(dayName)) return;
      const session = t.session;
      if (!data[dayName][session]) return;
      data[dayName][session].pnl += t.profit + t.swap + t.commission;
      data[dayName][session].count++;
    });
    DAYS.forEach(d => {
      SESSION_NAMES.forEach(s => {
        const cell = data[d][s];
        if (cell.count > 0) {
          cell.pnl = cell.pnl / cell.count;
          const sessionDayTrades = filteredTrades.filter(t => {
            const td = new Date(t.open_time);
            return td.toLocaleDateString("en-US", { weekday: "short" }) === d && t.session === s;
          });
          const wins = sessionDayTrades.filter(t => t.profit > 0).length;
          cell.winRate = (wins / cell.count) * 100;
        }
      });
    });
    return data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTrades]);

  const symbolSessionData = useMemo(() => {
    if (filteredTrades.length === 0) return [];
    const symbols = [...new Set(filteredTrades.map(t => t.symbol))];
    return symbols.map(sym => {
      const bySession: Record<string, number> = {};
      SESSION_NAMES.forEach(s => {
        bySession[s] = filteredTrades
          .filter(t => t.symbol === sym && t.session === s)
          .reduce((sum, t) => sum + t.profit + t.swap + t.commission, 0);
      });
      const best = Object.entries(bySession).sort((a, b) => b[1] - a[1])[0];
      return { symbol: sym, ...bySession, bestSession: best[0] };
    }).sort((a, b) => {
      const totalA = SESSION_NAMES.reduce((s, sn) => s + ((a as any)[sn] || 0), 0);
      const totalB = SESSION_NAMES.reduce((s, sn) => s + ((b as any)[sn] || 0), 0);
      return totalB - totalA;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTrades]);

  const hourlyData = useMemo(() => {
    const hours: { hour: number; avgPnL: number; winRate: number; count: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const hourTrades = filteredTrades.filter(t => new Date(t.open_time).getUTCHours() === h);
      const wins = hourTrades.filter(t => t.profit > 0).length;
      const totalPnL = hourTrades.reduce((s, t) => s + t.profit + t.swap + t.commission, 0);
      hours.push({
        hour: h,
        avgPnL: hourTrades.length > 0 ? totalPnL / hourTrades.length : 0,
        winRate: hourTrades.length > 0 ? (wins / hourTrades.length) * 100 : 0,
        count: hourTrades.length,
      });
    }
    return hours;
  }, [filteredTrades]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (filteredTrades.length === 0 && !isDemo) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div><h1 className="text-2xl font-heading font-bold">Session Analysis</h1></div>
        <EmptyState />
      </div>
    );
  }

  const sessions = [
    computeSessionStats(filteredTrades, "Asian", "🌏"),
    computeSessionStats(filteredTrades, "London", "🇬🇧"),
    computeSessionStats(filteredTrades, "New York", "🇺🇸"),
  ];

  const bestSession = [...sessions].sort((a, b) => b.netPnL - a.netPnL)[0];
  const worstSession = [...sessions].filter(s => s.tradeCount >= 1).sort((a, b) => a.netPnL - b.netPnL)[0];

  const days = DAYS;
  const sessionNames = SESSION_NAMES;

  // Find best and worst combos
  let bestCombo = { day: "", session: "", pnl: -Infinity, winRate: 0 };
  let worstCombo = { day: "", session: "", pnl: Infinity, winRate: 0 };
  days.forEach(d => {
    if (!heatmapData[d]) return;
    sessionNames.forEach(s => {
      const cell = heatmapData[d]?.[s];
      if (cell && cell.count > 0) {
        if (cell.pnl > bestCombo.pnl) bestCombo = { day: d, session: s, pnl: cell.pnl, winRate: cell.winRate };
        if (cell.pnl < worstCombo.pnl) worstCombo = { day: d, session: s, pnl: cell.pnl, winRate: cell.winRate };
      }
    });
  });

  const bestHours = [...hourlyData].filter(h => h.count > 0).sort((a, b) => b.avgPnL - a.avgPnL).slice(0, 3);
  const worstHours = [...hourlyData].filter(h => h.count > 0).sort((a, b) => a.avgPnL - b.avgPnL).slice(0, 2);

  // Overlap trades (13-16 UTC)
  const overlapTrades = filteredTrades.filter(t => {
    const h = new Date(t.open_time).getUTCHours();
    return h >= 13 && h < 16;
  });
  const overlapWR = overlapTrades.length > 0 ? (overlapTrades.filter(t => t.profit > 0).length / overlapTrades.length) * 100 : 0;

  const getHeatColor = (val: number) => {
    if (val > 30) return "bg-[hsl(160,84%,39%)] text-white";
    if (val > 0) return "bg-[hsl(160,84%,39%,0.3)] text-profit";
    if (val === 0) return "bg-muted text-muted-foreground";
    if (val > -30) return "bg-[hsl(0,72%,51%,0.3)] text-loss";
    return "bg-[hsl(0,72%,51%)] text-white";
  };

  const tooltipStyle = {
    backgroundColor: "hsl(230, 14%, 10%)",
    border: "1px solid hsl(230, 12%, 18%)",
    borderRadius: "8px",
    color: "hsl(220, 20%, 92%)",
    fontSize: 12,
  };

  const mostActiveSess = [...sessions].sort((a, b) => b.tradeCount - a.tradeCount)[0];
  const mostProfitableSess = [...sessions].sort((a, b) => b.netPnL - a.netPnL)[0];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold">Session Analysis</h1>
        <p className="text-sm text-muted-foreground">Discover which market session makes you money</p>
      </div>

      {/* Explainer */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Global forex markets operate in 3 major sessions. Understanding your performance in each session helps you focus your trading time where your edge is strongest.
          </p>
          <div className="grid sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded bg-muted/50">🌏 Asian Session · 00:00–08:00 UTC</div>
            <div className="p-2 rounded bg-muted/50">🇬🇧 London Session · 08:00–16:00 UTC</div>
            <div className="p-2 rounded bg-muted/50">🇺🇸 New York Session · 13:00–21:00 UTC</div>
            <div className="p-2 rounded bg-muted/50">⚡ Overlap · 13:00–16:00 UTC</div>
          </div>
          <p className="text-xs text-muted-foreground italic">Sessions overlap — a trade opened at 14:00 UTC falls in both London and New York. Firstrade uses the primary session based on open time.</p>
        </CardContent>
      </Card>

      {/* SECTION 1: Session Overview Cards */}
      <div className="grid lg:grid-cols-3 gap-4">
        {sessions.map(s => (
          <Card key={s.name} className={`border-border/50 ${s.name === bestSession.name ? "ring-1 ring-primary" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  {s.emoji} {s.name}
                  {s.name === bestSession.name && <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Your Best Session</Badge>}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">{s.tradeCount} trades</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {s.tradeCount < 5 ? (
                <p className="text-sm text-muted-foreground italic">Insufficient data (need 5+ trades)</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Win Rate</span>
                      <p className={`font-mono-num font-medium ${s.winRate >= 50 ? "text-profit" : "text-loss"}`}>{s.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Net P&L</span>
                      <p className={`font-mono-num font-medium ${s.netPnL >= 0 ? "text-profit" : "text-loss"}`}>
                        {s.netPnL >= 0 ? "+" : ""}${s.netPnL.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Avg P&L</span>
                      <p className={`font-mono-num text-sm ${s.avgPnL >= 0 ? "text-profit" : "text-loss"}`}>
                        {s.avgPnL >= 0 ? "+" : ""}${s.avgPnL.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Profit Factor</span>
                      <p className="font-mono-num text-sm">{s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Avg Duration</span>
                      <p className="font-mono-num text-sm">{Math.round(s.avgDuration)} min</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Best Symbol</span>
                      <p className="font-medium text-sm">{s.bestSymbol}</p>
                    </div>
                  </div>
                  <Badge variant={s.netPnL >= 0 ? "default" : "destructive"} className="text-xs">
                    {s.netPnL >= 0 ? "Profitable Session" : "Losing Session"}
                  </Badge>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SECTION 2: Session Comparison Charts */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Session Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={chartTab} onValueChange={setChartTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pnl">P&L</TabsTrigger>
              <TabsTrigger value="winRate">Win Rate</TabsTrigger>
              <TabsTrigger value="count">Trade Count</TabsTrigger>
              <TabsTrigger value="duration">Avg Duration</TabsTrigger>
            </TabsList>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessions.map(s => ({
                  name: s.name,
                  value: chartTab === "pnl" ? s.netPnL : chartTab === "winRate" ? s.winRate : chartTab === "count" ? s.tradeCount : s.avgDuration
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }}
                    tickFormatter={v => chartTab === "pnl" ? `$${v}` : chartTab === "winRate" ? `${v}%` : chartTab === "duration" ? `${v}m` : `${v}`}
                  />
                  {chartTab === "winRate" && <ReferenceLine y={50} stroke="hsl(38, 92%, 50%)" strokeDasharray="5 5" />}
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {sessions.map((s, i) => (
                      <Cell key={i} fill={
                        chartTab === "pnl" ? (s.netPnL >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)") :
                        chartTab === "winRate" ? (s.winRate >= 50 ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)") :
                        "hsl(217, 91%, 60%)"
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {chartTab === "count" && mostActiveSess.name !== mostProfitableSess.name && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 You trade most in {mostActiveSess.name} but earn most in {mostProfitableSess.name}
              </p>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* SECTION 3: Session Heatmap */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Performance by Day & Session</CardTitle>
          <p className="text-xs text-muted-foreground">Which combination of day + session works best for you</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs"></th>
                  {sessionNames.map(s => (
                    <th key={s} className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map(d => (
                  <tr key={d} className="border-b border-border/30">
                    <td className="py-2 px-3 font-medium text-xs">{d}</td>
                    {sessionNames.map(s => {
                      const cell = heatmapData[d][s];
                      return (
                        <td key={s} className="py-2 px-3 text-center">
                          {cell.count === 0 ? (
                            <span className="text-muted-foreground/50 text-xs">—</span>
                          ) : (
                            <div className={`rounded px-2 py-1 ${getHeatColor(cell.pnl)}`}>
                              <p className="font-mono-num text-xs font-medium">{cell.pnl >= 0 ? "+" : ""}${cell.pnl.toFixed(0)}</p>
                              <p className="text-[10px] opacity-75">{cell.count} trades</p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 space-y-1 text-xs">
            {bestCombo.day && (
              <p className="text-profit">🟢 Best combo: {bestCombo.day} + {bestCombo.session} ({bestCombo.winRate.toFixed(0)}% win rate, avg +${bestCombo.pnl.toFixed(2)})</p>
            )}
            {worstCombo.day && worstCombo.pnl < 0 && (
              <p className="text-loss">🔴 Avoid: {worstCombo.day} + {worstCombo.session} ({worstCombo.winRate.toFixed(0)}% win rate, avg ${worstCombo.pnl.toFixed(2)})</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: Symbol Performance by Session */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">How your symbols perform across sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Symbol</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Asian P&L</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">London P&L</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">NY P&L</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Best Session</th>
                </tr>
              </thead>
              <tbody>
                {symbolSessionData.slice(0, 8).map(row => (
                  <tr key={row.symbol} className="border-b border-border/30">
                    <td className="py-2 px-3 font-medium">{row.symbol}</td>
                    {sessionNames.map(s => {
                      const val = (row as any)[s] as number;
                      return (
                        <td key={s} className={`py-2 px-3 text-right font-mono-num text-xs ${val >= 0 ? "text-profit" : "text-loss"}`}>
                          {val >= 0 ? "+" : ""}${val.toFixed(2)}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-xs">
                      {row.bestSession} <Star className="h-3 w-3 inline text-primary" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {symbolSessionData.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              💡 {symbolSessionData[0].symbol} performs best in the {symbolSessionData[0].bestSession} session. Consider specializing here.
            </p>
          )}
        </CardContent>
      </Card>

      {/* SECTION 5: Time of Day Analysis */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-heading">Your performance by hour of day</CardTitle>
              <p className="text-xs text-muted-foreground">All times shown in UTC</p>
            </div>
            <Tabs value={hourMetric} onValueChange={setHourMetric}>
              <TabsList className="h-8">
                <TabsTrigger value="avgPnL" className="text-xs h-7">Avg P&L</TabsTrigger>
                <TabsTrigger value="winRate" className="text-xs h-7">Win Rate</TabsTrigger>
                <TabsTrigger value="count" className="text-xs h-7">Count</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                <XAxis dataKey="hour" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 10 }}
                  tickFormatter={v => `${v}:00`} />
                <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 10 }}
                  tickFormatter={v => hourMetric === "avgPnL" ? `$${v}` : hourMetric === "winRate" ? `${v}%` : `${v}`} />
                {hourMetric === "winRate" && <ReferenceLine y={50} stroke="hsl(38, 92%, 50%)" strokeDasharray="5 5" />}
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [
                    hourMetric === "avgPnL" ? `$${value.toFixed(2)}` : hourMetric === "winRate" ? `${value.toFixed(1)}%` : value,
                    hourMetric === "avgPnL" ? "Avg P&L" : hourMetric === "winRate" ? "Win Rate" : "Trades"
                  ]}
                  labelFormatter={(label) => `${label}:00 – ${Number(label) + 1}:00 UTC`}
                />
                <Bar dataKey={hourMetric} radius={[2, 2, 0, 0]}>
                  {hourlyData.map((h, i) => (
                    <Cell key={i} fill={
                      hourMetric === "avgPnL" ? (h.avgPnL >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)") :
                      hourMetric === "winRate" ? (h.winRate >= 50 ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)") :
                      "hsl(217, 91%, 60%)"
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-profit">Best Hours</p>
              {bestHours.map(h => (
                <p key={h.hour} className="text-xs text-muted-foreground">
                  🟢 {h.hour}:00–{h.hour + 1}:00 UTC → avg +${h.avgPnL.toFixed(2)} · {h.winRate.toFixed(0)}% win rate
                </p>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-loss">Worst Hours</p>
              {worstHours.map(h => (
                <p key={h.hour} className="text-xs text-muted-foreground">
                  🔴 {h.hour}:00–{h.hour + 1}:00 UTC → avg ${h.avgPnL.toFixed(2)} · {h.winRate.toFixed(0)}% win rate
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 6: Session Coaching Insights */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-profit/30 bg-profit/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-profit" />
              <p className="text-sm font-medium">Focus on {bestSession.name} Session</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Your {bestSession.name} stats: {bestSession.winRate.toFixed(1)}% win rate · ${bestSession.netPnL >= 0 ? "+" : ""}{bestSession.netPnL.toFixed(2)} total · {bestSession.profitFactor === Infinity ? "∞" : bestSession.profitFactor.toFixed(2)} profit factor. This is where your trading edge is strongest. Consider allocating 70% of your trades to this session.
            </p>
          </CardContent>
        </Card>

        {worstSession && worstSession.netPnL < 0 && (
          <Card className="border-loss/30 bg-loss/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-loss" />
                <p className="text-sm font-medium">Reconsider {worstSession.name} Session</p>
              </div>
              <p className="text-xs text-muted-foreground">
                You have lost ${Math.abs(worstSession.netPnL).toFixed(2)} across {worstSession.tradeCount} trades in {worstSession.name}. Win rate: {worstSession.winRate.toFixed(1)}%. Try removing this session for 2 weeks and track if your overall P&L improves.
              </p>
            </CardContent>
          </Card>
        )}

        {overlapTrades.length >= 3 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">London/New York Overlap Performance</p>
              </div>
              <p className="text-xs text-muted-foreground">
                The 13:00–16:00 UTC overlap is the highest volatility period. Your overlap win rate: {overlapWR.toFixed(1)}%.
                {overlapWR >= 50
                  ? " This volatility suits your style — consider trading more during this window."
                  : " High volatility may be working against you. Stick to calmer sessions like early London."}
              </p>
            </CardContent>
          </Card>
        )}

        {bestHours.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Your Golden Hours: {bestHours[0].hour}:00–{Math.min(bestHours[0].hour + 2, 23)}:00 UTC</p>
              </div>
              <p className="text-xs text-muted-foreground">
                You make an average of ${bestHours[0].avgPnL.toFixed(2)} per trade during this window with {bestHours[0].winRate.toFixed(0)}% win rate. If you can only trade for 2 hours a day, make it these 2 hours.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
