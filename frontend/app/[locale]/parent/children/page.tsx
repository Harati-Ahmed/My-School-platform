import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { User, GraduationCap, Calendar, BookOpen, TrendingUp } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

/**
 * Parent Children List Page
 * Shows detailed information about all children
 */
export default async function ChildrenPage() {
  const supabase = await createClient();
  const t = await getTranslations();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  // Fetch children with detailed information
  const { data: children } = await supabase
    .from("students")
    .select(`
      *,
      classes:class_id (
        id,
        name,
        grade_level,
        section,
        academic_year
      )
    `)
    .eq("parent_id", user.id)
    .eq("is_active", true)
    .order("name");

  // For each child, fetch stats
  const childrenWithStats = await Promise.all(
    (children || []).map(async (child) => {
      // Get attendance rate for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: totalDays } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("student_id", child.id)
        .gte("date", startOfMonth.toISOString());

      const { count: presentDays } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("student_id", child.id)
        .eq("status", "present")
        .gte("date", startOfMonth.toISOString());

      const attendanceRate = totalDays ? Math.round((presentDays || 0) / totalDays * 100) : 0;

      // Get pending homework count
      const { count: pendingHomework } = await supabase
        .from("homework_submissions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", child.id)
        .is("submitted_at", null);

      // Get average grade
      const { data: grades } = await supabase
        .from("grades")
        .select("grade, max_grade, percentage")
        .eq("student_id", child.id);

      const averageGrade = grades && grades.length > 0
        ? Math.round(
            grades.reduce((sum, grade) => {
              if (typeof grade.percentage === "number") {
                return sum + grade.percentage;
              }

              if (
                typeof grade.grade === "number" &&
                typeof grade.max_grade === "number" &&
                grade.max_grade > 0
              ) {
                return sum + (grade.grade / grade.max_grade) * 100;
              }

              return sum + (typeof grade.grade === "number" ? grade.grade : 0);
            }, 0) / grades.length
          )
        : null;

      return {
        ...child,
        stats: {
          attendanceRate,
          pendingHomework: pendingHomework || 0,
          averageGrade,
        },
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("parent.children.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("parent.children.description")}
        </p>
      </div>

      {childrenWithStats && childrenWithStats.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {childrenWithStats.map((child) => (
            <Card key={child.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {child.profile_picture_url ? (
                      <img
                        src={child.profile_picture_url}
                        alt={child.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                        {child.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-xl">{child.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <GraduationCap className="w-4 h-4" />
                        {child.classes?.name || t("parent.children.noClass")}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <div className="text-2xl font-bold">{child.stats.attendanceRate}%</div>
                      <div className="text-xs text-muted-foreground">{t("parent.children.attendanceRate")}</div>
                    </div>
                    
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <div className="text-2xl font-bold">{child.stats.pendingHomework}</div>
                      <div className="text-xs text-muted-foreground">{t("parent.children.pendingHomework")}</div>
                    </div>
                    
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <div className="text-2xl font-bold">
                        {child.stats.averageGrade !== null ? child.stats.averageGrade : '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">{t("parent.children.averageGrade")}</div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("parent.children.studentId")}</span>
                      <span className="font-medium">{child.student_id_number || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("parent.children.gradeLevel")}</span>
                      <span className="font-medium">{child.classes?.grade_level || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("parent.children.section")}</span>
                      <span className="font-medium">{child.classes?.section || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("parent.children.academicYear")}</span>
                      <span className="font-medium">{child.classes?.academic_year || '-'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/parent/grades?student=${child.id}`}>
                        {t("navigation.grades")}
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/parent/homework?student=${child.id}`}>
                        {t("navigation.homework")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("parent.children.noChildren")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("parent.children.contactAdmin")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

