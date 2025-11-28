import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function HRSettingsPage() {
  const t = await getTranslations("hr.settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profileInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("comingSoon")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

