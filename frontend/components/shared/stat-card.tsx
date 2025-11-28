"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    label?: string;
  };
  href?: string;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
}

/**
 * Reusable stat card component with optional click-through navigation
 * Can be used as a link or a regular card
 * Note: Icon should be passed as a ReactNode (rendered element) from a Server Component
 */
export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  href,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  className,
}: StatCardProps) {
  const isPositiveTrend = trend && trend.value > 0;
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

  const content = (
    <Card className={cn("relative overflow-hidden transition-all", className, href && "hover:border-primary cursor-pointer")}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", iconBgColor)}>
          <div className={cn("h-4 w-4", iconColor)}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendIcon
              className={cn(
                "h-4 w-4",
                isPositiveTrend ? "text-primary" : "text-destructive"
              )}
            />
            <span
              className={cn(
                "text-xs",
                isPositiveTrend ? "text-primary" : "text-destructive"
              )}
            >
              {Math.abs(trend.value).toFixed(1)}% {trend.label || ""}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

