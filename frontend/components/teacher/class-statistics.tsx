import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGradesByClassAndSubject, getClassAttendanceStats } from "@/lib/actions/teacher";
import { TrendingUp, TrendingDown, Users, Calendar } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface ClassStatisticsProps {
  classId: string;
}

export async function ClassStatistics({ classId }: ClassStatisticsProps) {
  const t = await getTranslations();
  // Get last 30 days for attendance stats
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [gradesData, attendanceData] = await Promise.all([
    getGradesByClassAndSubject(classId),
    getClassAttendanceStats(classId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]),
  ]);

  // Calculate grade statistics
  const gradeStats = {
    total: gradesData.grades.length,
    average: gradesData.grades.length > 0
      ? (gradesData.grades.reduce((sum: number, g: any) => sum + Number(g.percentage), 0) / gradesData.grades.length).toFixed(1)
      : 0,
    highest: gradesData.grades.length > 0
      ? Math.max(...gradesData.grades.map((g: any) => Number(g.percentage)))
      : 0,
    lowest: gradesData.grades.length > 0
      ? Math.min(...gradesData.grades.map((g: any) => Number(g.percentage)))
      : 0,
  };

  // Calculate grade distribution
  const gradeRanges = {
    excellent: gradesData.grades.filter((g: any) => g.percentage >= 90).length,
    good: gradesData.grades.filter((g: any) => g.percentage >= 80 && g.percentage < 90).length,
    satisfactory: gradesData.grades.filter((g: any) => g.percentage >= 70 && g.percentage < 80).length,
    needsImprovement: gradesData.grades.filter((g: any) => g.percentage < 70).length,
  };

  // Calculate attendance statistics
  const totalRecords = attendanceData.length;
  const presentCount = attendanceData.filter((a: any) => a.status === "present").length;
  const absentCount = attendanceData.filter((a: any) => a.status === "absent").length;
  const lateCount = attendanceData.filter((a: any) => a.status === "late").length;
  const excusedCount = attendanceData.filter((a: any) => a.status === "excused").length;

  const attendanceRate = totalRecords > 0 
    ? ((presentCount / totalRecords) * 100).toFixed(1)
    : 0;

  // Get student count
  const studentCount = gradesData.students.length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("teacher.reports.totalStudents")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("teacher.reports.classAverage")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeStats.average}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("teacher.reports.basedOn", { count: gradeStats.total })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("teacher.reports.attendanceRate")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("teacher.reports.last30Days")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("teacher.reports.absentDays")}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("teacher.reports.last30Days")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teacher.reports.gradeDistribution")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t("teacher.reports.excellent")}</span>
                <span className="font-semibold">{gradeRanges.excellent} {t("teacher.classes.students")}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${gradesData.grades.length > 0 ? (gradeRanges.excellent / gradesData.grades.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t("teacher.reports.good")}</span>
                <span className="font-semibold">{gradeRanges.good} {t("teacher.classes.students")}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${gradesData.grades.length > 0 ? (gradeRanges.good / gradesData.grades.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t("teacher.reports.satisfactory")}</span>
                <span className="font-semibold">{gradeRanges.satisfactory} {t("teacher.classes.students")}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{ width: `${gradesData.grades.length > 0 ? (gradeRanges.satisfactory / gradesData.grades.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t("teacher.reports.needsImprovement")}</span>
                <span className="font-semibold">{gradeRanges.needsImprovement} {t("teacher.classes.students")}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${gradesData.grades.length > 0 ? (gradeRanges.needsImprovement / gradesData.grades.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teacher.reports.attendanceBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{presentCount}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("teacher.attendance.present")}</p>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{absentCount}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("teacher.attendance.absent")}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{lateCount}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("teacher.attendance.late")}</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{excusedCount}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("teacher.attendance.excused")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {gradesData.grades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("teacher.reports.recentHighlights")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gradesData.grades.slice(0, 5).map((grade: any) => (
                <div key={grade.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{grade.students?.name}</p>
                    <p className="text-sm text-muted-foreground">{grade.exam_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{Number(grade.percentage).toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">
                      {grade.grade}/{grade.max_grade}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

