import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

/**
 * Parent Dashboard Home Page
 * Shows overview of all children and recent activities
 */
export default async function ParentDashboard() {
  const supabase = await createClient();
  const t = await getTranslations();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  // Fetch children with their class information
  const { data: children } = await supabase
    .from("students")
    .select(`
      *,
      classes:class_id (
        id,
        name,
        grade_level,
        section
      )
    `)
    .eq("parent_id", user.id)
    .eq("is_active", true);

  // Get all children IDs for further queries
  const childrenIds = children?.map(child => child.id) || [];

  // Fetch pending homework count for all children
  const { count: pendingHomeworkCount } = await supabase
    .from("homework_submissions")
    .select("id", { count: "exact", head: true })
    .in("student_id", childrenIds)
    .is("submitted_at", null)
    .eq("is_active", true);

  // Fetch unread teacher notes count
  const { count: unreadNotesCount } = await supabase
    .from("teacher_notes")
    .select("id", { count: "exact", head: true })
    .in("student_id", childrenIds)
    .eq("is_read", false);

  // Fetch recent attendance for current week (count absences)
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { count: absenceCount } = await supabase
    .from("attendance")
    .select("id", { count: "exact", head: true })
    .in("student_id", childrenIds)
    .eq("status", "absent")
    .gte("date", startOfWeek.toISOString());

  // Fetch recent activities (last 5)
  const { data: recentActivities } = await supabase
    .from("teacher_notes")
    .select(`
      id,
      content,
      note_type,
      created_at,
      students:student_id (name),
      users:teacher_id (name)
    `)
    .in("student_id", childrenIds)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("parent.dashboard.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("common.welcome")}! {t("parent.dashboard.recentActivity")}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.children.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("parent.dashboard.activeStudents")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.children.pendingHomework")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingHomeworkCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("parent.dashboard.needsAttention")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("navigation.teacherNotes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotesCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("parent.dashboard.unreadMessages")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.dashboard.weekAbsences")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absenceCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("parent.dashboard.thisWeek")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Children Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children?.map((child) => (
          <Card key={child.id}>
            <CardHeader>
              <CardTitle>{child.name}</CardTitle>
              <CardDescription>
                {child.classes?.name || t("parent.children.currentClass")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("parent.children.viewDetails")}
              </p>
            </CardContent>
          </Card>
        ))}
        
        {(!children || children.length === 0) && (
          <Card>
            <CardHeader>
              <CardTitle>{t("parent.children.title")}</CardTitle>
              <CardDescription>
                {t("navigation.parents")}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t("parent.dashboard.recentActivity")}</CardTitle>
          <CardDescription>{t("parent.dashboard.latestUpdates")}</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex gap-4 items-start border-b pb-3 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.note_type === 'positive' ? 'bg-primary' :
                    activity.note_type === 'concern' ? 'bg-destructive' :
                    activity.note_type === 'behavioral' ? 'bg-accent' :
                    'bg-primary'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.students?.name} - {activity.users?.name}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {activity.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("parent.dashboard.noRecentActivity")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

