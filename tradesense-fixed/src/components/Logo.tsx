import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  linkTo?: string;
}

export function LogoMark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const h = size === "sm" ? 24 : size === "lg" ? 36 : 28;
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: h, width: h }}
      className={className}
    >
      {/* Candle 1 - short */}
      <rect x="4" y="22" width="6" height="10" rx="1" fill="#6366f1" />
      <line x1="7" y1="18" x2="7" y2="22" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="32" x2="7" y2="35" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />

      {/* Candle 2 - medium */}
      <rect x="15" y="16" width="6" height="14" rx="1" fill="#6366f1" />
      <line x1="18" y1="11" x2="18" y2="16" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="30" x2="18" y2="34" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />

      {/* Candle 3 - tall with arrow */}
      <rect x="26" y="12" width="6" height="16" rx="1" fill="#6366f1" />
      <line x1="29" y1="28" x2="29" y2="33" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
      {/* Arrow wick going up */}
      <line x1="29" y1="12" x2="29" y2="4" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      <polyline points="25,8 29,3 33,8" stroke="#34d399" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, iconOnly = false, size = "md", linkTo = "/" }: LogoProps) {
  const fontSize = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark size={size} />
      {!iconOnly && (
        <span className={cn("font-bold tracking-[-0.5px]", fontSize)} style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
          <span className="text-foreground">First</span>
          <span style={{ color: "#6366f1" }}>trade</span>
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="inline-flex">{content}</Link>;
  }
  return content;
}
