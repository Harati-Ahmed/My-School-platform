"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { Filter, RefreshCw } from "lucide-react";
import { getAuditLogs } from "@/lib/actions/admin";
import toast from "react-hot-toast";

/**
 * Audit Logs Viewer Component
 */

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

interface AuditLogsViewerProps {
  initialLogs: AuditLog[];
}

export function AuditLogsViewer({ initialLogs }: AuditLogsViewerProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const [logs, setLogs] = useState(initialLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleRefresh = async () => {
    setIsLoading(true);

    try {
      const result = await getAuditLogs({
        action: actionFilter && actionFilter !== "all" ? actionFilter : undefined,
        entityType: entityTypeFilter && entityTypeFilter !== "all" ? entityTypeFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });

      if (result.error || !result.data) {
        throw new Error("Failed to load logs");
      }

      setLogs(result.data as any);
      toast.success(tAdmin("logsRefreshed"));
    } catch (error) {
      console.error("Error refreshing logs:", error);
      toast.error(tAdmin("failedToRefresh"));
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
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

  const columns = [
    {
      key: "action",
      label: tAdmin("action"),
      render: (log: AuditLog) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${getActionBadgeColor(
            log.action
          )}`}
        >
          {log.action}
        </span>
      ),
    },
    {
      key: "entity_type",
      label: tAdmin("entityType"),
      render: (log: AuditLog) => (
        <span className="capitalize">{log.entity_type}</span>
      ),
    },
    {
      key: "user",
      label: tAdmin("user"),
      render: (log: AuditLog) => (
        <div>
          <p className="font-medium">{log.user.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {log.user.role}
          </p>
        </div>
      ),
    },
    {
      key: "details",
      label: t("details"),
      render: (log: AuditLog) => (
        <span className="text-sm">{log.details || "-"}</span>
      ),
    },
    {
      key: "created_at",
      label: tAdmin("time"),
      render: (log: AuditLog) => (
        <div>
          <p className="text-sm">
            {formatDistanceToNow(new Date(log.created_at), {
              addSuffix: true,
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="action_filter">{tAdmin("action")}</Label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder={tAdmin("allActions")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tAdmin("allActions")}</SelectItem>
              <SelectItem value="CREATE">{t("create")}</SelectItem>
              <SelectItem value="UPDATE">{t("update")}</SelectItem>
              <SelectItem value="DELETE">{t("delete")}</SelectItem>
              <SelectItem value="BULK_IMPORT">{tAdmin("bulkImport")}</SelectItem>
              <SelectItem value="GENERATE_REPORT">{tAdmin("generateReport")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entity_type_filter">{tAdmin("entityType")}</Label>
          <Select
            value={entityTypeFilter}
            onValueChange={setEntityTypeFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder={tAdmin("allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tAdmin("allTypes")}</SelectItem>
              <SelectItem value="user">{tAdmin("user")}</SelectItem>
              <SelectItem value="student">{tAdmin("student")}</SelectItem>
              <SelectItem value="class">{tAdmin("class")}</SelectItem>
              <SelectItem value="subject">{tAdmin("subject")}</SelectItem>
              <SelectItem value="announcement">{tAdmin("announcement")}</SelectItem>
              <SelectItem value="school">{tAdmin("school")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">{tAdmin("startDate")}</Label>
          <Input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">{tAdmin("endDate")}</Label>
          <Input
            id="end_date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? tAdmin("refreshing") : tAdmin("applyFilters")}
        </Button>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        searchKeys={["details"]}
        searchPlaceholder={tAdmin("searchLogs")}
        emptyMessage={tAdmin("noLogs")}
        itemsPerPage={20}
      />
    </div>
  );
}

