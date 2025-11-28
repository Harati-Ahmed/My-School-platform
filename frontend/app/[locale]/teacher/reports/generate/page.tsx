import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getTeacherClasses } from "@/lib/actions/teacher";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ReportGenerator } from "@/components/teacher/report-generator";

interface Props {
  searchParams: Promise<{ class?: string }>;
}

export default async function GenerateReportPage({ searchParams }: Props) {
  const t = await getTranslations();
  const { class: classId } = await searchParams;
  
  const classes = await getTeacherClasses();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("teacher.reports.generateReport")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("teacher.reports.createReports")}
          </p>
        </div>
      </div>

      {/* Class Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("teacher.grades.selectClass")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {classes.map((cls: any) => (
              <Link key={cls.id} href={`/teacher/reports/generate?class=${cls.id}`}>
                <Button 
                  variant={classId === cls.id ? "default" : "outline"}
                  size="sm"
                >
                  {cls.name}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {classId ? (
        <ReportGenerator classId={classId} classes={classes} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {t("teacher.reports.selectClassReportPrompt")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

