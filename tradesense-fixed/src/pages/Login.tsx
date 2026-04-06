import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo, LogoMark } from "@/components/Logo";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message?.includes("Email not confirmed")) {
        setLoginError("Please verify your email first. Check your inbox for a verification code.");
      } else {
        setLoginError("Invalid email or password");
      }
    } else {
      navigate("/dashboard");
    }
  };

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error("Failed to send reset email");
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-10 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b, #0f0f1a)" }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 400 600">
          {[50,120,190,260,330].map((x, i) => (
            <g key={i}>
              <rect x={x} y={200 + (i % 3) * 50} width="14" height={60 + (i % 4) * 25} fill="white" rx="2" />
              <line x1={x + 7} y1={180 + (i % 3) * 30} x2={x + 7} y2={200 + (i % 3) * 50} stroke="white" strokeWidth="1.5" />
            </g>
          ))}
        </svg>

        <Logo size="md" linkTo="/" />

        <div className="relative z-10 max-w-sm">
          <p className="text-2xl md:text-3xl font-bold text-white/90 italic leading-snug mb-3">
            "The market rewards preparation, not courage."
          </p>
          <p className="text-sm text-white/40">— Trading Proverb</p>
          <div className="flex flex-col gap-2 mt-8">
            {["15+ analytics metrics tracked", "Behavioral pattern detection", "Readiness score before going live"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-[#34d399]">✓</span> {t}
              </div>
            ))}
          </div>
        </div>

        <svg className="w-full h-16 opacity-10" viewBox="0 0 400 60" fill="none">
          <path d="M0 50 Q50 45 100 35 T200 20 T300 25 T400 10" stroke="white" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#080810]">
        <div className="w-full max-w-[420px]">
          <div className="flex justify-center mb-8">
            <Link to="/">
              <LogoMark size="md" />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-center mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Sign in to your Firstrade account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" required className="pl-10" value={email} onChange={(e) => { setEmail(e.target.value); setLoginError(""); }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPw ? "text" : "password"} placeholder="Your password" required className="pl-10 pr-10" value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(""); }} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-right">
                <button type="button" className="text-xs text-[#6366f1] hover:underline" onClick={() => { setResetEmail(email); setResetOpen(true); setResetSent(false); }}>Forgot password?</button>
              </div>
            </div>

            {loginError && (
              <p className={`text-sm ${loginError.includes("verify") ? "text-amber-400" : "text-destructive"}`}>{loginError}</p>
            )}

            <Button type="submit" className="w-full h-12 bg-[#6366f1] hover:bg-[#5558e6] text-white text-base" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</span>
              ) : "Sign In"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#6366f1] hover:underline font-medium">Create one free →</Link>
          </p>
        </div>
      </div>

      {/* Reset password modal */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
          </DialogHeader>
          {resetSent ? (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">Check your email for reset instructions.</p>
              <Button variant="outline" className="mt-4 w-full" onClick={() => setResetOpen(false)}>Close</Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <Input type="email" placeholder="Your email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              <Button className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white" onClick={handleReset}>Send Reset Email</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
