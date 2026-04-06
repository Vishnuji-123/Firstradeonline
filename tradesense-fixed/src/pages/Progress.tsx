import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getKPIs, getConsistencyScore, getAvgPnL, getDailyPnLMap, getBestWorstDay, getTradesPerDay } from "@/lib/mockData";
import { useTrades } from "@/contexts/TradesContext";
import { EmptyState } from "@/components/EmptyState";
import { Target, ShieldAlert, Gauge, Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface ScoreCard {
  name: string;
  icon: any;
  pointsEarned: number;
  pointsMax: number;
  actualValue: string;
  status: "Strong" | "Good" | "Needs Work" | "Critical";
}

function getWinRateScore(wr: number): { pts: number; status: ScoreCard["status"] } {
  if (wr >= 60) return { pts: 30, status: "Strong" };
  if (wr >= 55) return { pts: 24, status: "Good" };
  if (wr >= 50) return { pts: 18, status: "Needs Work" };
  if (wr >= 45) return { pts: 10, status: "Needs Work" };
  return { pts: 4, status: "Critical" };
}

function getRRScore(rr: number): { pts: number; status: ScoreCard["status"] } {
  if (rr >= 2.0) return { pts: 25, status: "Strong" };
  if (rr >= 1.5) return { pts: 20, status: "Good" };
  if (rr >= 1.0) return { pts: 13, status: "Needs Work" };
  return { pts: 4, status: "Critical" };
}

function getDDScore(dd: number): { pts: number; status: ScoreCard["status"] } {
  if (dd <= 5) return { pts: 25, status: "Strong" };
  if (dd <= 8) return { pts: 20, status: "Good" };
  if (dd <= 12) return { pts: 13, status: "Needs Work" };
  if (dd <= 18) return { pts: 6, status: "Critical" };
  return { pts: 0, status: "Critical" };
}

function getConsScore(c: number): { pts: number; status: ScoreCard["status"] } {
  if (c >= 80) return { pts: 20, status: "Strong" };
  if (c >= 65) return { pts: 15, status: "Good" };
  if (c >= 45) return { pts: 9, status: "Needs Work" };
  return { pts: 3, status: "Critical" };
}

const statusColors: Record<string, string> = {
  Strong: "bg-profit/20 text-profit border-profit/30",
  Good: "bg-primary/20 text-primary border-primary/30",
  "Needs Work": "bg-warning/20 text-warning border-warning/30",
  Critical: "bg-loss/20 text-loss border-loss/30",
};

export default function Progress() {
  const { filteredTrades, loading, isDemo } = useTrades();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (filteredTrades.length === 0 && !isDemo) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div><h1 className="text-2xl font-heading font-bold">Progress & Readiness</h1></div>
        <EmptyState />
      </div>
    );
  }

  const kpis = getKPIs(filteredTrades);
  const consistency = getConsistencyScore(filteredTrades);
  const avgPnL = getAvgPnL(filteredTrades);
  const bestWorst = getBestWorstDay(filteredTrades);
  const dailyPnL = getDailyPnLMap(filteredTrades);
  const tradesPerDay = getTradesPerDay(filteredTrades);
  const overtradeDays = tradesPerDay.filter(d => d.count > 5).length;

  const wrScore = getWinRateScore(kpis.winRate);
  const rrScore = getRRScore(kpis.riskReward);
  const ddScore = getDDScore(kpis.maxDrawdownPct);
  const csScore = getConsScore(consistency);
  const overtradePenalty = overtradeDays * 2;

  const totalScore = Math.max(0, Math.min(100, wrScore.pts + rrScore.pts + ddScore.pts + csScore.pts - overtradePenalty));

  const scoreLabel = totalScore >= 81 ? "Ready to Go Live" : totalScore >= 61 ? "Almost There" : totalScore >= 41 ? "Building Good Habits" : "Not Ready for Live Trading";
  const scoreColor = totalScore >= 81 ? "hsl(160, 84%, 39%)" : totalScore >= 61 ? "hsl(239, 84%, 67%)" : totalScore >= 41 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)";

  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (totalScore / 100) * circumference;

  const wins = filteredTrades.filter(t => t.profit > 0);
  const losses = filteredTrades.filter(t => t.profit < 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));
  const grossProfit = wins.reduce((s, t) => s + t.profit, 0);
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const dailyVals = Object.values(dailyPnL);
  const pnlRange = dailyVals.length > 0 ? Math.max(...dailyVals) - Math.min(...dailyVals) : 0;

  // Break-even WR for poor RR
  const breakEvenWR = kpis.riskReward > 0 ? (1 / (1 + kpis.riskReward)) * 100 : 100;

  // Best symbol by RR
  const symbolRR: Record<string, { wins: number; losses: number; grossW: number; grossL: number }> = {};
  filteredTrades.forEach(t => {
    if (!symbolRR[t.symbol]) symbolRR[t.symbol] = { wins: 0, losses: 0, grossW: 0, grossL: 0 };
    if (t.profit > 0) { symbolRR[t.symbol].wins++; symbolRR[t.symbol].grossW += t.profit; }
    else { symbolRR[t.symbol].losses++; symbolRR[t.symbol].grossL += Math.abs(t.profit); }
  });
  const bestSymbolRR = Object.entries(symbolRR)
    .map(([sym, d]) => ({ sym, rr: d.losses > 0 && d.wins > 0 ? (d.grossW / d.wins) / (d.grossL / d.losses) : 0 }))
    .sort((a, b) => b.rr - a.rr)[0];

  // Recovery needed for drawdown
  const recoveryNeeded = kpis.maxDrawdownPct > 0 ? ((kpis.maxDrawdownPct / (100 - kpis.maxDrawdownPct)) * 100) : 0;
  const drawdownAmount = (kpis.maxDrawdownPct / 100) * 10000;

  const scoreCards: ScoreCard[] = [
    { name: "Win Rate", icon: Target, pointsEarned: wrScore.pts, pointsMax: 30, actualValue: `Win Rate: ${kpis.winRate}%`, status: wrScore.status },
    { name: "Risk-Reward", icon: Activity, pointsEarned: rrScore.pts, pointsMax: 25, actualValue: `R:R Ratio: ${kpis.riskReward}`, status: rrScore.status },
    { name: "Drawdown", icon: ShieldAlert, pointsEarned: ddScore.pts, pointsMax: 25, actualValue: `Max DD: ${kpis.maxDrawdownPct}%`, status: ddScore.status },
    { name: "Consistency", icon: Gauge, pointsEarned: csScore.pts, pointsMax: 20, actualValue: `Score: ${consistency}/100`, status: csScore.status },
  ];

  // Feedback sections
  const criticalFeedback: { title: string; metric: string; happening: string; matters: string; actions: string[] }[] = [];
  const warningFeedback: { title: string; right: string; risk: string; tip: string }[] = [];
  const strengthFeedback: { title: string; achievement: string; edge: string; protect: string }[] = [];

  // Win rate
  if (wrScore.status === "Critical" || wrScore.status === "Needs Work") {
    criticalFeedback.push({
      title: "Your entries need significant improvement",
      metric: `Win Rate: ${kpis.winRate}%`,
      happening: `You are winning ${kpis.winRate.toFixed(1)}% of trades. Out of your last ${kpis.totalTrades} trades, ${losses.length} closed at a loss totaling -$${grossLoss.toFixed(2)}.`,
      matters: "A win rate below 50% means your strategy has no statistical edge. Even with good RR, you need consistent entries to be profitable long-term.",
      actions: [
        "Write down your entry rules. If you cannot explain in one sentence why you entered a trade, skip it.",
        `For the next 20 trades, only enter if 3 conditions align: trend direction, key level, and confirmation candle. No exceptions.`,
        `Review your last ${losses.length} losing trades. Find the 1 most common mistake and eliminate it first.`,
      ],
    });
  } else if (wrScore.status === "Good") {
    warningFeedback.push({ title: "Win Rate", right: `${kpis.winRate}% win rate shows your entries are developing well.`, risk: "A small losing streak could drop you below 50%.", tip: "Journal every trade entry to identify what makes your best setups." });
  } else {
    strengthFeedback.push({ title: "Win Rate", achievement: `${kpis.winRate}% win rate across ${kpis.totalTrades} trades — this is excellent.`, edge: "Consistent winning entries are the foundation of live trading success.", protect: "Don't change what's working. Document your entry criteria." });
  }

  // RR
  if (rrScore.status === "Critical" || rrScore.status === "Needs Work") {
    criticalFeedback.push({
      title: "You are risking more than you win",
      metric: `R:R: ${kpis.riskReward}`,
      happening: `Your average winning trade makes $${avgWin.toFixed(2)} but your average losing trade costs $${avgLoss.toFixed(2)}. You need a ${breakEvenWR.toFixed(0)}% win rate just to break even.`,
      matters: "Poor RR is the #1 reason profitable strategies become unprofitable. One bad run wipes multiple good runs.",
      actions: [
        "Before every trade, set a take profit that is at least 1.5× your stop loss distance. No exceptions.",
        "Move your stop loss to breakeven once price moves 1× your risk in your favor.",
        bestSymbolRR ? `Your ${bestSymbolRR.sym} has the best RR at ${bestSymbolRR.rr.toFixed(2)}. Study those trades and replicate the setup.` : "Analyze which setups give you the best RR and focus on those.",
      ],
    });
  } else if (rrScore.status === "Good") {
    warningFeedback.push({ title: "Risk-Reward", right: `${kpis.riskReward} R:R shows your winners are outpacing losers.`, risk: "Cutting winners short could erode this ratio.", tip: "Use partial take profits to lock in gains while letting runners continue." });
  } else {
    strengthFeedback.push({ title: "Risk-Reward", achievement: `${kpis.riskReward} R:R — your winners significantly outpace your losers.`, edge: "This means you can afford some losing trades and still be profitable.", protect: "Keep your stop losses disciplined and let winners run." });
  }

  // Drawdown
  if (ddScore.status === "Critical" || ddScore.status === "Needs Work") {
    criticalFeedback.push({
      title: "Your account is in a dangerous drawdown",
      metric: `Max DD: ${kpis.maxDrawdownPct}%`,
      happening: `Your account has dropped ${kpis.maxDrawdownPct.toFixed(1)}% from its peak — a $${drawdownAmount.toFixed(0)} swing on a $10,000 account.`,
      matters: `To recover a ${kpis.maxDrawdownPct.toFixed(1)}% loss you need a ${recoveryNeeded.toFixed(1)}% gain. The deeper the hole, the harder to climb out. Professional traders quit at 10% drawdown.`,
      actions: [
        "Reduce your lot size by 50% immediately. Trade at half size until you string together 5 profitable trades.",
        "Set a daily loss limit of 2% ($200 on $10k). When hit, close the platform and stop for the day.",
        "Do not try to 'recover' losses in one trade. Revenge trading digs deeper holes.",
      ],
    });
  } else if (ddScore.status === "Good") {
    warningFeedback.push({ title: "Drawdown", right: `${kpis.maxDrawdownPct}% max drawdown shows decent risk control.`, risk: "A few bad trades could push you past 10%.", tip: "Consider setting a hard daily loss limit of 2% of your account." });
  } else {
    strengthFeedback.push({ title: "Drawdown Control", achievement: `${kpis.maxDrawdownPct}% max drawdown — exceptional risk management.`, edge: "Low drawdown means you preserve capital and recover quickly from losses.", protect: "Maintain strict position sizing rules." });
  }

  // Consistency
  if (csScore.status === "Critical" || csScore.status === "Needs Work") {
    criticalFeedback.push({
      title: "Your results are highly unpredictable",
      metric: `Consistency: ${consistency}/100`,
      happening: `Your daily P&L ranges from $${bestWorst.worst?.pnl.toFixed(2) || "0"} to $${bestWorst.best?.pnl.toFixed(2) || "0"} — a $${pnlRange.toFixed(2)} swing. This level of variance indicates emotional trading.`,
      matters: "Inconsistent results mean your profits depend on luck, not skill. Prop firms and fund managers reject traders with high variance regardless of returns.",
      actions: [
        "Set a daily profit target and daily loss limit. Stop trading when either is hit.",
        "Trade the same lot size every single trade for 30 days. No exceptions for 'high confidence' setups.",
        "Identify your most consistent trading day and replicate what you do differently.",
      ],
    });
  } else if (csScore.status === "Good") {
    warningFeedback.push({ title: "Consistency", right: `${consistency}/100 shows your daily results are stabilizing.`, risk: "Increasing position sizes on 'good days' could introduce more variance.", tip: "Keep lot sizes uniform for the next 30 trades." });
  } else {
    strengthFeedback.push({ title: "Consistency", achievement: `${consistency}/100 — your daily P&L is very stable.`, edge: "Consistent results indicate a systematic approach rather than gambling.", protect: "Don't change lot sizes based on emotions or recent results." });
  }

  // Checklist
  const checklist = [
    { label: "Win rate above 50%", met: kpis.winRate >= 50 },
    { label: "Profit factor above 1.3", met: kpis.profitFactor >= 1.3 },
    { label: "Max drawdown below 10%", met: kpis.maxDrawdownPct < 10 },
    { label: "Average RR above 1:1.5", met: kpis.riskReward >= 1.5 },
    { label: "No overtrading in last 2 weeks", met: overtradeDays === 0 },
    { label: "Consistency score above 60", met: consistency >= 60 },
    { label: "Positive P&L overall", met: kpis.netPnL > 0 },
    { label: "At least 50 trades analyzed", met: kpis.totalTrades >= 50 },
  ];
  const metCount = checklist.filter(c => c.met).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-heading font-bold">Progress & Readiness</h1>
        <p className="text-sm text-muted-foreground">Are you ready to go live?</p>
      </div>

      {/* Hero Score */}
      <Card className="border-border/50">
        <CardContent className="p-8 flex flex-col items-center">
          <div className="relative">
            <svg width="180" height="180" className="-rotate-90">
              <circle cx="90" cy="90" r="70" stroke="hsl(230, 12%, 18%)" strokeWidth="12" fill="none" />
              <circle cx="90" cy="90" r="70"
                stroke={scoreColor}
                strokeWidth="12" fill="none" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                className="transition-all duration-1000"
                style={{ filter: `drop-shadow(0 0 8px ${scoreColor})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-mono-num" style={{ color: scoreColor }}>{totalScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <p className="mt-4 text-lg font-heading font-semibold" style={{ color: scoreColor }}>{scoreLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">Based on your last {kpis.totalTrades} trades</p>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {scoreCards.map(card => (
          <Card key={card.name} className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <card.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{card.name}</span>
                </div>
                <Badge className={`text-xs border ${statusColors[card.status]}`}>{card.status}</Badge>
              </div>
              <p className="text-2xl font-bold font-mono-num">{card.pointsEarned} <span className="text-sm text-muted-foreground font-normal">/ {card.pointsMax}</span></p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${
                  card.status === "Strong" ? "bg-profit" : card.status === "Good" ? "bg-primary" : card.status === "Needs Work" ? "bg-warning" : "bg-loss"
                }`} style={{ width: `${(card.pointsEarned / card.pointsMax) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{card.actualValue}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Avg Risk indicator */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Avg Risk per Trade (Bonus Indicator)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on $10,000 balance, risk max $100/trade (1% rule). Your average loss is ${avgLoss.toFixed(2)} per losing trade.
          </p>
          <Badge className={`text-xs mt-2 border ${avgLoss <= 100 ? statusColors["Strong"] : avgLoss <= 200 ? statusColors["Needs Work"] : statusColors["Critical"]}`}>
            {avgLoss <= 100 ? "Good" : avgLoss <= 200 ? "Reduce Size" : "Overleveraged"}
          </Badge>
        </CardContent>
      </Card>

      {/* Overtrading Penalty */}
      {overtradeDays > 0 && (
        <Card className="border-loss/30 bg-loss/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-loss" />
            <div>
              <p className="text-sm font-medium text-loss">-{overtradePenalty} points deducted</p>
              <p className="text-xs text-muted-foreground">You overtrade on {overtradeDays} days (threshold: 5 trades/day)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION A: Fix These Now */}
      {criticalFeedback.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-semibold text-loss">🔴 Fix These Now</h2>
          {criticalFeedback.map((f, i) => (
            <Card key={i} className="border-loss/30 bg-loss/5">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-sm">{f.title}</p>
                  <Badge variant="secondary" className="text-xs">{f.metric}</Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">What's happening:</p>
                  <p className="text-xs text-muted-foreground">{f.happening}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Why it matters:</p>
                  <p className="text-xs text-muted-foreground">{f.matters}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Action Plan:</p>
                  {f.actions.map((a, j) => (
                    <p key={j} className="text-xs text-muted-foreground ml-2">✦ {a}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* SECTION B: Keep Watching */}
      {warningFeedback.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-semibold text-warning">🟡 Keep Watching</h2>
          {warningFeedback.map((f, i) => (
            <Card key={i} className="border-warning/30 bg-warning/5">
              <CardContent className="p-5 space-y-2">
                <p className="font-medium text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground">✓ {f.right}</p>
                <p className="text-xs text-muted-foreground">⚠ {f.risk}</p>
                <p className="text-xs text-muted-foreground">💡 {f.tip}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* SECTION C: Your Strengths */}
      {strengthFeedback.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-heading font-semibold text-profit">🟢 Your Strengths</h2>
          {strengthFeedback.map((f, i) => (
            <Card key={i} className="border-profit/30 bg-profit/5">
              <CardContent className="p-5 space-y-2">
                <p className="font-medium text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground">🏆 {f.achievement}</p>
                <p className="text-xs text-muted-foreground">📈 {f.edge}</p>
                <p className="text-xs text-muted-foreground">🛡 {f.protect}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Readiness Checklist */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Readiness Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.met ? <CheckCircle2 className="h-4 w-4 text-profit" /> : <XCircle className="h-4 w-4 text-loss" />}
              <span className={`text-sm ${item.met ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
            </div>
          ))}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-mono-num font-medium">{metCount} / 8 criteria met</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(metCount / 8) * 100}%` }} />
            </div>
          </div>
          {metCount === 8 && (
            <div className="mt-4 p-4 rounded-lg border border-profit/30 bg-profit/5 text-center">
              <p className="text-sm font-medium text-profit">🎉 You meet all readiness criteria!</p>
              <p className="text-xs text-muted-foreground mt-1">Consider starting with a micro live account.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
