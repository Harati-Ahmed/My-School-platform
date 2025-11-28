"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { markAttendanceBulk } from "@/lib/actions/attendance";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

interface AttendanceMarkerProps {
  students: any[];
  classId: string;
  initialDate: string;
  existingAttendance: any[];
  revalidatePath?: string;
}

type AttendanceStatus = "present" | "absent" | "late" | "excused";

export function AttendanceMarker({ 
  students, 
  classId, 
  initialDate, 
  existingAttendance,
  revalidatePath = "/admin/attendance"
}: AttendanceMarkerProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(initialDate);

  // Create a map of existing attendance
  const existingMap = new Map(existingAttendance.map(a => [a.student_id, a]));

  const [studentAttendance, setStudentAttendance] = useState<Record<string, {
    status: AttendanceStatus;
    note: string;
  }>>(() => {
    const initial: Record<string, { status: AttendanceStatus; note: string }> = {};
    students.forEach(student => {
      const existing = existingMap.get(student.id);
      initial[student.id] = {
        status: existing?.status || "present",
        note: existing?.note || "",
      };
    });
    return initial;
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      }
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      }
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    students.forEach(student => {
      updated[student.id] = {
        status,
        note: studentAttendance[student.id]?.note || "",
      };
    });
    setStudentAttendance(updated);
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    // Reload page with new date
    router.push(`?date=${newDate}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        class_id: classId,
        date,
        status: studentAttendance[student.id]?.status || "present",
        note: studentAttendance[student.id]?.note || undefined,
      }));

      await markAttendanceBulk(attendanceRecords, [revalidatePath]);
      router.refresh();
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const stats = {
    present: Object.values(studentAttendance).filter(a => a.status === "present").length,
    absent: Object.values(studentAttendance).filter(a => a.status === "absent").length,
    late: Object.values(studentAttendance).filter(a => a.status === "late").length,
    excused: Object.values(studentAttendance).filter(a => a.status === "excused").length,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("teacher.attendance.attendanceDate")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="date">{t("teacher.attendance.selectDate")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(date), "EEEE, MMMM dd, yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t("teacher.attendance.present")}</p>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t("teacher.attendance.absent")}</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t("teacher.attendance.late")}</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t("teacher.attendance.excused")}</p>
              <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teacher.attendance.markAllPresent")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleMarkAll("present")}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("teacher.attendance.markAllPresent")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleMarkAll("absent")}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {t("teacher.attendance.markAllAbsent")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("teacher.attendance.students")} ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {students.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("teacher.attendance.noStudents")}
            </p>
          ) : (
            students.map((student: any) => {
              const attendance = studentAttendance[student.id];

              return (
                <div
                  key={student.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      {student.student_id_number && (
                        <p className="text-sm text-muted-foreground">
                          {t("common.studentId")}: {student.student_id_number}
                        </p>
                      )}
                    </div>

                    {/* Status Buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={attendance.status === "present" ? "default" : "outline"}
                        onClick={() => handleStatusChange(student.id, "present")}
                        className={attendance.status === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {t("teacher.attendance.present")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={attendance.status === "absent" ? "default" : "outline"}
                        onClick={() => handleStatusChange(student.id, "absent")}
                        className={attendance.status === "absent" ? "bg-red-600 hover:bg-red-700" : ""}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {t("teacher.attendance.absent")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={attendance.status === "late" ? "default" : "outline"}
                        onClick={() => handleStatusChange(student.id, "late")}
                        className={attendance.status === "late" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        {t("teacher.attendance.late")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={attendance.status === "excused" ? "default" : "outline"}
                        onClick={() => handleStatusChange(student.id, "excused")}
                        className={attendance.status === "excused" ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {t("teacher.attendance.excused")}
                      </Button>
                    </div>
                  </div>

                  {/* Note Input */}
                  <div>
                    <Label htmlFor={`note-${student.id}`} className="text-sm">
                      {t("teacher.attendance.note")}
                    </Label>
                    <Input
                      id={`note-${student.id}`}
                      type="text"
                      placeholder={t("teacher.attendance.notePlaceholder")}
                      value={attendance.note}
                      onChange={(e) => handleNoteChange(student.id, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting || students.length === 0}>
          {isSubmitting ? t("common.loading") : t("teacher.attendance.saveAttendance")}
        </Button>
      </div>
    </form>
  );
}

