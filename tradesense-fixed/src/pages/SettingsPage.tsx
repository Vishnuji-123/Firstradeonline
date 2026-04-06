import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTrades } from "@/contexts/TradesContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { trades, refetch } = useTrades();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save profile.");
    } else {
      toast.success("Profile updated successfully.");
    }
  };

  const handleClearTrades = async () => {
    if (!user) return;
    setClearing(true);
    const { error } = await supabase.from("trades").delete().eq("user_id", user.id);
    setClearing(false);
    setClearDialogOpen(false);
    if (error) {
      toast.error("Failed to clear trades.");
    } else {
      toast.success("All trades cleared.");
      refetch();
      navigate("/dashboard");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleComingSoon = () => {
    toast("Coming soon!", { description: "This feature will be available soon." });
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-heading">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <Button className="gradient-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-heading">Trading Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Total Trades</span>
              <p className="font-mono-num">{trades.length}</p>
            </div>
          </div>
          <Separator />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/import")}>Re-import Trades</Button>
            <Button variant="destructive" onClick={() => setClearDialogOpen(true)}>Clear All Trades</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-heading">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Weekly Performance Digest</p>
              <p className="text-xs text-muted-foreground">Receive a summary email every Monday</p>
            </div>
            <Switch defaultChecked onCheckedChange={() => handleComingSoon()} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Risk Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified about high drawdown events</p>
            </div>
            <Switch defaultChecked onCheckedChange={() => handleComingSoon()} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-heading">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleLogout}>Log Out</Button>
        </CardContent>
      </Card>

      {/* Clear trades confirmation */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Trades</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your imported trades. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearTrades} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={clearing}>
              {clearing ? "Deleting..." : "Delete All Trades"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
