import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getTeacherClasses } from "@/lib/actions/teacher";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Calendar, GraduationCap, Eye } from "lucide-react";

export default async function TeacherAttendancePage() {
  const t = await getTranslations();
  
  const classes = await getTeacherClasses();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("teacher.attendance.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("teacher.attendance.description")}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">{t("teacher.attendance.howToMark")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("teacher.attendance.howToMarkDesc")}
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
                  
                  <div className="pt-2 border-t space-y-2">
                    <Link href={`/teacher/attendance/${classItem.id}`}>
                      <Button className="w-full" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        {t("teacher.attendance.markAttendance")}
                      </Button>
                    </Link>
                    <Link href={`/teacher/attendance/${classItem.id}/view`}>
                      <Button className="w-full" size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        {t("teacher.attendance.viewAttendance")}
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

