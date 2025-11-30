import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getDashboardStats } from "@/lib/actions/admin";
import { RecentActivity } from "@/components/admin/recent-activity";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";

export default async function AdminDashboard() {
  const t = await getTranslations();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if user is super admin and redirect to super admin dashboard
  if (user) {
    const { data: userProfile } = await supabase
      .from("users")
      .select("school_id")
      .eq("id", user.id)
      .single();
    
    if (userProfile?.school_id === null) {
      // Super admin - redirect to dedicated super admin dashboard
      redirect("/admin/super-admin");
    }
  }
  
  let isSuperAdmin = false;
  
  let stats;
  try {
    stats = await getDashboardStats();
  } catch (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("admin.dashboard.title")}</h1>
        <p className="text-destructive">{t("common.error")}: Failed to load dashboard data</p>
      </div>
    );
  }

  const statCards = [
    {
      title: t("admin.dashboard.totalStudents"),
      value: stats.totalStudents,
      icon: GraduationCap,
      trend: stats.studentsGrowth,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t("admin.dashboard.totalTeachers"),
      value: stats.totalTeachers,
      icon: Users,
      trend: stats.teachersGrowth,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t("admin.dashboard.totalParents"),
      value: stats.totalParents,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t("admin.dashboard.activeClasses"),
      value: stats.activeClasses,
      icon: School,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: t("admin.dashboard.totalSubjects"),
      value: stats.totalSubjects,
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.dashboard.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.dashboard.welcomeMessage")}
        </p>
        {isSuperAdmin && (
          <p className="text-sm text-primary mt-1 font-medium">
            🔑 Super Admin Mode - Full Access
          </p>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const showTrend = stat.trend !== undefined;
          const isPositiveTrend = stat.trend && stat.trend > 0;

          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {showTrend && (
                  <div className="flex items-center gap-1 mt-1">
                    {isPositiveTrend ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span
                      className={`text-xs ${
                        isPositiveTrend ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {Math.abs(stat.trend!).toFixed(1)}% {t("admin.dashboard.from30Days")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity - Loads progressively if not in initial stats */}
      <RecentActivity initialActivities={stats.recentActivities || []} />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dashboard.quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <a
              href="/admin/students"
              className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
            >
              <GraduationCap className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">{t("admin.dashboard.manageStudents")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("admin.dashboard.addOrEditStudents")}
              </p>
            </a>
            <a
              href="/admin/classes"
              className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
            >
              <School className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">{t("admin.dashboard.manageClasses")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("admin.dashboard.createOrUpdateClasses")}
              </p>
            </a>
            <a
              href="/admin/teachers"
              className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
            >
              <Users className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">{t("admin.dashboard.manageTeachers")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("admin.dashboard.addOrRemoveTeachers")}
              </p>
            </a>
            <a
              href="/admin/reports"
              className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
            >
              <Activity className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">{t("admin.dashboard.viewReports")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("admin.dashboard.generateSchoolReports")}
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

