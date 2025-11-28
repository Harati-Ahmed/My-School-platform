"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { LIBYA_SCHOOL_WEEK_DAYS } from "@/lib/constants/weekdays";

interface TeacherScheduleViewerProps {
  schedule: any[];
  periods: Array<{
    id: string;
    period_number: number;
    start_time: string;
    end_time: string;
    name?: string | null;
    is_break?: boolean;
  }>;
}

export function TeacherScheduleViewer({
  schedule,
  periods: allPeriods,
}: TeacherScheduleViewerProps) {
  const tScheduleDays = useTranslations("admin.schedules.days");
  const tSchedules = useTranslations("admin.schedules");
  const activePeriods = allPeriods.filter((p) => !p.is_break);

  const getScheduleEntry = (day: number, periodId: string) => {
    return schedule.find(
      (s) => s.day_of_week === day && s.periods?.id === periodId
    );
  };

  if (schedule.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {tSchedules("noScheduleAssigned", {
          default: "No schedule assigned yet. Contact your administrator.",
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left font-semibold">
              {tSchedules("periods.periodNumber", { default: "Period" })}
            </th>
            {LIBYA_SCHOOL_WEEK_DAYS.map((day) => (
              <th key={day.value} className="border p-2 text-center font-semibold">
                {tScheduleDays(day.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activePeriods.map((period) => (
            <tr key={period.id}>
              <td className="border p-2 text-sm">
                <div className="font-medium">
                  {period.name || `Period ${period.period_number}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {period.start_time} - {period.end_time}
                </div>
              </td>
              {LIBYA_SCHOOL_WEEK_DAYS.map((day) => {
                const entry = getScheduleEntry(day.value, period.id);

                return (
                  <td key={day.value} className="border p-2">
                    {entry ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {entry.subjects?.name_ar || entry.subjects?.name || "Unknown Subject"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.classes?.name || "Unknown Class"}
                          {entry.classes?.section && ` (${entry.classes.section})`}
                        </div>
                        {entry.room_number && (
                          <div className="text-xs text-muted-foreground">
                            Room: {entry.room_number}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">-</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

