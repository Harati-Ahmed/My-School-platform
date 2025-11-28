"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

/**
 * Parent Attendance Page with Calendar View
 * Shows attendance records with calendar visualization
 */
export default function AttendancePage() {
  const supabase = createClient();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const selectedStudentId = searchParams?.get("student");

  const [children, setChildren] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(selectedStudentId);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    rate: 0,
  });

  useEffect(() => {
    loadData();
  }, [selectedStudent, currentMonth]);

  const loadData = async () => {
    setLoading(true);
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch children
    const { data: childrenData } = await supabase
      .from("students")
      .select("id, name")
      .eq("parent_id", user.id)
      .eq("is_active", true);

    setChildren(childrenData || []);

    // Filter by specific student if provided
    const childrenIds = selectedStudent 
      ? [selectedStudent]
      : childrenData?.map(child => child.id) || [];

    // Don't query if no children
    if (childrenIds.length === 0) {
      setAttendance([]);
      setStats({ present: 0, absent: 0, late: 0, excused: 0, rate: 0 });
      setLoading(false);
      return;
    }

    // Get first and last day of current month (date only, no time)
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const firstDayStr = firstDay.toISOString().split('T')[0];
    const lastDayStr = lastDay.toISOString().split('T')[0];

    // Fetch attendance for current month
    const { data: attendanceData, error } = await supabase
      .from("attendance")
      .select(`
        id,
        date,
        status,
        note,
        student_id
      `)
      .in("student_id", childrenIds)
      .gte("date", firstDayStr)
      .lte("date", lastDayStr)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching attendance:", error);
    }

    // Map student names to attendance records
    const attendanceWithStudents = (attendanceData || []).map(record => ({
      ...record,
      student: childrenData?.find(child => child.id === record.student_id)
    }));

    setAttendance(attendanceWithStudents);

    // Calculate stats
    if (attendanceData && attendanceData.length > 0) {
      const present = attendanceData.filter(a => a.status === 'present').length;
      const absent = attendanceData.filter(a => a.status === 'absent').length;
      const late = attendanceData.filter(a => a.status === 'late').length;
      const excused = attendanceData.filter(a => a.status === 'excused').length;
      const total = attendanceData.length;
      
      setStats({
        present,
        absent,
        late,
        excused,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      });
    } else {
      setStats({ present: 0, absent: 0, late: 0, excused: 0, rate: 0 });
    }

    setLoading(false);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'late':
        return <Clock className="w-4 h-4 text-primary" />;
      case 'excused':
        return <AlertCircle className="w-4 h-4 text-primary" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'absent':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      case 'late':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
      case 'excused':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  // Generate calendar grid
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 bg-muted/50" />);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayAttendance = attendance.filter(a => a.date.startsWith(dateStr));
      
      days.push(
        <div
          key={day}
          className="h-20 border border-border p-1 hover:bg-muted/50 transition-colors"
        >
          <div className="text-sm font-medium mb-1">{day}</div>
          <div className="space-y-0.5">
            {dayAttendance.map(a => (
              <div
                key={a.id}
                className={`text-xs px-1 py-0.5 rounded flex items-center gap-1 ${getStatusColor(a.status)}`}
                title={`${a.student?.name}: ${t(`parent.attendance.${a.status}`)}`}
              >
                {getStatusIcon(a.status)}
                {children.length > 1 && (
                  <span className="truncate text-xs">{a.student?.name?.split(' ')[0]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("navigation.attendance")}</h1>
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("navigation.attendance")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("parent.attendance.description")}
        </p>
      </div>

      {/* Student Filter */}
      {children && children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={!selectedStudent ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStudent(null)}
          >
            {t("parent.homework.allChildren")}
          </Button>
          {children.map((child) => (
            <Button
              key={child.id}
              variant={selectedStudent === child.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStudent(child.id)}
            >
              {child.name}
            </Button>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.attendance.attendanceRate")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.attendance.present")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.attendance.absent")}</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.attendance.late")}</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.late}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.attendance.excused")}</CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.excused}</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("parent.attendance.calendar")}</CardTitle>
              <CardDescription>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => changeMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                {t("parent.attendance.today")}
              </Button>
              <Button variant="outline" size="icon" onClick={() => changeMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-px bg-border mb-px">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-background p-2 text-center text-sm font-medium">
                {t(`parent.attendance.${day.toLowerCase()}`)}
              </div>
            ))}
          </div>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-border">
            {generateCalendar()}
          </div>

          {/* Legend */}
          <div className="flex gap-4 justify-center mt-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>{t("parent.attendance.present")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>{t("parent.attendance.absent")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span>{t("parent.attendance.late")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span>{t("parent.attendance.excused")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance Records */}
      {attendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("parent.attendance.recentRecords")}</CardTitle>
            <CardDescription>{t("parent.attendance.latestEntries")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendance.slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <span className="font-medium">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                      {children.length > 1 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{record.student?.name}</span>
                        </>
                      )}
                    </div>
                    {record.note && (
                      <p className="text-sm text-muted-foreground mt-1">{record.note}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(record.status)}`}>
                    {t(`parent.attendance.${record.status}`)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {attendance.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("parent.attendance.noRecords")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("parent.attendance.noRecordsDesc")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

