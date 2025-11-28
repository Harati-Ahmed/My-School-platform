import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getTeacherSchedule } from "@/lib/actions/teacher";
import { createClient } from "@/lib/supabase/server";
import { TeacherScheduleViewer } from "@/components/teacher/teacher-schedule-viewer";

export default async function TeacherSchedulePage() {
  const t = await getTranslations();
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div>Unauthorized</div>;
  }

  const academicYear = new Date().getFullYear().toString();
  const schedule = await getTeacherSchedule(academicYear);

  // Get periods for display
  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  let periods: any[] = [];
  if (userProfile?.school_id) {
    const { data: periodsData } = await supabase
      .from("class_periods")
      .select("*")
      .eq("school_id", userProfile.school_id)
      .eq("academic_year", academicYear)
      .order("period_number", { ascending: true });
    
    periods = periodsData || [];

    // Ensure we have exactly 6 periods (periods 1-6)
    const existingPeriodNumbers = new Set(periods.map((p) => p.period_number));
    const requiredPeriodNumbers = [1, 2, 3, 4, 5, 6];
    const missingPeriodNumbers = requiredPeriodNumbers.filter(
      (num) => !existingPeriodNumbers.has(num)
    );

    // If periods are missing, create them
    if (missingPeriodNumbers.length > 0) {
      const newPeriods = missingPeriodNumbers.map((periodNum) => {
        const startHour = 7 + periodNum; // 08:00, 09:00, 10:00, 11:00, 12:00, 13:00
        const endHour = startHour + 1;
        return {
          school_id: userProfile.school_id,
          period_number: periodNum,
          start_time: `${String(startHour).padStart(2, "0")}:00`,
          end_time: `${String(endHour).padStart(2, "0")}:00`,
          name: `Period ${periodNum}`,
          is_break: false,
          academic_year: academicYear,
        };
      });

      const { data: insertedData } = await supabase
        .from("class_periods")
        .insert(newPeriods)
        .select();
      
      // Combine existing and new periods
      periods = [...periods, ...(insertedData || [])].sort(
        (a, b) => a.period_number - b.period_number
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("teacher.schedule.title") || "My Schedule"}</h1>
        <p className="text-muted-foreground mt-2">
          {t("teacher.schedule.description") || "View your weekly class schedule"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("teacher.schedule.weeklySchedule") || "Weekly Schedule"}</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherScheduleViewer
            schedule={schedule}
            periods={periods}
          />
        </CardContent>
      </Card>
    </div>
  );
}

