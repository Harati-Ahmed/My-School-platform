import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getGradesByClassAndSubject, getTeacherSubjects } from "@/lib/actions/teacher";
import { ArrowLeft, Eye } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { BulkGradeEntry } from "@/components/teacher/bulk-grade-entry";

interface Props {
  params: Promise<{ classId: string; locale: string }>;
  searchParams: Promise<{ subject?: string }>;
}

export default async function ClassGradesPage({ params, searchParams }: Props) {
  const t = await getTranslations();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { classId } = resolvedParams;
  let { subject: subjectId } = resolvedSearchParams;
  
  if (!classId) {
    return (
      <div className="space-y-6">
        <p className="text-destructive">Invalid class ID</p>
      </div>
    );
  }
  
  const classSubjects = await getTeacherSubjects(classId);
  
  // Auto-select subject if teacher only teaches one subject
  if (!subjectId && classSubjects.length === 1 && classSubjects[0]?.id) {
    subjectId = classSubjects[0].id;
  }
  
  // Fetch grades data with the (possibly auto-selected) subject
  const { students, grades } = await getGradesByClassAndSubject(classId, subjectId);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/teacher/grades">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("teacher.grades.manageGrades")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("teacher.grades.manageDescription")}
          </p>
        </div>
        </div>
        <Link href={`/teacher/grades/${classId}/view${subjectId ? `?subject=${subjectId}` : ""}`}>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            {t("teacher.grades.viewGrades")}
          </Button>
        </Link>
      </div>

      {/* Subject Filter */}
      {classSubjects.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("teacher.grades.selectSubject")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {classSubjects.map((subject: any) => (
                <Link key={subject.id} href={`/teacher/grades/${classId}?subject=${subject.id}`}>
                  <Button 
                    variant={subjectId === subject.id ? "default" : "outline"}
                    size="sm"
                  >
                    {subject.name}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {classSubjects.length === 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border border-border bg-muted/60 px-3 py-2 text-sm font-medium">
              {t("teacher.grades.autoSelectedSubject")}: {classSubjects[0].name}
            </div>
          </CardContent>
        </Card>
      )}

      {subjectId ? (
        <BulkGradeEntry 
          students={students} 
          subjectId={subjectId}
          classId={classId}
          existingGrades={grades}
        />
      ) : classSubjects.length > 1 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {t("teacher.grades.selectSubjectPrompt")}
            </p>
          </CardContent>
        </Card>
      ) : classSubjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {t("teacher.grades.noSubjectsForClass")}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

