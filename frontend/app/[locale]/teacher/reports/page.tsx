import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getTeacherClasses } from "@/lib/actions/teacher";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { BarChart, FileText, Download } from "lucide-react";

export default async function TeacherReportsPage() {
  const t = await getTranslations();
  
  const classes = await getTeacherClasses();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("teacher.reports.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("teacher.reports.description")}
        </p>
      </div>

      {/* Report Types */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{t("teacher.reports.classStatistics")}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("teacher.reports.statisticsDesc")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              {t("teacher.reports.analyzeDesc")}
            </p>
            <Link href="/teacher/reports/statistics">
              <Button className="w-full">
                <BarChart className="h-4 w-4 mr-2" />
                {t("teacher.reports.viewStatistics")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-200 dark:bg-green-800 rounded-lg">
                <FileText className="h-6 w-6 text-green-700 dark:text-green-200" />
              </div>
              <div>
                <CardTitle>{t("teacher.reports.classReports")}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("teacher.reports.reportsDesc")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              {t("teacher.reports.comprehensiveDesc")}
            </p>
            <Link href="/teacher/reports/generate">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                {t("teacher.reports.generateReport")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links to Classes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("teacher.reports.yourClasses")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {classes.map((classItem: any) => (
            <Card key={classItem.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">{classItem.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {classItem.studentCount} {t("teacher.classes.students")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Link href={`/teacher/reports/statistics?class=${classItem.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      {t("teacher.reports.stats")}
                    </Button>
                  </Link>
                  <Link href={`/teacher/reports/generate?class=${classItem.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      {t("teacher.reports.report")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

