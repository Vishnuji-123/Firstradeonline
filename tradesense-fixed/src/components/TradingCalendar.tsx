import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trade } from "@/lib/mockData";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradingCalendarProps {
  trades: Trade[];
  onDayClick?: (date: string, trades: Trade[]) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function TradingCalendar({ trades, onDayClick }: TradingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group trades by date (YYYY-MM-DD)
  const tradesByDate = useMemo(() => {
    const map: Record<string, { trades: Trade[]; pnl: number; wins: number; losses: number }> = {};
    trades.forEach((t) => {
      const dateKey = new Date(t.close_time).toISOString().split("T")[0];
      if (!map[dateKey]) map[dateKey] = { trades: [], pnl: 0, wins: 0, losses: 0 };
      map[dateKey].trades.push(t);
      map[dateKey].pnl += t.profit;
      if (t.profit >= 0) map[dateKey].wins++;
      else map[dateKey].losses++;
    });
    return map;
  }, [trades]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Monday = 0
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Fill leading days from previous month
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    // Fill trailing days
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
    }

    return days;
  }, [currentMonth]);

  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const goToday = () => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let pnl = 0, tradeCount = 0, winDays = 0, lossDays = 0;
    Object.entries(tradesByDate).forEach(([dateKey, data]) => {
      const d = new Date(dateKey);
      if (d.getFullYear() === year && d.getMonth() === month) {
        pnl += data.pnl;
        tradeCount += data.trades.length;
        if (data.pnl >= 0) winDays++;
        else lossDays++;
      }
    });
    return { pnl, tradeCount, winDays, lossDays };
  }, [currentMonth, tradesByDate]);

  const selectedDayData = selectedDate ? tradesByDate[selectedDate] : null;

  const handleDayClick = (dateKey: string, data: typeof tradesByDate[string] | undefined) => {
    setSelectedDate(selectedDate === dateKey ? null : dateKey);
    if (data && onDayClick) onDayClick(dateKey, data.trades);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {/* Monthly summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Monthly P&L</p>
            <p className={cn("text-lg font-bold font-mono-num", monthlySummary.pnl >= 0 ? "text-profit" : "text-loss")}>
              {monthlySummary.pnl >= 0 ? "+" : ""}${monthlySummary.pnl.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Trades</p>
            <p className="text-lg font-bold font-mono-num">{monthlySummary.tradeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Win Days</p>
            <p className="text-lg font-bold font-mono-num text-profit">{monthlySummary.winDays}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Loss Days</p>
            <p className="text-lg font-bold font-mono-num text-loss">{monthlySummary.lossDays}</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base font-heading min-w-[160px] text-center">{monthLabel}</CardTitle>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={goToday} className="text-xs">Today</Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const dateKey = date.toISOString().split("T")[0];
              const data = tradesByDate[dateKey];
              const isToday = dateKey === today;
              const isSelected = dateKey === selectedDate;

              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(dateKey, data)}
                  className={cn(
                    "relative flex flex-col items-center justify-start rounded-md p-1 min-h-[60px] text-xs transition-colors border",
                    !isCurrentMonth && "opacity-30",
                    isToday && "border-primary/50",
                    isSelected && "border-primary bg-primary/10",
                    !isToday && !isSelected && "border-transparent",
                    data ? "cursor-pointer hover:bg-muted/50" : "cursor-default"
                  )}
                >
                  <span className={cn(
                    "font-medium mb-0.5",
                    isToday && "text-primary font-bold",
                    !isCurrentMonth && "text-muted-foreground"
                  )}>
                    {date.getDate()}
                  </span>
                  {data && isCurrentMonth && (
                    <>
                      <span className={cn(
                        "text-[10px] font-bold font-mono-num leading-tight",
                        data.pnl >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(0)}
                      </span>
                      <span className="text-[9px] text-muted-foreground leading-tight">
                        {data.trades.length}t
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day detail */}
      {selectedDayData && selectedDate && (
        <Card className="border-border/50 animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              <Badge variant={selectedDayData.pnl >= 0 ? "default" : "secondary"} className="text-xs">
                {selectedDayData.pnl >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {selectedDayData.pnl >= 0 ? "+" : ""}${selectedDayData.pnl.toFixed(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Ticket</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Symbol</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Type</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">Volume</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">P&L</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDayData.trades.map((t) => (
                    <tr key={t.id} className="border-b border-border/30">
                      <td className="py-2 px-3 font-mono-num text-xs">{t.ticket}</td>
                      <td className="py-2 px-3 font-medium">{t.symbol}</td>
                      <td className="py-2 px-3">
                        <Badge variant={t.trade_type === "buy" ? "default" : "secondary"} className="text-xs">
                          {t.trade_type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-right font-mono-num">{t.volume}</td>
                      <td className={cn("py-2 px-3 text-right font-mono-num font-medium", t.profit >= 0 ? "text-profit" : "text-loss")}>
                        {t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{t.session}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
