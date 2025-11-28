"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { markAttendanceBulk } from "@/lib/actions/attendance";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface AttendanceMarkerProps {
  students: any[];
  classId: string;
  initialDate: string;
  existingAttendance: any[];
}

type AttendanceStatus = "present" | "absent" | "late" | "excused";

export function AttendanceMarker({ students, classId, initialDate, existingAttendance }: AttendanceMarkerProps) {
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

      await markAttendanceBulk(attendanceRecords, ["/teacher/attendance"]);
      router.refresh();
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    router.push(`/teacher/attendance/${classId}?date=${newDate}`);
  };

  // Count statuses
  const counts = {
    present: Object.values(studentAttendance).filter(a => a.status === "present").length,
    absent: Object.values(studentAttendance).filter(a => a.status === "absent").length,
    late: Object.values(studentAttendance).filter(a => a.status === "late").length,
    excused: Object.values(studentAttendance).filter(a => a.status === "excused").length,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Selector and Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teacher.attendance.attendanceDate")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="date">{t("teacher.attendance.selectDate")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("present")}
              >
                {t("teacher.attendance.markAllPresent")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("absent")}
              >
                {t("teacher.attendance.markAllAbsent")}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{counts.present}</p>
                <p className="text-xs text-muted-foreground">{t("teacher.attendance.present")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{counts.absent}</p>
                <p className="text-xs text-muted-foreground">{t("teacher.attendance.absent")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{counts.late}</p>
                <p className="text-xs text-muted-foreground">{t("teacher.attendance.late")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{counts.excused}</p>
                <p className="text-xs text-muted-foreground">{t("teacher.attendance.excused")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teacher.classes.students")} ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {students.map((student: any) => {
              const attendance = studentAttendance[student.id] || { status: "present", note: "" };
              
              return (
                <div key={student.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {student.student_id_number || "N/A"}
                    </p>
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

                  {/* Note Input */}
                  <Input
                    placeholder={t("teacher.attendance.notePlaceholder")}
                    value={attendance.note}
                    onChange={(e) => handleNoteChange(student.id, e.target.value)}
                    className="w-48"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("teacher.attendance.saveAttendance")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

