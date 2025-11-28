import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getClassesForAttendance } from "@/lib/actions/attendance";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Users, School, Clock } from "lucide-react";
import { format } from "date-fns";

export default async function HRDashboard() {
  const t = await getTranslations();
  const supabase = await createClient();
  
  const classes = await getClassesForAttendance();
  
  // Get today's attendance stats
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAttendance } = await supabase
    .from("attendance")
    .select("status")
    .eq("date", today);

  const stats = {
    totalClasses: classes.length,
    todayPresent: todayAttendance?.filter(a => a.status === "present").length || 0,
    todayAbsent: todayAttendance?.filter(a => a.status === "absent").length || 0,
    todayLate: todayAttendance?.filter(a => a.status === "late").length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("hr.dashboard.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("hr.dashboard.description")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("hr.dashboard.totalClasses")}
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("hr.dashboard.todayPresent")}
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.todayPresent}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "EEEE, MMMM dd")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("hr.dashboard.todayAbsent")}
            </CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.todayAbsent}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "EEEE, MMMM dd")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("hr.dashboard.todayLate")}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.todayLate}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "EEEE, MMMM dd")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("hr.dashboard.quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">{t("hr.attendance.title")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("hr.dashboard.markAttendanceDesc")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

