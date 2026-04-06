import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trade } from "@/lib/mockData";
import { Download, ChevronLeft, ChevronRight, CalendarDays, List, Check, X } from "lucide-react";
import { useTrades } from "@/contexts/TradesContext";
import { EmptyState } from "@/components/EmptyState";
import { TradingCalendar } from "@/components/TradingCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 15;

export default function Journal() {
  const { filteredTrades, loading, isDemo, refetch } = useTrades();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [symbolFilter, setSymbolFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [selected, setSelected] = useState<Trade | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // When a trade is selected, load its note
  useEffect(() => {
    if (selected) {
      const currentNote = localNotes[selected.id] ?? selected.notes ?? "";
      setNoteText(currentNote);
      setSavedNote(currentNote);
      setSaveStatus("idle");
    }
  }, [selected]);

  const saveNote = useCallback(async (tradeId: string, text: string) => {
    if (!user || isDemo) return;
    setSaving(true);
    setSaveStatus("idle");
    const { error } = await supabase
      .from("trades")
      .update({ notes: text })
      .eq("id", tradeId)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      setSaveStatus("error");
    } else {
      setSaveStatus("saved");
      setSavedNote(text);
      setLocalNotes(prev => ({ ...prev, [tradeId]: text }));
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  }, [user, isDemo]);

  const handleSaveNote = () => {
    if (selected) saveNote(selected.id, noteText);
  };

  const handleBlurSave = () => {
    if (selected && noteText !== savedNote) {
      saveNote(selected.id, noteText);
    }
  };

  const handleClearNote = () => {
    if (selected) {
      saveNote(selected.id, "");
      setNoteText("");
      setClearDialogOpen(false);
    }
  };

  const getDisplayNote = (trade: Trade) => {
    return localNotes[trade.id] ?? trade.notes ?? "";
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (filteredTrades.length === 0 && !isDemo) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div><h1 className="text-2xl font-heading font-bold">Trade Journal</h1></div>
        <EmptyState />
      </div>
    );
  }

  const symbols = [...new Set(filteredTrades.map((t) => t.symbol))];

  const filtered = filteredTrades.filter((t) => {
    if (symbolFilter !== "all" && t.symbol !== symbolFilter) return false;
    if (directionFilter !== "all" && t.trade_type !== directionFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const exportCSV = () => {
    const headers = "Ticket,Symbol,Type,Volume,Open Price,Close Price,Open Time,Close Time,P&L,Swap,Commission,Notes\n";
    const rows = filtered.map((t) =>
      `${t.ticket},${t.symbol},${t.trade_type},${t.volume},${t.open_price},${t.close_price},${t.open_time},${t.close_time},${t.profit},${t.swap},${t.commission},"${(getDisplayNote(t)).replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trades.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Trade Journal</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} trades</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={symbolFilter} onValueChange={(v) => { setSymbolFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Symbol" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Symbols</SelectItem>
            {symbols.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={directionFilter} onValueChange={(v) => { setDirectionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Direction" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarDays className="h-4 w-4" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <List className="h-4 w-4" /> Trade List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <TradingCalendar trades={filtered} onDayClick={(_date, _trades) => {}} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase">Ticket</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase">Symbol</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase">Type</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium text-xs uppercase">Volume</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase">Open</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase">Close</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium text-xs uppercase">P&L</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((t) => {
                      const note = getDisplayNote(t);
                      return (
                        <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => setSelected(t)}>
                          <td className="py-3 px-4 font-mono-num text-xs">{t.ticket}</td>
                          <td className="py-3 px-4 font-medium">{t.symbol}</td>
                          <td className="py-3 px-4">
                            <Badge variant={t.trade_type === "buy" ? "default" : "secondary"} className="text-xs">
                              {t.trade_type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num">{t.volume}</td>
                          <td className="py-3 px-4 font-mono-num text-xs">{new Date(t.open_time).toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono-num text-xs">{new Date(t.close_time).toLocaleString()}</td>
                          <td className={`py-3 px-4 text-right font-mono-num font-medium ${t.profit >= 0 ? "text-profit" : "text-loss"}`}>
                            {t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-xs max-w-[160px]">
                            {note ? (
                              <span className="text-muted-foreground truncate block">
                                {note.length > 40 ? note.slice(0, 40) + "..." : note}
                              </span>
                            ) : (
                              <span className="text-primary/60 italic">Add note</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-4 border-t border-border">
                <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages || 1}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-heading">Trade #{selected.ticket}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Symbol</span><p className="font-medium">{selected.symbol}</p></div>
                  <div><span className="text-muted-foreground">Direction</span><p className="font-medium">{selected.trade_type.toUpperCase()}</p></div>
                  <div><span className="text-muted-foreground">Volume</span><p className="font-mono-num">{selected.volume}</p></div>
                  <div><span className="text-muted-foreground">Session</span><p>{selected.session}</p></div>
                  <div><span className="text-muted-foreground">Entry</span><p className="font-mono-num">{selected.open_price}</p></div>
                  <div><span className="text-muted-foreground">Exit</span><p className="font-mono-num">{selected.close_price}</p></div>
                  <div><span className="text-muted-foreground">Open Time</span><p className="font-mono-num text-xs">{new Date(selected.open_time).toLocaleString()}</p></div>
                  <div><span className="text-muted-foreground">Close Time</span><p className="font-mono-num text-xs">{new Date(selected.close_time).toLocaleString()}</p></div>
                  <div><span className="text-muted-foreground">Duration</span><p className="font-mono-num">{selected.duration_minutes}m</p></div>
                  <div>
                    <span className="text-muted-foreground">P&L</span>
                    <p className={`font-mono-num font-bold ${selected.profit >= 0 ? "text-profit" : "text-loss"}`}>
                      {selected.profit >= 0 ? "+" : ""}${selected.profit.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Trade Notes</span>
                    {saveStatus === "saved" && (
                      <span className="text-xs text-profit flex items-center gap-1 animate-in fade-in">
                        <Check className="h-3 w-3" /> Note saved
                      </span>
                    )}
                    {saveStatus === "error" && (
                      <span className="text-xs text-loss">Failed to save. Try again.</span>
                    )}
                  </div>
                  <Textarea
                    ref={noteRef}
                    placeholder="What was your reasoning? What did you learn?"
                    className="min-h-[100px] resize-y"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value.slice(0, 500))}
                    onBlur={handleBlurSave}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">{noteText.length} / 500 characters</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gradient-primary text-primary-foreground"
                      onClick={handleSaveNote}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Note"}
                    </Button>
                    {noteText && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setClearDialogOpen(true)}
                      >
                        <X className="h-4 w-4 mr-1" /> Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Clear Note Confirmation */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this note?</AlertDialogTitle>
            <AlertDialogDescription>This will clear the note for this trade.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
