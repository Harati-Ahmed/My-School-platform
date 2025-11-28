"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickViewDialog } from "@/components/shared/quick-view-dialog";
import { TeacherQuickViewStats } from "@/lib/actions/admin";
import { 
  Users, 
  School, 
  BookOpen, 
  Mail, 
  Phone,
  Activity,
  UserCircle,
  BadgeCheck,
  XCircle,
  Clock,
  FileText,
  GraduationCap,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface TeacherQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: TeacherQuickViewStats | null;
  isLoading: boolean;
}

export function TeacherQuickView({
  open,
  onOpenChange,
  stats,
  isLoading,
}: TeacherQuickViewProps) {
  const t = useTranslations("admin.teachers.quickView");
  
  return (
    <QuickViewDialog
      open={open}
      onOpenChange={onOpenChange}
      title={stats ? `${t("teacher")}: ${stats.name}` : t("teacherPreview")}
      entityId=""
      entityType="teacher"
      isLoading={isLoading}
    >
      {stats && (
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                {t("personalInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("fullName")}</p>
                  <p className="font-medium">{stats.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("email")}</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{stats.email}</p>
                  </div>
                </div>
                {stats.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("phone")}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{stats.phone}</p>
                    </div>
                  </div>
                )}
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
                {stats.last_login && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("lastLogin")}</p>
                    <p className="font-medium">{format(new Date(stats.last_login), "MMM dd, yyyy h:mm a")}</p>
                  </div>
                )}
                {stats.created_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("joinedDate")}</p>
                    <p className="font-medium">{format(new Date(stats.created_at), "MMM dd, yyyy")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t("activitySummary")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("gradesEntered")}</p>
                  <p className="text-2xl font-bold">{stats.activity.grades_entered}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("homeworkAssigned")}</p>
                  <p className="text-2xl font-bold">{stats.activity.homework_assigned}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("attendanceTaken")}</p>
                  <p className="text-2xl font-bold">{stats.activity.attendance_taken}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("notesWritten")}</p>
                  <p className="text-2xl font-bold">{stats.activity.notes_written}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classes */}
          {stats.classes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  {t("classes")} ({stats.totalClasses})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.classes.map((cls, idx) => (
                    <div key={idx} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("gradeLevel")}: {cls.grade_level}
                            {cls.section && ` • ${t("section")}: ${cls.section}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{cls.student_count} {t("students")}</p>
                          <p className="text-xs text-muted-foreground">{cls.academic_year}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subjects */}
          {stats.subjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t("subjects")} ({stats.totalSubjects})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  {stats.subjects.map((subject, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{subject.name}</p>
                        {subject.code && (
                          <p className="text-xs text-muted-foreground">{subject.code}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {subject.classes_count} {t("classes")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalClasses")}</p>
                  <p className="text-2xl font-bold">{stats.totalClasses}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalStudents")}</p>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalSubjects")}</p>
                  <p className="text-2xl font-bold">{stats.totalSubjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {stats.recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t("recentActivity")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.date), "MMM dd, yyyy h:mm a")}
                        </p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded ml-2">
                        {activity.type}
                      </span>
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
