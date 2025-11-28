"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuditLogs } from "@/lib/actions/admin";

interface ActivityLog {
  id: string;
  action: string;
  userName: string;
  userRole: string;
  timestamp: string;
  details?: string;
}

interface RecentActivityProps {
  initialActivities?: ActivityLog[];
}

/**
 * Recent Activity Component
 * Progressively loads audit logs after initial page render
 */
export function RecentActivity({ initialActivities = [] }: RecentActivityProps) {
  const t = useTranslations();
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivities);
  const [isLoading, setIsLoading] = useState(!initialActivities || initialActivities.length === 0);
  const [hasError, setHasError] = useState(false);

  // Load audit logs after component mounts (progressive loading)
  useEffect(() => {
    // Only fetch if we don't have initial activities
    if (initialActivities && initialActivities.length > 0) {
      setIsLoading(false);
      return;
    }

    const loadActivities = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const result = await getAuditLogs({ limit: 5 });

        if (result.error || !result.data) {
          throw new Error(result.error || "Failed to load activities");
        }

        // Transform audit logs to activity format
        const transformedActivities: ActivityLog[] = (result.data || []).map((log: any) => ({
          id: log.id,
          action: log.action,
          userName: log.user?.name || "Unknown",
          userRole: log.user?.role || "unknown",
          timestamp: log.created_at,
          details: log.details || undefined,
        }));

        setActivities(transformedActivities);
      } catch (error) {
        console.error("Error loading recent activities:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to allow critical content to render first
    const timer = setTimeout(loadActivities, 100);
    return () => clearTimeout(timer);
  }, [initialActivities]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <CardTitle>{t("admin.dashboard.recentActivity")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          <p className="text-muted-foreground text-center py-8">
            {t("common.error")}: {t("admin.dashboard.failedToLoadActivity") || "Failed to load recent activity"}
          </p>
        ) : activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t("admin.dashboard.noRecentActivity")}
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted"
              >
                <div className="mt-0.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {activity.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{activity.userName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {activity.userRole}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {activity.action}
                    {activity.details && (
                      <span className="text-foreground"> - {activity.details}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

