import { getClassAttendance } from "@/lib/actions/attendance";
import { getTranslations } from "next-intl/server";
import { AttendanceMarker } from "@/components/shared/attendance-marker";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function HRClassAttendancePage({ params, searchParams }: Props) {
  const t = await getTranslations("hr.attendance");
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { classId } = resolvedParams;
  const { date } = resolvedSearchParams;
  
  const selectedDate = date || new Date().toISOString().split('T')[0];
  const { students, attendance } = await getClassAttendance(classId, selectedDate);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/hr/attendance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("markAttendance")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("markDescription")}
          </p>
        </div>
      </div>

      <AttendanceMarker 
        students={students} 
        classId={classId}
        initialDate={selectedDate}
        existingAttendance={attendance}
        revalidatePath="/hr/attendance"
      />
    </div>
  );
}

