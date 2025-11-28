import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getUsersByRole, getSubjects, getClasses } from "@/lib/actions/admin";
import { TeachersManagement } from "@/components/admin/teachers-management";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; search?: string }>;
}) {
  const t = await getTranslations();
  const params = await searchParams;
  const page = params?.page ? parseInt(params.page, 10) : 1;
  const search = params?.search;
  
  const [teachersResult, subjectsResult, classesResult] = await Promise.all([
    getUsersByRole("teacher", { page, pageSize: 50, search }),
    getSubjects(),
    getClasses(),
  ]);

  const { data: teachers, pagination, error } = teachersResult;
  const availableSubjects: Array<{
    id: string;
    name: string;
    name_ar: string;
    code?: string | null;
    school_id?: string | null;
  }> =
    (subjectsResult.data || [])
      .filter((subject: any) => subject.is_active !== false)
      .map((subject: any) => ({
        id: subject.id,
        name: subject.name,
        name_ar: subject.name_ar,
        code: subject.code,
        school_id: subject.school_id,
      }));

  const availableGradeLevels: string[] = Array.from(
    new Set(
      (classesResult.data || [])
        .map((classItem: any) => classItem.grade_level)
        .filter((grade: string | null | undefined) => Boolean(grade))
    )
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("admin.teachers.title")}</h1>
        <p className="text-destructive">{t("common.error")}: Failed to load teachers</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.teachers.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.teachers.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.teachers.allTeachers")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TeachersManagement
            initialTeachers={teachers || []}
            availableSubjects={availableSubjects}
            availableGradeLevels={availableGradeLevels}
          />
        </CardContent>
      </Card>
    </div>
  );
}

