import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "positive" | "negative" | "neutral";
  suffix?: string;
}

export function KPICard({ title, value, icon: Icon, trend = "neutral", suffix }: KPICardProps) {
  return (
    <Card className="gradient-card border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={`text-2xl font-bold font-mono-num ${
              trend === "positive" ? "text-profit" : trend === "negative" ? "text-loss" : "text-foreground"
            }`}>
              {value}{suffix}
            </p>
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
            trend === "positive" ? "bg-profit/10" : trend === "negative" ? "bg-loss/10" : "bg-primary/10"
          }`}>
            <Icon className={`h-4 w-4 ${
              trend === "positive" ? "text-profit" : trend === "negative" ? "text-loss" : "text-primary"
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
