import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getTeacherClasses } from "@/lib/actions/teacher";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap, Eye } from "lucide-react";

export default async function TeacherGradesPage() {
  const t = await getTranslations();
  
  const classes = await getTeacherClasses();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("teacher.grades.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("teacher.grades.description")}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">{t("teacher.grades.howToAdd")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("teacher.grades.howToAddDesc")}
          </p>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("teacher.grades.selectClass")}</h2>
        
        {classes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("teacher.classes.noClasses")}</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {t("teacher.classes.noClassesDesc")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem: any) => (
              <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {classItem.grade_level} {classItem.section ? `• ${classItem.section}` : ""}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("teacher.classes.students")}</span>
                    <span className="text-2xl font-bold">{classItem.studentCount}</span>
                  </div>
                  
                  {classItem.subjects && classItem.subjects.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {t("teacher.classes.subjectsYouTeach")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {classItem.subjects.map((subject: any, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs bg-secondary px-2 py-1 rounded"
                            title={subject.name}
                          >
                            {subject.name_ar || subject.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Link href={`/teacher/grades/${classItem.id}`} className="flex-1">
                    <Button className="w-full" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("teacher.grades.manageGrades")}
                    </Button>
                  </Link>
                    <Link href={`/teacher/grades/${classItem.id}/view`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

