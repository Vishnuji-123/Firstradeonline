import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/Logo";
import {
  ArrowRight, Play, Download, Upload, BarChart2, Menu, X,
  TrendingUp, ShieldAlert, Brain, Clock, LineChart, Target,
  BookOpen, Zap, CheckCircle, ChevronDown
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

/* ── Navbar ── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "What We Analyze", href: "#analyze" },
    { label: "Pricing → Free", href: "#faq" },
  ];

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else if (href === "#faq") {
      toast.info("Firstrade is 100% free — no paid plans!");
    }
  };

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/90 backdrop-blur-xl border-b border-border/40" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Logo size="md" linkTo="/" />
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => handleNavClick(e, l.href)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Log In</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-[#6366f1] hover:bg-[#5558e6] text-white shadow-[0_0_20px_-4px_rgba(99,102,241,0.4)]">Start Free</Button></Link>
          </div>
          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(true)}><Menu className="h-6 w-6" /></button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col p-6">
          <div className="flex items-center justify-between mb-12">
            <Logo size="md" linkTo="/" />
            <button onClick={() => setMobileOpen(false)}><X className="h-6 w-6" /></button>
          </div>
          <div className="flex flex-col gap-6">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-xl text-foreground" onClick={(e) => handleNavClick(e, l.href)}>{l.label}</a>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-3">
            <Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="outline" className="w-full">Log In</Button></Link>
            <Link to="/signup" onClick={() => setMobileOpen(false)}><Button className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white">Start Free</Button></Link>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Animated Counter ── */
function Counter({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
        let start = 0;
        const duration = 1500;
        const step = (ts: number) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          setValue(Math.floor(progress * end));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, started]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold font-mono-num text-foreground">{value}{suffix}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

/* ── Main Landing ── */
export default function Landing() {
  const navigate = useNavigate();

  const handleDemoClick = () => {
    // Navigate to dashboard which will show empty state with "Try Sample Data" button
    navigate("/dashboard");
    toast.info("Click 'Try Sample Data' on the dashboard to explore with demo trades!");
  };

  const handleComingSoon = (label: string) => {
    toast("Coming soon!", { description: `${label} will be available soon.` });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden scroll-smooth">
      <Navbar />

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Animated mesh bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#6366f1]/5 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#34d399]/5 rounded-full blur-[100px] animate-[pulse_10s_ease-in-out_infinite_2s]" />
          {/* Faint candlestick watermark */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 800 600">
            {[100,180,260,340,420,500,580,660].map((x, i) => (
              <g key={i}>
                <rect x={x} y={200 + (i % 3) * 60} width="20" height={80 + (i % 4) * 30} fill="white" />
                <line x1={x + 10} y1={180 + (i % 3) * 40} x2={x + 10} y2={200 + (i % 3) * 60} stroke="white" strokeWidth="2" />
              </g>
            ))}
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-[55%_45%] gap-12 items-center w-full">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6366f1]/30 bg-[#6366f1]/5 text-[#6366f1] text-xs font-medium mb-6">
              📊 Built for Demo Traders
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[64px] font-bold tracking-tight leading-[1.08] mb-6">
              Stop Guessing.<br />
              Start Knowing<br />
              <span className="text-[#6366f1]">Why You Trade.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-[480px] mb-8 leading-relaxed">
              Firstrade transforms your raw demo trade history into deep behavioral analytics, risk reports, and a personalized readiness score — so you know exactly what to fix before risking real money.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <Link to="/signup">
                <Button size="lg" className="bg-[#6366f1] hover:bg-[#5558e6] text-white h-12 px-8 text-base shadow-[0_0_30px_-6px_rgba(99,102,241,0.5)]">
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base" onClick={handleDemoClick}>
                <Play className="mr-2 h-4 w-4" /> See Live Demo
              </Button>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>📈 15+ Analytics Metrics</span>
              <span className="w-px h-4 bg-border" />
              <span>🧠 8 Behavioral Patterns</span>
              <span className="w-px h-4 bg-border hidden sm:block" />
              <span className="hidden sm:inline">🎯 100-pt Readiness Score</span>
            </div>
          </div>

          {/* Right — floating dashboard card */}
          <div className="hidden lg:block">
            <div className="relative transform -rotate-2 animate-[float_3s_ease-in-out_infinite]">
              <div className="rounded-xl border border-border bg-card p-6 shadow-2xl">
                {/* Mini equity curve */}
                <div className="h-32 mb-4 flex items-end gap-1">
                  {[20,35,28,45,38,55,48,62,58,72,65,78,82,75,88].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: h > 50 ? "#34d399" : "#6366f1", opacity: 0.7 }} />
                  ))}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg bg-[#34d399]/10 border border-[#34d399]/20 px-3 py-2 text-center">
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                    <div className="text-sm font-bold text-[#34d399] font-mono-num">64%</div>
                  </div>
                  <div className="flex-1 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-center">
                    <div className="text-xs text-muted-foreground">Max DD</div>
                    <div className="text-sm font-bold text-destructive font-mono-num">-8.2%</div>
                  </div>
                  <div className="flex-1 rounded-lg bg-[#6366f1]/10 border border-[#6366f1]/20 px-3 py-2 text-center">
                    <div className="text-xs text-muted-foreground">Profit Factor</div>
                    <div className="text-sm font-bold text-[#6366f1] font-mono-num">1.84</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROBLEM STATEMENT ══ */}
      <section className="py-24 bg-[#0f0f1a]">
        <div className="max-w-3xl mx-auto px-6 text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-6">
            "Most demo traders practice for months —<br />then blow their first live account in days."
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Not because they lack discipline. Because they never had structured feedback. Every loss had a reason. Every mistake had a pattern. But without analytics, you can't see them.
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-6">
          {[
            { icon: "📉", title: "You Only See P&L", desc: "Your trading platform shows profit and loss. That's it. No consistency score. No behavioral flags. No session breakdown. Just a number that tells you what happened — not why." },
            { icon: "🔁", title: "You Repeat the Same Mistakes", desc: "Overtrading on Fridays. Revenge trading after losses. Holding losers too long. These patterns repeat invisibly until you see the data." },
            { icon: "💸", title: "You Go Live Before You're Ready", desc: "Without a readiness benchmark, traders guess when they're prepared. Most guess wrong — and pay for it with real money." },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-card p-6 hover:border-[#6366f1]/30 transition-colors">
              <div className="text-3xl mb-4">{c.icon}</div>
              <h3 className="font-bold text-foreground mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="py-24 bg-[#080810]">
        <div className="max-w-5xl mx-auto px-6 text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Get your full analytics in 3 steps</h2>
          <p className="text-muted-foreground">No accounts to connect. No software to install. Just upload your CSV and go.</p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-8 relative">
          {/* Dashed connector line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px border-t-2 border-dashed border-border" />
          {[
            { num: "01", icon: Download, title: "Export Your Trade History", desc: "Open your trading platform, go to your trade history, and export it as a CSV file. Takes less than 60 seconds.", tip: "Works with any trading platform" },
            { num: "02", icon: Upload, title: "Upload to Firstrade", desc: "Drag and drop your CSV file. Firstrade automatically detects the format, parses every trade, and maps it to our analytics engine.", tip: "Handles all common CSV formats" },
            { num: "03", icon: BarChart2, title: "Get Your Full Analysis", desc: "Instantly see your performance metrics, behavioral patterns, session breakdown, risk analysis, and your personalized readiness score.", tip: "Updates every time you import" },
          ].map((s) => (
            <div key={s.num} className="relative text-center">
              <div className="text-6xl font-bold text-foreground/5 absolute -top-4 left-1/2 -translate-x-1/2 select-none">{s.num}</div>
              <div className="relative z-10">
                <div className="inline-flex h-12 w-12 rounded-full bg-[#6366f1]/10 items-center justify-center mb-4 mx-auto">
                  <s.icon className="h-5 w-5 text-[#6366f1]" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{s.desc}</p>
                <span className="inline-block text-xs px-3 py-1 rounded-full bg-[#6366f1]/5 text-[#6366f1] border border-[#6366f1]/20">💡 {s.tip}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ WHAT WE ANALYZE ══ */}
      <section id="analyze" className="py-24" >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12" id="features">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything Firstrade analyzes for you</h2>
            <p className="text-muted-foreground">Every metric explained in plain trading language</p>
          </div>
          <AnalyzeTabs />
        </div>
      </section>

      {/* ══ ANIMATED COUNTERS ══ */}
      <section className="py-16 bg-gradient-to-r from-[#6366f1]/10 via-[#6366f1]/5 to-[#34d399]/10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Counter end={15} suffix="+" label="Analytics Metrics" />
          <Counter end={8} label="Behavioral Patterns" />
          <Counter end={100} label="Point Score" />
          <Counter end={3} label="Sessions Analyzed" />
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-24 bg-[#0f0f1a]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">From demo traders who used Firstrade</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { q: "I had no idea I was overtrading every Friday until Firstrade flagged it. Removed Fridays from my schedule and my monthly P&L jumped 40%.", name: "R.M.", role: "Forex Demo Trader", color: "#6366f1" },
              { q: "The readiness score told me I wasn't ready. My drawdown was at 18% and my RR was below 1. Hard to hear, but it saved me from going live too early.", name: "P.S.", role: "Indices Trader", color: "#34d399" },
              { q: "Finally a tool that explains WHAT the numbers mean and WHAT TO DO about them. Every metric has an action attached.", name: "A.K.", role: "Crypto Demo Trader", color: "#f59e0b" },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm text-foreground/80 italic leading-relaxed mb-4">"{t.q}"</p>
                <div className="h-px bg-border mb-4" />
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: t.color }}>{t.name[0]}</div>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="faq" className="py-24 bg-[#080810]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about Firstrade</p>
          </div>

          {/* Getting Started */}
          <div className="mb-8">
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium mb-4">Getting Started</span>
            <Accordion type="single" collapsible defaultValue="faq-1">
              <AccordionItem value="faq-1" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">What is Firstrade?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Firstrade is a demo trading analytics platform designed for beginner and intermediate traders. It analyzes your trade history and gives you deep insights into your performance, risk management, behavioral patterns, and session analysis — all in one place. Think of it as your personal trading coach that works from your trade data.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">Is Firstrade free to use?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Yes, completely free. No credit card required, no hidden fees, no premium tier. Create an account, import your trades, and access every feature at no cost.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">Do I need to connect my trading account?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  No live connection needed. Firstrade works entirely from a CSV file export. Simply export your trade history from your trading platform, upload it to Firstrade, and your full analytics are ready instantly.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-4" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">What trading platforms are supported?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Any platform that can export trade history as a CSV file. This includes MetaTrader 4, MetaTrader 5, TradingView, cTrader, and most broker-provided platforms. If your platform exports CSV with trade data, Firstrade can read it.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Importing Trades */}
          <div className="mb-8">
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium mb-4">Importing Trades</span>
            <Accordion type="single" collapsible>
              <AccordionItem value="faq-5" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">How do I export my trade history as a CSV?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  The exact steps depend on your platform. For MetaTrader 5: Open MT5 → Press Ctrl+T → Click the History tab → Right-click anywhere → Save as Report → Choose Open XML or CSV. Your file should include columns for Symbol, Type, Volume, Open Price, Close Price, Open Time, Close Time, and Profit.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-6" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">What columns does my CSV need?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Your CSV file needs these columns (exact names may vary slightly by platform): Ticket, Symbol, Type, Volume, Open Price, Close Price, Open Time, Close Time, Profit, Swap, Commission. Swap and Commission are optional — they default to 0 if missing. Firstrade automatically detects and maps common column name variations.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-7" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">Can I import multiple times?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Yes. Each time you import, new trades are added to your existing history. You can also use the "Reset All Trades" button to clear everything and start fresh with a new CSV file.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-8" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">My CSV is not being recognized. What should I do?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Make sure your file is saved as .csv format (not .xlsx or .pdf). Check that it contains at least Symbol, Type, Volume, Open Price, Close Price, Open Time, Close Time, and Profit columns. If you see an error message, it will tell you which column was not found.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Analytics */}
          <div>
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium mb-4">Analytics</span>
            <Accordion type="single" collapsible>
              <AccordionItem value="faq-9" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">What is the Readiness Score?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  The Readiness Score is a 0–100 rating that measures how prepared you are to transition from demo trading to live trading. It is calculated from four key areas: Win Rate (30 pts), Risk-Reward Ratio (25 pts), Max Drawdown (25 pts), and Consistency (20 pts). Overtrading deducts up to 20 penalty points. A score above 80 across at least 50 trades is our recommended benchmark before going live.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-10" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">What is the Consistency Score?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Consistency Score measures how stable your daily P&L is. A high score means your results are predictable day over day — a sign of disciplined, system-based trading. A low score means your results swing wildly, which usually indicates emotional or impulsive trading. Professional traders and prop firms prioritize consistency over raw returns.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-11" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">What behavioral patterns does Firstrade detect?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Firstrade automatically detects: Overtrading — days where you traded more than your set threshold (default 5 trades/day). Revenge Trading — taking larger positions right after a losing streak. FOMO Entries — opening new trades within minutes of closing a loss. Loss Holding — holding losing trades significantly longer than winning trades. Session Weaknesses — specific day and session combinations where you consistently lose money.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-12" className="border-border/50">
                <AccordionTrigger className="text-sm font-medium hover:text-foreground text-left">How is session performance calculated?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Firstrade assigns each trade to a session based on its open time in UTC: Asian Session: 00:00 – 07:59 UTC, London Session: 08:00 – 12:59 UTC, New York Session: 13:00 – 20:59 UTC. Trades opened during the London/NY overlap (13:00–16:00 UTC) are counted in the New York session. The Session Analysis page shows your win rate, average P&L, and profit factor for every session and day-of-week combination.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section id="cta" className="py-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Your trading data has answers.<br />Are you ready to see them?
          </h2>
          <p className="text-muted-foreground text-lg mb-10">Free forever. Import your CSV and get your full analytics in under 60 seconds.</p>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <Link to="/signup">
              <Button size="lg" className="bg-[#6366f1] hover:bg-[#5558e6] text-white h-12 px-8 text-base shadow-[0_0_30px_-6px_rgba(99,102,241,0.5)]">
                Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base" onClick={handleDemoClick}>
              Explore Demo
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">No credit card · No setup required · Just your CSV</p>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo size="sm" linkTo="/" className="mb-3" />
            <p className="text-xs text-muted-foreground leading-relaxed">Analytics platform for demo traders learning to trade Forex, Gold, and global markets.</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Analytics</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><button onClick={() => handleComingSoon("Performance")} className="hover:text-foreground transition-colors">Performance</button></li>
              <li><button onClick={() => handleComingSoon("Risk Analysis")} className="hover:text-foreground transition-colors">Risk Analysis</button></li>
              <li><button onClick={() => handleComingSoon("Behavioral Patterns")} className="hover:text-foreground transition-colors">Behavioral Patterns</button></li>
              <li><button onClick={() => handleComingSoon("Session Analysis")} className="hover:text-foreground transition-colors">Session Analysis</button></li>
              <li><button onClick={() => handleComingSoon("Symbol Analysis")} className="hover:text-foreground transition-colors">Symbol Analysis</button></li>
              <li><button onClick={() => handleComingSoon("Readiness Score")} className="hover:text-foreground transition-colors">Readiness Score</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Platform</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><button onClick={() => handleComingSoon("Import Trades")} className="hover:text-foreground transition-colors">Import Trades</button></li>
              <li><button onClick={() => handleComingSoon("Trade Journal")} className="hover:text-foreground transition-colors">Trade Journal</button></li>
              <li><button onClick={() => handleComingSoon("Trading Coach")} className="hover:text-foreground transition-colors">Trading Coach</button></li>
              <li><button onClick={() => handleComingSoon("Progress Tracker")} className="hover:text-foreground transition-colors">Progress Tracker</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Info</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#faq" onClick={(e) => { e.preventDefault(); document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-foreground transition-colors">FAQ</a></li>
              <li><button onClick={() => handleComingSoon("Privacy Policy")} className="hover:text-foreground transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => handleComingSoon("Terms")} className="hover:text-foreground transition-colors">Terms</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-6 border-t border-border/30 text-center text-xs text-muted-foreground">
          © 2026 Firstrade · Built for traders who take learning seriously
        </div>
      </footer>
    </div>
  );
}

/* ── Analyze Tabs Component ── */
function AnalyzeTabs() {
  const tabs = [
    { id: "performance", icon: "📊", label: "Performance" },
    { id: "risk", icon: "⚠️", label: "Risk" },
    { id: "behavior", icon: "🧠", label: "Behavior" },
    { id: "sessions", icon: "🕐", label: "Sessions" },
    { id: "symbols", icon: "📈", label: "Symbols" },
    { id: "readiness", icon: "🎯", label: "Readiness" },
  ];

  const content: Record<string, { title: string; subtitle: string; cards: { name: string; desc: string; good: string; detail: string }[] }> = {
    performance: {
      title: "Performance Analytics",
      subtitle: "Understand if your strategy actually works",
      cards: [
        { name: "Win Rate", desc: "The percentage of your trades that close in profit.", good: "Good: above 50% · Great: above 60%", detail: "Even a 45% win rate can be profitable with the right risk-reward ratio — but below 40% signals a broken strategy." },
        { name: "Profit Factor", desc: "Total profit divided by total loss across all trades.", good: "Good: above 1.3 · Great: above 1.8", detail: "A profit factor of 1.5 means for every $1 you lose, you make $1.50. Below 1.0 means you are losing money." },
        { name: "Expectancy", desc: "Average amount you make per trade — your true edge.", good: "Good: any positive number · Great: above $20/trade", detail: "This is the single most important metric. A positive expectancy means your strategy has a mathematical edge." },
        { name: "Equity Curve", desc: "A visual of your account balance over time.", good: "Good: smooth upward slope · Bad: jagged or declining", detail: "A smooth curve means consistent performance. Sharp drops reveal emotional or impulsive trading periods." },
        { name: "Avg Risk-Reward", desc: "How much you make on winners vs how much you lose on losers.", good: "Good: above 1:1.5 · Great: above 1:2", detail: "With a 1:2 RR, one winning trade covers two losing trades. This is the foundation of a sustainable strategy." },
        { name: "Monthly P&L Trend", desc: "Your net profit or loss broken down by month.", good: "Good: consistent positive months", detail: "Consistent monthly profits signal a strategy that works across changing market conditions." },
      ],
    },
    risk: {
      title: "Risk Analysis",
      subtitle: "Know your risk before it knows you",
      cards: [
        { name: "Max Drawdown", desc: "The largest drop from a peak equity to a trough — expressed as a percentage.", good: "Good: below 8% · Warning: 8–15% · Critical: above 15%", detail: "A 20% drawdown requires a 25% gain just to break even. Professional prop firms cut traders at 10% drawdown." },
        { name: "Drawdown Curve", desc: "A visual showing how deep your account dropped at each point in time and how long recovery took.", good: "Good: shallow drops, quick recovery", detail: "Long periods spent in drawdown reveal psychological pressure — traders in drawdown make worse decisions." },
        { name: "Risk Per Trade", desc: "How much of your account you risk on each trade — shown as a percentage.", good: "Good: 0.5–2% per trade · Bad: above 3%", detail: "Risking 2% per trade means 5 consecutive losses = 10% drawdown. Risking 5% means the same = 25% gone." },
        { name: "Lot Size Consistency", desc: "How consistent your position sizing is across trades.", good: "Good: similar lot sizes · Bad: wildly varying", detail: "Inconsistent sizing is a sign of emotional trading — oversizing when overconfident, undersizing when fearful." },
      ],
    },
    behavior: {
      title: "Behavioral Pattern Detection",
      subtitle: "The patterns you don't notice — Firstrade does",
      cards: [
        { name: "Overtrading Detection", desc: "Days where you took more trades than your optimal threshold.", good: "Default threshold: 5 trades/day", detail: "Overtrading is driven by boredom or desperation — not edge. More trades = lower quality setups = worse results." },
        { name: "Revenge Trading", desc: "Taking a larger position right after a losing streak in an attempt to recover losses quickly.", good: "Detection: 3+ losses followed by a 1.5× larger position", detail: "Revenge trades have statistically lower win rates. They turn manageable losses into account-damaging ones." },
        { name: "FOMO Entries", desc: "Opening a new trade within minutes of closing a losing trade.", good: "Detection: new trade within 2 minutes of a loss", detail: "Emotional re-entries after losses are rarely planned trades. They are reactions — and reactions lose money." },
        { name: "Loss Holding Pattern", desc: "Holding losing trades significantly longer than winners.", good: "Detection: avg losing duration > 1.5× avg winning", detail: "'Cut losses short, let winners run' is the golden rule. Most traders do the exact opposite." },
        { name: "Best & Worst Day Patterns", desc: "Which days of the week you consistently profit or lose.", good: "Analyze day-by-day breakdown", detail: "Some traders systemically lose on Mondays or Fridays — often due to market conditions at open/close of week." },
      ],
    },
    sessions: {
      title: "Session Analysis",
      subtitle: "The market never sleeps — but you should know when to trade",
      cards: [
        { name: "Asian Session  00:00–08:00 UTC", desc: "Lower volatility, tighter ranges. Best for JPY pairs (USDJPY, GBPJPY). Trending moves are less common.", good: "Best for: range-bound strategies", detail: "If you lose consistently in Asian session, the low volatility may not suit your trading style." },
        { name: "London Session  08:00–16:00 UTC", desc: "Highest liquidity session. Major trends begin here. EUR, GBP pairs are most active.", good: "Best for: trend-following strategies", detail: "Most professional traders focus on London session — the highest volume means tighter spreads and cleaner moves." },
        { name: "New York Session  13:00–21:00 UTC", desc: "High volatility especially on US economic news. USD pairs move significantly.", good: "Best for: breakout and news strategies", detail: "The London/NY overlap (13:00–16:00 UTC) is the most volatile 3-hour window of the entire trading day." },
        { name: "Session Heatmap", desc: "A grid showing your average P&L for every combination of day (Mon–Fri) × session.", good: "Reveals personal edge patterns", detail: "This reveals your personal edge — some traders only have edge in specific session+day combinations." },
      ],
    },
    symbols: {
      title: "Symbol Analysis",
      subtitle: "Not all pairs are created equal — for you",
      cards: [
        { name: "Per-Symbol Breakdown", desc: "Firstrade breaks down your performance by each trading symbol so you can see exactly where your edge lies.", good: "Metrics: trade count, win rate, net P&L, profit factor, avg duration, best session", detail: "Many traders have a strong edge on 1–2 pairs and mediocre results on everything else. Concentrating on your best symbols is a proven improvement strategy." },
      ],
    },
    readiness: {
      title: "Readiness Score (0–100)",
      subtitle: "One number that tells you if you're ready to go live",
      cards: [
        { name: "Win Rate (30 pts)", desc: "≥60% → 30pts · ≥55% → 24pts · ≥50% → 18pts · <50% → reduced", good: "Measures entry quality", detail: "Your ability to pick winning setups is the foundation of trading edge." },
        { name: "RR Ratio (25 pts)", desc: "≥2.0 → 25pts · ≥1.5 → 20pts · ≥1.0 → 13pts · <1.0 → critical", good: "Measures reward vs risk", detail: "How much you make vs how much you risk on each trade." },
        { name: "Drawdown (25 pts)", desc: "≤5% → 25pts · ≤8% → 20pts · ≤12% → 13pts · >15% → critical", good: "Measures risk control", detail: "Keeping drawdown low proves you can protect capital." },
        { name: "Consistency (20 pts)", desc: "Score ≥80 → 20pts · ≥65 → 15pts · <45 → 3pts", good: "Measures predictability", detail: "Consistent results day over day prove skill, not luck." },
        { name: "Overtrading Penalty", desc: "-5pts per overtrading day (max -20)", good: "Penalizes emotional trading", detail: "Discipline is rewarded. Taking too many trades per day signals impulse, not strategy." },
      ],
    },
  };

  return (
    <Tabs defaultValue="performance" className="flex flex-col md:flex-row gap-8">
      <TabsList className="flex md:flex-col h-auto bg-card border border-border rounded-xl p-2 md:w-52 shrink-0">
        {tabs.map((t) => (
          <TabsTrigger key={t.id} value={t.id} className="justify-start gap-2 data-[state=active]:bg-[#6366f1]/10 data-[state=active]:text-[#6366f1] w-full">
            <span>{t.icon}</span> {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {Object.entries(content).map(([key, data]) => (
        <TabsContent key={key} value={key} className="flex-1 mt-0">
          <div className="mb-6">
            <h3 className="text-2xl font-bold">{data.title}</h3>
            <p className="text-muted-foreground">{data.subtitle}</p>
          </div>
          <div className={`grid gap-4 ${data.cards.length > 2 ? "md:grid-cols-2" : ""}`}>
            {data.cards.map((c) => (
              <div key={c.name} className="rounded-xl border border-border bg-card p-5 hover:border-[#6366f1]/30 transition-colors">
                <h4 className="font-semibold text-foreground mb-1">{c.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{c.desc}</p>
                <p className="text-xs text-[#6366f1] mb-2">{c.good}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.detail}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
