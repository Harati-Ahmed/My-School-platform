import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getPlatformStats, getAllSchools } from "@/lib/actions/super-admin";
import { SuperAdminPanel } from "@/components/admin/super-admin-panel";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  Building2,
  UserCog,
  TrendingUp,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SuperAdminDashboard() {
  const t = await getTranslations();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if user is super admin
  if (!user) redirect("/login");
  
  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();
  
  const isSuperAdmin = userProfile?.school_id === null;
  
  if (!isSuperAdmin) {
    redirect("/admin/dashboard");
  }
  
  const statsResult = await getPlatformStats();
  const schoolsResult = await getAllSchools();
  
  const stats = statsResult.data || {
    totalSchools: 0,
    activeSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalAdmins: 0,
    totalHR: 0,
    totalClasses: 0,
    totalSubjects: 0,
    recentSchools: 0,
  };

  const statCards = [
    {
      title: t("admin.superAdmin.totalSchools"),
      value: stats.totalSchools,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      description: `${stats.activeSchools || stats.totalSchools} ${t("admin.superAdmin.activeSchools")} • ${stats.recentSchools} ${t("admin.superAdmin.newThisMonth")}`,
    },
    {
      title: t("admin.superAdmin.totalStudents"),
      value: stats.totalStudents,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      description: t("admin.superAdmin.acrossAllSchools"),
    },
    {
      title: t("admin.superAdmin.totalTeachers"),
      value: stats.totalTeachers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      description: t("admin.superAdmin.acrossAllSchools"),
    },
    {
      title: t("admin.superAdmin.totalAdmins"),
      value: stats.totalAdmins,
      icon: UserCog,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      description: t("admin.superAdmin.schoolAdministrators"),
    },
    {
      title: t("admin.superAdmin.totalClasses"),
      value: stats.totalClasses,
      icon: School,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
      description: t("admin.superAdmin.acrossAllSchools"),
    },
    {
      title: t("admin.superAdmin.totalSubjects"),
      value: stats.totalSubjects,
      icon: BookOpen,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
      description: t("admin.superAdmin.acrossAllSchools"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">{t("admin.superAdmin.title")}</h1>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
            {t("admin.superAdmin.platformOverview")}
          </span>
        </div>
        <p className="text-muted-foreground">
          {t("admin.superAdmin.description")}
        </p>
      </div>

      {/* Platform Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* School Management Panel */}
      <SuperAdminPanel initialSchools={schoolsResult.data || []} />
    </div>
  );
}

