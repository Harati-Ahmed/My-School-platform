import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getClassAttendance } from "@/lib/actions/attendance";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { AttendanceMarker } from "@/components/shared/attendance-marker";

interface Props {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function ClassAttendancePage({ params, searchParams }: Props) {
  const t = await getTranslations();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { classId } = resolvedParams;
  const { date } = resolvedSearchParams;
  
  const selectedDate = date || new Date().toISOString().split('T')[0];
  const { students, attendance } = await getClassAttendance(classId, selectedDate);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/attendance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("teacher.attendance.markAttendance")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("teacher.attendance.markDescription")}
          </p>
        </div>
      </div>

      <AttendanceMarker 
        students={students} 
        classId={classId}
        initialDate={selectedDate}
        existingAttendance={attendance}
        revalidatePath="/teacher/attendance"
      />
    </div>
  );
}

