import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getSchoolSettings } from "@/lib/actions/admin";
import { SettingsFormWithLogo } from "@/components/admin/settings-form-with-logo";
import { AdminAccountActionsCard } from "@/components/admin/account-actions-card";

export default async function SettingsPage() {
  const t = await getTranslations();
  const { data: settings, error } = await getSchoolSettings();

  if (error || !settings) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("admin.settings.title")}</h1>
        <p className="text-destructive">{t("common.error")}: Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.settings.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.settings.description")}
        </p>
      </div>

      {/* School Settings Form with Logo */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.settings.schoolInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsFormWithLogo initialSettings={settings} />
        </CardContent>
      </Card>

      <AdminAccountActionsCard />
    </div>
  );
}

