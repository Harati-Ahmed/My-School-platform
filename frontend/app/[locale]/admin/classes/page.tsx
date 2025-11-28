import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getClasses, getUsersByRole } from "@/lib/actions/admin";
import { ClassesManagement } from "@/components/admin/classes-management";

export default async function ClassesPage() {
  const t = await getTranslations();
  
  const [
    { data: classes, error: classesError },
    { data: teachers },
  ] = await Promise.all([
    getClasses(),
    getUsersByRole("teacher"),
  ]);

  if (classesError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("admin.classes.title")}</h1>
        <p className="text-destructive">{t("common.error")}: Failed to load classes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.classes.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.classes.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.classes.allClasses")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassesManagement
            initialClasses={classes || []}
            teachers={teachers || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}

