import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getAuditLogs } from "@/lib/actions/admin";
import { AuditLogsViewer } from "@/components/admin/audit-logs-viewer";

export default async function AuditLogsPage() {
  const t = await getTranslations();
  const { data: logs, error } = await getAuditLogs({ limit: 100 });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("admin.auditLogs.title")}</h1>
        <p className="text-destructive">{t("common.error")}: Failed to load audit logs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.auditLogs.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.auditLogs.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.auditLogs.recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogsViewer initialLogs={logs || []} />
        </CardContent>
      </Card>
    </div>
  );
}

