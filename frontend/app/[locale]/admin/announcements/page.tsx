import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getAnnouncements, getClasses } from "@/lib/actions/admin";
import { AnnouncementsManagement } from "@/components/admin/announcements-management";

export default async function AnnouncementsPage() {
  const t = await getTranslations();
  
  const [
    { data: announcements, error },
    { data: classes },
  ] = await Promise.all([
    getAnnouncements(),
    getClasses(),
  ]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("admin.announcements.title")}</h1>
        <p className="text-destructive">{t("common.error")}: Failed to load announcements</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.announcements.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.announcements.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.announcements.allAnnouncements")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementsManagement
            initialAnnouncements={announcements || []}
            classes={classes || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}

