import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getTeacherDashboardStats, getTeacherRecentActivity } from "@/lib/actions/teacher";
import { Users, BookOpen, TrendingUp, GraduationCap } from "lucide-react";
import { format } from "date-fns";

export default async function TeacherDashboard() {
  const t = await getTranslations();
  
  const [stats, recentActivity] = await Promise.all([
    getTeacherDashboardStats(),
    getTeacherRecentActivity(),
  ]);

  const { recentHomework, recentGrades } = recentActivity;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("teacher.dashboard.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("common.welcome")}! Here's your overview
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("teacher.dashboard.totalStudents")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("teacher.dashboard.acrossAllClasses")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.dashboard.activeClasses")}
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("teacher.dashboard.classesYouTeach")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("teacher.dashboard.classPerformance")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePerformance}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("teacher.dashboard.averageGrade")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("teacher.dashboard.assignedHomework")}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingHomework}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("teacher.dashboard.dueInNext7Days")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Homework */}
        <Card>
          <CardHeader>
            <CardTitle>{t("teacher.dashboard.recentHomework")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentHomework.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("teacher.dashboard.noRecentHomework")}</p>
              ) : (
                recentHomework.map((hw: any) => (
                  <div key={hw.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{hw.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {hw.classes?.name} • {hw.subjects?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {t("parent.homework.dueDate")}: {format(new Date(hw.due_date), "MMM dd")}
                      </p>
                      <p className="text-xs text-primary">
                        {hw.completion_count} {t("teacher.homework.submitted")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle>{t("teacher.dashboard.recentGrades")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGrades.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("teacher.dashboard.noRecentGrades")}</p>
              ) : (
                recentGrades.map((grade: any) => (
                  <div key={grade.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{grade.students?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {grade.exam_name} • {grade.subjects?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {grade.grade}/{grade.max_grade}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(grade.date), "MMM dd")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

