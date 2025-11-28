import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getTeacherClasses } from "@/lib/actions/teacher";
import { Users, BookOpen, GraduationCap } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export default async function TeacherClassesPage() {
  const t = await getTranslations();
  
  const classes = await getTeacherClasses();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("teacher.classes.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("teacher.classes.description")}
        </p>
      </div>

      {/* Classes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("teacher.classes.noClasses")}</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {t("teacher.classes.noClassesDesc")}
              </p>
            </CardContent>
          </Card>
        ) : (
          classes.map((classItem: any) => (
            <Card key={classItem.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{classItem.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {classItem.grade_level} {classItem.section ? `• ${classItem.section}` : ""}
                    </p>
                  </div>
                  {classItem.role === "main_teacher" && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {t("teacher.classes.mainTeacher")}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{classItem.studentCount}</p>
                      <p className="text-xs text-muted-foreground">{t("teacher.classes.students")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">
                        {classItem.subjects?.length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("teacher.classes.subjects")}</p>
                    </div>
                  </div>
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

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{t("teacher.classes.room")}: {classItem.room_number || "N/A"}</span>
                    <span>{classItem.academic_year}</span>
                  </div>
                  <Link href={`/teacher/classes/${classItem.id}`}>
                    <Button className="w-full" size="sm">
                      {t("teacher.classes.viewStudents")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

