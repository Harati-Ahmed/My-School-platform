"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { Filter, RefreshCw, Loader2, Building2, User } from "lucide-react";
import { getPlatformAuditLogs } from "@/lib/actions/super-admin";
import toast from "react-hot-toast";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string;
  created_at: string;
  school_id?: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
    role: string;
    email?: string;
  };
  school?: {
    id: string;
    name: string;
    name_ar?: string;
  };
}

interface PlatformAuditLogsViewerProps {
  initialLogs: AuditLog[];
  schools: Array<{ id: string; name: string; name_ar?: string }>;
}

export function PlatformAuditLogsViewer({
  initialLogs,
  schools,
}: PlatformAuditLogsViewerProps) {
  const t = useTranslations();
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleRefresh = async () => {
    setIsLoading(true);

    try {
      const result = await getPlatformAuditLogs({
        schoolId: schoolFilter && schoolFilter !== "all" ? schoolFilter : undefined,
        action: actionFilter && actionFilter !== "all" ? actionFilter : undefined,
        entityType: entityTypeFilter && entityTypeFilter !== "all" ? entityTypeFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 500,
      });

      if (result.error || !result.data) {
        throw new Error(result.error || "Failed to load logs");
      }

      setLogs(result.data as any);
      toast.success(t("admin.superAdmin.logsRefreshed"));
    } catch (error) {
      console.error("Error refreshing logs:", error);
      toast.error(t("admin.superAdmin.failedToRefreshLogs"));
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action?.toUpperCase()) {
      case "CREATE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "UPDATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "BULK_IMPORT":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  // Get unique action types and entity types from logs
  const uniqueActions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const uniqueEntityTypes = Array.from(new Set(logs.map((log) => log.entity_type))).sort();

  const columns = [
    {
      key: "timestamp",
      label: t("admin.superAdmin.timestamp"),
      render: (log: AuditLog) => (
        <div>
          <p className="text-sm font-medium">
            {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
          </p>
        </div>
      ),
    },
    {
      key: "action",
      label: t("admin.superAdmin.action"),
      render: (log: AuditLog) => (
        <Badge className={getActionBadgeColor(log.action)}>
          {log.action}
        </Badge>
      ),
    },
    {
      key: "entity",
      label: t("admin.superAdmin.entity"),
      render: (log: AuditLog) => (
        <div>
          <p className="text-sm font-medium">{log.entity_type}</p>
          {log.entity_id && (
            <p className="text-xs text-muted-foreground truncate max-w-[100px]">
              ID: {log.entity_id.slice(0, 8)}...
            </p>
          )}
        </div>
      ),
    },
    {
      key: "user",
      label: t("admin.superAdmin.user"),
      render: (log: AuditLog) =>
        log.user ? (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{log.user.name}</p>
              <p className="text-xs text-muted-foreground">{t(`roles.${log.user.role}`)}</p>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "school",
      label: t("admin.superAdmin.school"),
      render: (log: AuditLog) =>
        log.school ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{log.school.name}</p>
              {log.school.name_ar && (
                <p className="text-xs text-muted-foreground">{log.school.name_ar}</p>
              )}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "details",
      label: t("admin.superAdmin.details"),
      render: (log: AuditLog) =>
        log.details ? (
          <p className="text-sm text-muted-foreground max-w-[200px] truncate">
            {log.details}
          </p>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("admin.superAdmin.platformAuditLogs")}</CardTitle>
            <CardDescription>
              {t("admin.superAdmin.platformAuditLogsSubtitle")} ({logs.length})
            </CardDescription>
          </div>
          <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {t("common.refreshing")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <h3 className="font-semibold">{t("admin.superAdmin.filters")}</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="school-filter">{t("admin.superAdmin.filterBySchool")}</Label>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="action-filter">{t("admin.superAdmin.filterByAction")}</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entity-filter">{t("admin.superAdmin.filterByEntity")}</Label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {uniqueEntityTypes.map((entityType) => (
                    <SelectItem key={entityType} value={entityType}>
                      {entityType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date">{t("admin.superAdmin.startDate")}</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">{t("admin.superAdmin.endDate")}</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4 mr-2" />
                  {t("admin.superAdmin.applyFilters")}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Audit Logs Table */}
        <DataTable
          data={logs}
          columns={columns}
          searchKeys={["action", "entity_type", "details"]}
          searchPlaceholder={t("admin.superAdmin.searchAuditLogs")}
          emptyMessage={t("admin.superAdmin.noAuditLogsFound")}
          itemsPerPage={25}
        />
      </CardContent>
    </Card>
  );
}

