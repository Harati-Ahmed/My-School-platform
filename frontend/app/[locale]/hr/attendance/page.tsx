import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClassesForAttendance } from "@/lib/actions/attendance";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Users, School } from "lucide-react";

/**
 * HR Attendance Management Page
 * Shows all classes and allows marking attendance
 */
export default async function HRAttendancePage() {
  const t = await getTranslations("hr.attendance");
  const classes = await getClassesForAttendance();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t("noClasses")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  {classItem.name}
                </CardTitle>
                <CardDescription>
                  {t("gradeLevel")}: {classItem.grade_level}
                  {classItem.section && ` • ${t("section")}: ${classItem.section}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>{classItem.academic_year}</span>
                </div>
                <Link href={`/hr/attendance/${classItem.id}`}>
                  <Button className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    {t("markAttendance")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

