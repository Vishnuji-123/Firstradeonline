import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo, LogoMark } from "@/components/Logo";
import { Mail, Lock, Eye, EyeOff, User, CheckCircle, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-destructive", "bg-warning", "bg-[#6366f1]", "bg-[#34d399]"];

  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength] : "bg-muted"}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{labels[strength]}</p>
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Check if email already registered (identities empty)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("This email is already registered. Please log in.");
      return;
    }
    if (data.user) {
      toast.success("Account created! Please sign in.");
      navigate("/login");
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

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#080810]">
        <div className="w-full max-w-[420px]">
          <div className="flex justify-center mb-6">
            <Link to="/">
              <LogoMark size="md" />
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-center mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Free forever. No credit card required.</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Vishu Porwal" required className="pl-10" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="you@example.com" required className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPw ? "text" : "password"} placeholder="Min. 8 characters" required minLength={8} className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="Re-enter password" required className={`pl-10 pr-10 ${passwordsMatch ? "border-[#34d399]" : passwordsMismatch ? "border-destructive" : ""}`} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                {passwordsMatch && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#34d399]" />}
                {passwordsMismatch && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive text-sm">✕</span>}
              </div>
            </div>
            <Button type="submit" className="w-full h-12 bg-[#6366f1] hover:bg-[#5558e6] text-white text-base" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</span>
              ) : <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link to="/login" className="text-[#6366f1] hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
