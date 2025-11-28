import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getClasses, getClassPeriods } from "@/lib/actions/admin";
import { ScheduleManagement } from "@/components/admin/schedule-management";

export default async function SchedulesPage() {
  const t = await getTranslations();
  
  const [classesResult, periodsResult] = await Promise.all([
    getClasses(),
    getClassPeriods(),
  ]);

  const rawClasses =
    classesResult.data
      ?.filter((classItem: any) => classItem.is_active !== false)
      .map((classItem: any) => ({
        id: classItem.id,
        name: classItem.name,
        grade_level: classItem.grade_level,
        section: classItem.section,
      })) || [];

  const classGroups = rawClasses.reduce(
    (acc: Record<string, typeof rawClasses>, classItem) => {
      const year = classItem.grade_level || "Uncategorized";
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(classItem);
      return acc;
    },
    {}
  );

  const periods = periodsResult.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.schedules.title") || "Class Schedules"}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.schedules.description") || "Manage class timetables and teacher schedules"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.schedules.allSchedules") || "Schedule Management"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleManagement
            classGroups={classGroups}
            periods={periods}
          />
        </CardContent>
      </Card>
    </div>
  );
}

