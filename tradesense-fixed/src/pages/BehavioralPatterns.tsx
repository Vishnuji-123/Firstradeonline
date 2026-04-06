import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTradesPerDay, getSessionHeatmap } from "@/lib/mockData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { AlertTriangle, Flame, Clock } from "lucide-react";
import { useTrades } from "@/contexts/TradesContext";
import { EmptyState } from "@/components/EmptyState";

export default function BehavioralPatterns() {
  const { filteredTrades, loading, isDemo } = useTrades();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (filteredTrades.length === 0 && !isDemo) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div><h1 className="text-2xl font-heading font-bold">Behavioral Patterns</h1></div>
        <EmptyState />
      </div>
    );
  }

  const tradesPerDay = getTradesPerDay(filteredTrades);
  const heatmap = getSessionHeatmap(filteredTrades);
  const overtradeDays = tradesPerDay.filter((d) => d.count > 5).length;

  const hourly: Record<number, number> = {};
  filteredTrades.forEach((t) => {
    const h = new Date(t.open_time).getHours();
    hourly[h] = (hourly[h] || 0) + 1;
  });
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    count: hourly[i] || 0,
  }));

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const sessions = ["Asian", "London", "New York"];

  const getHeatColor = (val: number) => {
    if (val > 30) return "bg-profit/70";
    if (val > 0) return "bg-profit/30";
    if (val === 0) return "bg-muted";
    if (val > -30) return "bg-loss/30";
    return "bg-loss/70";
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Behavioral Patterns</h1>
          <p className="text-sm text-muted-foreground">Detect trading biases and emotional patterns</p>
        </div>
        {overtradeDays > 0 && (
          <Badge variant="destructive" className="gap-1">
            <Flame className="h-3 w-3" />{overtradeDays} overtrading days detected
          </Badge>
        )}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Trades per Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tradesPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                <XAxis dataKey="day" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 10%)", border: "1px solid hsl(230, 12%, 18%)", borderRadius: "8px", color: "hsl(220, 20%, 92%)", fontSize: 12 }} />
                <ReferenceLine y={5} stroke="hsl(0, 72%, 51%)" strokeDasharray="5 5" label={{ value: "Threshold", fill: "hsl(0, 72%, 51%)", fontSize: 11 }} />
                <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Session Performance Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-left text-muted-foreground text-xs"></th>
                    {sessions.map((s) => (
                      <th key={s} className="py-2 px-3 text-center text-muted-foreground text-xs uppercase">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day}>
                      <td className="py-2 px-3 text-xs font-medium text-muted-foreground">{day}</td>
                      {sessions.map((session) => {
                        const cell = heatmap.find((h) => h.day === day && h.session === session);
                        const val = cell?.avgPnl || 0;
                        return (
                          <td key={session} className="py-2 px-3">
                            <div className={`rounded-md py-3 text-center text-xs font-mono-num ${getHeatColor(val)}`}>
                              ${val.toFixed(0)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Clock className="h-4 w-4" /> Trading Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 18%)" />
                  <XAxis dataKey="hour" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 9 }} interval={2} />
                  <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 10%)", border: "1px solid hsl(230, 12%, 18%)", borderRadius: "8px", color: "hsl(220, 20%, 92%)", fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Emotional Trading Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="font-medium text-sm">Revenge Trading</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Analysis requires more trade data to detect patterns.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-loss" />
                <span className="font-medium text-sm">FOMO Entries</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Analysis requires more trade data to detect patterns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
