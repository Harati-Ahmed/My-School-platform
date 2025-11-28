"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

interface Props {
  params: Promise<{ classId: string; locale: string }>;
}

export default function AdminViewAttendancePage({ params }: Props) {
  const t = useTranslations();
  const supabase = createClient();
  const [classId, setClassId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setClassId(resolvedParams.classId);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (classId) {
      loadData();
    }
  }, [classId, selectedDate, selectedStudent, dateRange]);

  const loadData = async () => {
    if (!classId) return;
    
    setLoading(true);

    try {
      // Get user's school_id for filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data: userProfile } = await supabase
        .from("users")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (!userProfile) throw new Error("User profile not found");

      // Fetch students in the class
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, name, student_id_number")
        .eq("class_id", classId)
        .eq("school_id", userProfile.school_id)
        .eq("is_active", true)
        .order("name");

      setStudents(studentsData || []);

      // Build query for attendance
      let query = supabase
        .from("attendance")
        .select(`
          id,
          date,
          status,
          note,
          marked_by,
          created_at,
          students:student_id(id, name, student_id_number),
          users:marked_by(name)
        `)
        .eq("class_id", classId)
        .eq("school_id", userProfile.school_id);

      // Filter by specific date if selected
      if (selectedDate) {
        query = query.eq("date", selectedDate);
      } else if (dateRange.start && dateRange.end) {
        // Filter by date range
        query = query
          .gte("date", dateRange.start)
          .lte("date", dateRange.end);
      }

      // Filter by student if selected
      if (selectedStudent && selectedStudent !== "all") {
        query = query.eq("student_id", selectedStudent);
      }

      const { data: attendanceData, error } = await query
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      setAttendance(attendanceData || []);
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "late":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "excused":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "absent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "late":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "excused":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Calculate statistics
  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    late: attendance.filter((a) => a.status === "late").length,
    excused: attendance.filter((a) => a.status === "excused").length,
  };

  // Group records by date
  const recordsByDate = attendance.reduce((acc: Record<string, any[]>, record: any) => {
    const dateKey = record.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(record);
    return acc;
  }, {});

  const sortedDates = Object.keys(recordsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/attendance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("admin.attendance.viewAttendance")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("admin.attendance.viewDescription")}
          </p>
        </div>
      </div>

      {/* Statistics */}
      {attendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.attendance.statistics")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t("admin.attendance.total")}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  {t("teacher.attendance.present")}
                </p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  {t("teacher.attendance.absent")}
                </p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-600" />
                  {t("teacher.attendance.late")}
                </p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3 text-blue-600" />
                  {t("teacher.attendance.excused")}
                </p>
                <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.attendance.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">{t("admin.attendance.selectDate")}</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateRange({ start: "", end: "" });
                }}
              />
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate("")}
                  className="h-8"
                >
                  {t("common.clear")}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">{t("admin.attendance.startDate")}</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange({ ...dateRange, start: e.target.value });
                  setSelectedDate("");
                }}
                disabled={!!selectedDate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">{t("admin.attendance.endDate")}</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange({ ...dateRange, end: e.target.value });
                  setSelectedDate("");
                }}
                disabled={!!selectedDate}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="student">{t("admin.attendance.selectStudent")}</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.attendance.allStudents")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.attendance.allStudents")}</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} {student.student_id_number && `(${student.student_id_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("admin.attendance.attendanceRecords")} 
            {attendance.length > 0 && ` (${attendance.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t("admin.attendance.noRecords")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => (
                <div key={dateKey} className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    {format(new Date(dateKey + "T00:00:00"), "EEEE, MMMM dd, yyyy")}
                  </h3>
                  <div className="space-y-2">
                    {recordsByDate[dateKey].map((record: any) => {
                      const student = Array.isArray(record.students) 
                        ? record.students[0] 
                        : record.students;
                      const markedBy = Array.isArray(record.users)
                        ? record.users[0]
                        : record.users;

                      return (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(record.status)}
                            <div>
                              <p className="font-medium">
                                {student?.name || "Unknown Student"}
                              </p>
                              {student?.student_id_number && (
                                <p className="text-sm text-muted-foreground">
                                  {t("common.studentId")}: {student.student_id_number}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.status)}`}>
                              {t(`teacher.attendance.${record.status}`)}
                            </span>
                            {record.note && (
                              <p className="text-sm text-muted-foreground max-w-xs truncate" title={record.note}>
                                {record.note}
                              </p>
                            )}
                            {markedBy && (
                              <p className="text-xs text-muted-foreground">
                                {t("admin.attendance.markedBy")}: {markedBy.name}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

