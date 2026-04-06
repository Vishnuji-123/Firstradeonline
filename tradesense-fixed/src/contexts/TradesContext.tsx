import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trade, generateDemoTrades, getKPIs, getEquityCurve, getPnLBySymbol, getTradesPerDay, getSessionHeatmap, getReadinessScore } from "@/lib/mockData";

interface TradesContextType {
  trades: Trade[];
  loading: boolean;
  isDemo: boolean;
  dateRange: "7d" | "30d" | "all";
  setDateRange: (r: "7d" | "30d" | "all") => void;
  filteredTrades: Trade[];
  enableDemoMode: () => void;
  exitDemoMode: () => void;
  refetch: () => void;
}

const TradesContext = createContext<TradesContextType>({
  trades: [],
  loading: true,
  isDemo: false,
  dateRange: "all",
  setDateRange: () => {},
  filteredTrades: [],
  enableDemoMode: () => {},
  exitDemoMode: () => {},
  refetch: () => {},
});

export const useTrades = () => useContext(TradesContext);

export function TradesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("all");

  const fetchTrades = useCallback(async () => {
    if (!user) {
      setTrades([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("close_time", { ascending: false });

    if (!error && data && data.length > 0) {
      setTrades(data.map((t) => ({
        id: t.id,
        ticket: t.ticket,
        symbol: t.symbol,
        trade_type: t.trade_type as "buy" | "sell",
        volume: Number(t.volume),
        open_price: Number(t.open_price),
        close_price: Number(t.close_price),
        open_time: t.open_time,
        close_time: t.close_time,
        profit: Number(t.profit),
        swap: Number(t.swap),
        commission: Number(t.commission),
        duration_minutes: t.duration_minutes,
        session: (t.session || "London") as Trade["session"],
        notes: t.notes || "",
      })));
      setIsDemo(false);
    } else {
      setTrades([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const enableDemoMode = () => {
    setTrades(generateDemoTrades(30));
    setIsDemo(true);
  };

  const exitDemoMode = () => {
    setIsDemo(false);
    fetchTrades();
  };

  const filteredTrades = trades.filter((t) => {
    if (dateRange === "all") return true;
    const now = new Date();
    const cutoff = new Date();
    if (dateRange === "7d") cutoff.setDate(now.getDate() - 7);
    if (dateRange === "30d") cutoff.setDate(now.getDate() - 30);
    return new Date(t.close_time) >= cutoff;
  });

  return (
    <TradesContext.Provider value={{
      trades, loading, isDemo, dateRange, setDateRange,
      filteredTrades, enableDemoMode, exitDemoMode, refetch: fetchTrades,
    }}>
      {children}
    </TradesContext.Provider>
  );
}
