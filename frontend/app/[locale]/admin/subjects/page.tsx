import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getSubjects, getAllSchools } from "@/lib/actions/admin";
import { SubjectsManagement } from "@/components/admin/subjects-management";

export default async function SubjectsPage() {
  const t = await getTranslations();
  
  const [
    { data: subjects, error: subjectsError },
    { data: schools },
  ] = await Promise.all([
    getSubjects(),
    getAllSchools(),
  ]);

  if (subjectsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("admin.subjects.title")}</h1>
        <p className="text-destructive">{t("common.error")}: Failed to load subjects</p>
      </div>
    );
  }

  // Map schools to ensure type safety
  const mappedSchools = (schools || [])
    .filter((school) => school?.name && school?.id)
    .map((school) => ({
      id: school.id,
      name: school.name || '',
      name_ar: school.name_ar || undefined,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.subjects.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.subjects.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.subjects.allSubjects")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectsManagement
            initialSubjects={subjects || []}
            schools={mappedSchools}
          />
        </CardContent>
      </Card>
    </div>
  );
}

