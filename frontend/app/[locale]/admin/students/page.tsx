import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getStudents, getClasses, getUsersByRole } from "@/lib/actions/admin";
import { StudentsManagement } from "@/components/admin/students-management";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; search?: string }>;
}) {
  const t = await getTranslations();
  const params = await searchParams;
  const page = params?.page ? parseInt(params.page, 10) : 1;
  const search = params?.search;
  
  const [
    studentsResult,
    classesResult,
    parentsResult,
  ] = await Promise.all([
    getStudents({ page, pageSize: 50, search }),
    getClasses(),
    getUsersByRole("parent", { page: 1, pageSize: 1000 }), // Parents list for dropdown, no pagination needed
  ]);

  const { data: students, pagination, error: studentsError } = studentsResult;
  const { data: classes, error: classesError } = classesResult;
  const { data: parents, error: parentsError } = parentsResult;

  // Handle errors
  if (studentsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("admin.students.title")}</h1>
        <p className="text-destructive">{t("common.error")}: Failed to load students - {studentsError}</p>
      </div>
    );
  }

  if (classesError) {
    console.error("Error loading classes:", classesError);
    // Continue rendering but log the error - classes will be empty array
  }

  if (parentsError) {
    console.error("Error loading parents:", parentsError);
    // Continue rendering but log the error - parents will be empty array
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.students.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.students.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.students.allStudents")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentsManagement
            initialStudents={students || []}
            classes={classes || []}
            parents={parents || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}

