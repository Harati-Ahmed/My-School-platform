"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickViewDialog } from "@/components/shared/quick-view-dialog";
import { ClassQuickViewStats } from "@/lib/actions/admin";
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  Mail,
  Phone,
  School,
  UserCircle,
  BadgeCheck,
  XCircle,
  CheckCircle2,
  Clock,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface ClassQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: ClassQuickViewStats | null;
  isLoading: boolean;
}

export function ClassQuickView({
  open,
  onOpenChange,
  stats,
  isLoading,
}: ClassQuickViewProps) {
  const t = useTranslations("admin.classes.quickView");
  
  return (
    <QuickViewDialog
      open={open}
      onOpenChange={onOpenChange}
      title={stats ? `${t("class")}: ${stats.name}` : t("classPreview")}
      entityId=""
      entityType="class"
      isLoading={isLoading}
    >
      {stats && (
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Class Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                {t("classInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("className")}</p>
                  <p className="font-medium">{stats.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("gradeLevel")}</p>
                  <p className="font-medium">{stats.grade_level}</p>
                </div>
                {stats.section && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("section")}</p>
                    <p className="font-medium">{stats.section}</p>
                  </div>
                )}
                {stats.academic_year && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("academicYear")}</p>
                    <p className="font-medium">{stats.academic_year}</p>
                  </div>
                )}
                {stats.room_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("roomNumber")}</p>
                    <p className="font-medium">{stats.room_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{t("capacity")}</p>
                  <p className="font-medium">{stats.totalStudents} / {stats.max_capacity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("status")}</p>
                  <div className="flex items-center gap-2">
                    {stats.is_active ? (
                      <>
                        <BadgeCheck className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">{t("active")}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-600 font-medium">{t("inactive")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Teacher */}
          {stats.mainTeacher && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  {t("mainTeacher")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{stats.mainTeacher.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{stats.mainTeacher.email}</span>
                </div>
                {stats.mainTeacher.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{stats.mainTeacher.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("students")} ({stats.totalStudents})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalStudents")}</p>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("activeStudents")}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeStudents}</p>
                </div>
              </div>
              {stats.students.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">{t("studentList")}</p>
                  <div className="space-y-2">
                    {stats.students.map((student, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          {student.student_id_number && (
                            <p className="text-xs text-muted-foreground">{student.student_id_number}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {stats.totalStudents > stats.students.length && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        {t("showing")} {stats.students.length} {t("of")} {stats.totalStudents}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("attendance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalDays")}</p>
                  <p className="text-2xl font-bold">{stats.attendance.total_days}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    {t("present")}
                  </p>
                  <p className="text-2xl font-bold text-green-600">{stats.attendance.present}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    {t("absent")}
                  </p>
                  <p className="text-2xl font-bold text-red-600">{stats.attendance.absent}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-orange-600" />
                    {t("late")}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">{stats.attendance.late}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">{t("last30Days")}</p>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("total")}</p>
                    <p className="font-bold">{stats.attendance.last_30_days.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("present")}</p>
                    <p className="font-bold text-green-600">{stats.attendance.last_30_days.present}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("absent")}</p>
                    <p className="font-bold text-red-600">{stats.attendance.last_30_days.absent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("late")}</p>
                    <p className="font-bold text-orange-600">{stats.attendance.last_30_days.late}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grades */}
          {stats.grades.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  {t("grades")} ({stats.grades.total} {t("total")})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">{t("averageGrade")}</p>
                  <p className="text-2xl font-bold">{stats.grades.average}</p>
                </div>
                {stats.grades.by_subject.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">{t("gradesBySubject")}</p>
                    <div className="space-y-3">
                      {stats.grades.by_subject.map((subject, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">{subject.subject}</p>
                            <p className="text-xs text-muted-foreground">{subject.count} {t("assessments")}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{subject.average}</p>
                            <p className="text-xs text-muted-foreground">{t("average")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subjects */}
          {stats.subjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t("subjects")} ({stats.subjects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  {stats.subjects.map((subject, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{subject.name}</p>
                        {subject.name_ar && (
                          <p className="text-xs text-muted-foreground">{subject.name_ar}</p>
                        )}
                      </div>
                      <div className="text-right ml-2">
                        {subject.teacher && (
                          <p className="text-xs font-medium">{subject.teacher.name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {subject.student_count} {t("students")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </QuickViewDialog>
  );
}
