import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getTeacherHomework } from "@/lib/actions/teacher";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Eye, CheckCircle } from "lucide-react";
import { format, isPast } from "date-fns";
import { HomeworkActions } from "@/components/teacher/homework-actions";

export default async function TeacherHomeworkPage() {
  const t = await getTranslations();
  
  const homework = await getTeacherHomework();
  
  // Separate into upcoming and past
  const upcomingHomework = homework.filter((hw: any) => !isPast(new Date(hw.due_date)));
  const pastHomework = homework.filter((hw: any) => isPast(new Date(hw.due_date)));
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("teacher.homework.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("teacher.homework.description")}
          </p>
        </div>
        <Link href="/teacher/homework/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("teacher.homework.createHomework")}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("teacher.homework.totalHomework")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{homework.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("teacher.homework.upcoming")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingHomework.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("teacher.homework.pastDue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastHomework.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Homework */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("teacher.homework.upcoming")} {t("teacher.homework.title")}</h2>
        {upcomingHomework.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("teacher.homework.noUpcoming")}</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                {t("teacher.homework.noUpcomingDesc")}
              </p>
              <Link href="/teacher/homework/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("teacher.homework.createHomework")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {upcomingHomework.map((hw: any) => (
              <Card key={hw.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">{hw.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {hw.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {hw.classes?.name}
                            </span>
                            <span className="text-xs bg-secondary px-2 py-1 rounded">
                              {hw.subjects?.name}
                            </span>
                            {!hw.is_published && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                {t("teacher.homework.draft")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{t("parent.homework.dueDate")}: {format(new Date(hw.due_date), "MMM dd, yyyy h:mm a")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              <span>{hw.completion_count} {t("teacher.homework.submitted")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{hw.view_count} {t("teacher.homework.views")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <HomeworkActions homeworkId={hw.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Homework */}
      {pastHomework.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t("teacher.homework.pastHomework")}</h2>
          <div className="grid gap-4">
            {pastHomework.map((hw: any) => (
              <Card key={hw.id} className="opacity-75 hover:opacity-100 transition-opacity">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{hw.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {hw.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {hw.classes?.name}
                        </span>
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          {hw.subjects?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{t("parent.homework.dueDate")}: {format(new Date(hw.due_date), "MMM dd, yyyy")}</span>
                        <span>{hw.completion_count} {t("teacher.homework.submitted")}</span>
                      </div>
                    </div>
                    <HomeworkActions homeworkId={hw.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

