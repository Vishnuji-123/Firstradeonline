export interface Trade {
  id: string;
  ticket: number;
  symbol: string;
  trade_type: "buy" | "sell";
  volume: number;
  open_price: number;
  close_price: number;
  open_time: string;
  close_time: string;
  profit: number;
  swap: number;
  commission: number;
  duration_minutes: number;
  session: "Asian" | "London" | "New York";
  notes: string;
}

export interface AccountInfo {
  login: number;
  balance: number;
  equity: number;
  currency: string;
}

function getSession(hour: number): "Asian" | "London" | "New York" {
  if (hour >= 0 && hour < 8) return "Asian";
  if (hour >= 8 && hour < 16) return "London";
  return "New York";
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function generateDemoTrades(count: number): Trade[] {
  const symbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "XAUUSD", "GBPJPY", "EURJPY", "USDCHF"];
  const trades: Trade[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(randomBetween(0, 30));
    const openDate = new Date(now);
    openDate.setDate(openDate.getDate() - daysAgo);
    const hour = Math.floor(randomBetween(1, 21));
    openDate.setHours(hour, Math.floor(Math.random() * 60));

    const durationMinutes = Math.floor(randomBetween(5, 480));
    const closeDate = new Date(openDate.getTime() + durationMinutes * 60000);

    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type = Math.random() > 0.5 ? "buy" : "sell";
    const volume = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5][Math.floor(Math.random() * 6)];

    const isWin = Math.random() > 0.42;
    const profit = isWin
      ? parseFloat(randomBetween(10, 250).toFixed(2))
      : parseFloat((-randomBetween(10, 200)).toFixed(2));

    const basePrice = symbol === "XAUUSD" ? 2650 : symbol.includes("JPY") ? 155 : 1.08;
    const openPrice = parseFloat((basePrice + randomBetween(-0.01, 0.01) * basePrice).toFixed(5));
    const pips = profit / (volume * 10);
    const closePrice = type === "buy"
      ? parseFloat((openPrice + pips * 0.0001).toFixed(5))
      : parseFloat((openPrice - pips * 0.0001).toFixed(5));

    trades.push({
      id: `demo-${i + 1}`,
      ticket: 100000 + i,
      symbol,
      trade_type: type as "buy" | "sell",
      volume,
      open_price: openPrice,
      close_price: closePrice,
      open_time: openDate.toISOString(),
      close_time: closeDate.toISOString(),
      profit,
      swap: parseFloat((-randomBetween(0, 2)).toFixed(2)),
      commission: parseFloat((-randomBetween(0.5, 3)).toFixed(2)),
      duration_minutes: durationMinutes,
      session: getSession(hour),
      notes: "",
    });
  }

  return trades.sort((a, b) => new Date(b.close_time).getTime() - new Date(a.close_time).getTime());
}

export function getKPIs(trades: Trade[]) {
  if (trades.length === 0) {
    return { totalTrades: 0, winRate: 0, netPnL: 0, profitFactor: 0, riskReward: 0, maxDrawdownPct: 0 };
  }
  const closed = trades.filter((t) => t.close_time);
  const wins = closed.filter((t) => t.profit > 0);
  const losses = closed.filter((t) => t.profit < 0);

  const totalTrades = closed.length;
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
  const netPnL = closed.reduce((sum, t) => sum + t.profit + t.swap + t.commission, 0);
  const grossProfit = wins.reduce((sum, t) => sum + t.profit, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profit, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;

  let peak = 0;
  let maxDD = 0;
  let cumPnL = 0;
  const sortedByTime = [...closed].sort(
    (a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime()
  );
  for (const t of sortedByTime) {
    cumPnL += t.profit + t.swap + t.commission;
    if (cumPnL > peak) peak = cumPnL;
    const dd = peak - cumPnL;
    if (dd > maxDD) maxDD = dd;
  }
  const maxDrawdownPct = peak > 0 ? (maxDD / (10000 + peak)) * 100 : 0;

  return {
    totalTrades,
    winRate: parseFloat(winRate.toFixed(1)),
    netPnL: parseFloat(netPnL.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    riskReward: parseFloat(riskReward.toFixed(2)),
    maxDrawdownPct: parseFloat(maxDrawdownPct.toFixed(1)),
  };
}

export function getAvgPnL(trades: Trade[]) {
  if (trades.length === 0) return 0;
  const total = trades.reduce((sum, t) => sum + t.profit + t.swap + t.commission, 0);
  return parseFloat((total / trades.length).toFixed(2));
}

export function getDailyPnLMap(trades: Trade[]): Record<string, number> {
  const map: Record<string, number> = {};
  trades.forEach((t) => {
    const day = new Date(t.close_time).toISOString().split("T")[0];
    map[day] = (map[day] || 0) + t.profit + t.swap + t.commission;
  });
  return map;
}

export function getConsistencyScore(trades: Trade[]) {
  if (trades.length === 0) return 0;
  const dailyPnL = Object.values(getDailyPnLMap(trades));
  if (dailyPnL.length < 2) return 50;
  const mean = dailyPnL.reduce((s, v) => s + v, 0) / dailyPnL.length;
  const variance = dailyPnL.reduce((s, v) => s + (v - mean) ** 2, 0) / dailyPnL.length;
  const stdDev = Math.sqrt(variance);
  const score = Math.max(0, 100 - (stdDev / (Math.abs(mean) + 1)) * 50);
  return Math.round(Math.min(100, score));
}

export function getBestWorstDay(trades: Trade[]) {
  const map = getDailyPnLMap(trades);
  const entries = Object.entries(map);
  if (entries.length === 0) return { best: null, worst: null };
  entries.sort((a, b) => b[1] - a[1]);
  return {
    best: { date: entries[0][0], pnl: parseFloat(entries[0][1].toFixed(2)) },
    worst: { date: entries[entries.length - 1][0], pnl: parseFloat(entries[entries.length - 1][1].toFixed(2)) },
  };
}

export function getEquityCurve(trades: Trade[]) {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.close_time).getTime() - new Date(b.close_time).getTime()
  );
  let equity = 10000;
  return sorted.map((t) => {
    equity += t.profit + t.swap + t.commission;
    return {
      date: new Date(t.close_time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      equity: parseFloat(equity.toFixed(2)),
      time: t.close_time,
    };
  });
}

export function getPnLBySymbol(trades: Trade[]) {
  const map: Record<string, number> = {};
  trades.forEach((t) => {
    map[t.symbol] = (map[t.symbol] || 0) + t.profit;
  });
  return Object.entries(map)
    .map(([symbol, pnl]) => ({ symbol, pnl: parseFloat(pnl.toFixed(2)) }))
    .sort((a, b) => b.pnl - a.pnl);
}

export function getTradesPerDay(trades: Trade[]) {
  const map: Record<string, number> = {};
  trades.forEach((t) => {
    const day = new Date(t.open_time).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    map[day] = (map[day] || 0) + 1;
  });
  return Object.entries(map).map(([day, count]) => ({ day, count }));
}

export function getSessionHeatmap(trades: Trade[]) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const sessions = ["Asian", "London", "New York"] as const;
  const data: { day: string; session: string; avgPnl: number; count: number }[] = [];

  for (const day of days) {
    for (const session of sessions) {
      const filtered = trades.filter((t) => {
        const d = new Date(t.open_time);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        return dayName === day && t.session === session;
      });
      const avgPnl = filtered.length > 0
        ? filtered.reduce((s, t) => s + t.profit, 0) / filtered.length
        : 0;
      data.push({ day, session, avgPnl: parseFloat(avgPnl.toFixed(2)), count: filtered.length });
    }
  }
  return data;
}

export function getReadinessScore(trades: Trade[]) {
  if (trades.length === 0) return 0;
  const kpis = getKPIs(trades);
  const consistency = getConsistencyScore(trades);
  const winRateScore = Math.min(kpis.winRate / 60 * 25, 25);
  const rrScore = Math.min(kpis.riskReward / 2 * 20, 20);
  const ddScore = Math.max(20 - kpis.maxDrawdownPct * 2, 0);
  const consistencyScore = (consistency / 100) * 20;
  const overtradePenalty = getTradesPerDay(trades).filter((d) => d.count > 5).length * 2;
  const score = Math.max(0, Math.min(100, Math.round(winRateScore + rrScore + ddScore + consistencyScore + 15 - overtradePenalty)));
  return score;
}
