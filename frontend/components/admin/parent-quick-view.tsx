"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickViewDialog } from "@/components/shared/quick-view-dialog";
import { ParentQuickViewStats } from "@/lib/actions/admin";
import { 
  UserCircle, 
  Mail, 
  Phone,
  Users,
  School,
  Calendar,
  BookOpen,
  FileText,
  BadgeCheck,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  GraduationCap
} from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface ParentQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: ParentQuickViewStats | null;
  isLoading: boolean;
}

export function ParentQuickView({
  open,
  onOpenChange,
  stats,
  isLoading,
}: ParentQuickViewProps) {
  const t = useTranslations("admin.parents.quickView");
  
  return (
    <QuickViewDialog
      open={open}
      onOpenChange={onOpenChange}
      title={stats ? `${t("parent")}: ${stats.name}` : t("parentPreview")}
      entityId=""
      entityType="parent"
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

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("summary")} ({stats.totalChildren} {t("children")})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("totalAttendanceDays")}</p>
                  <p className="text-2xl font-bold">{stats.summary.totalAttendanceDays}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    {t("presentDays")}
                  </p>
                  <p className="text-2xl font-bold text-green-600">{stats.summary.totalPresentDays}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    {t("absentDays")}
                  </p>
                  <p className="text-2xl font-bold text-red-600">{stats.summary.totalAbsentDays}</p>
                </div>
                {stats.summary.averageGrade !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("averageGrade")}</p>
                    <p className="text-2xl font-bold">{stats.summary.averageGrade}%</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">{t("pendingHomework")}</p>
                  <p className="text-xl font-bold text-orange-600">{stats.summary.totalPendingHomework}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("completedHomework")}</p>
                  <p className="text-xl font-bold text-green-600">{stats.summary.totalCompletedHomework}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("overdueHomework")}</p>
                  <p className="text-xl font-bold text-red-600">{stats.summary.totalOverdueHomework}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Children Information */}
          {stats.children.length > 0 && (
            <div className="space-y-4">
              {stats.children.map((child) => (
                <Card key={child.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      {child.name}
                      {child.student_id_number && (
                        <span className="text-sm font-normal text-muted-foreground">
                          ({child.student_id_number})
                        </span>
                      )}
                      {!child.is_active && (
                        <span className="text-xs text-red-600 font-normal">({t("inactive")})</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Child Personal Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {child.date_of_birth && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t("dateOfBirth")}</p>
                          <p className="font-medium">{format(new Date(child.date_of_birth), "MMM dd, yyyy")}</p>
                        </div>
                      )}
                      {child.gender && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t("gender")}</p>
                          <p className="font-medium capitalize">{child.gender}</p>
                        </div>
                      )}
                      {child.enrollment_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t("enrollmentDate")}</p>
                          <p className="font-medium">{format(new Date(child.enrollment_date), "MMM dd, yyyy")}</p>
                        </div>
                      )}
                    </div>

                    {/* Class Information */}
                    {child.class && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <School className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{t("classInfo")}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">{t("className")}</p>
                            <p className="font-medium">{child.class.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t("gradeLevel")}</p>
                            <p className="font-medium">{child.class.grade_level}</p>
                          </div>
                          {child.class.section && (
                            <div>
                              <p className="text-sm text-muted-foreground">{t("section")}</p>
                              <p className="font-medium">{child.class.section}</p>
                            </div>
                          )}
                          {child.class.main_teacher && (
                            <div>
                              <p className="text-sm text-muted-foreground">{t("mainTeacher")}</p>
                              <p className="font-medium">{child.class.main_teacher}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Attendance */}
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{t("attendance")}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("totalDays")}</p>
                          <p className="text-xl font-bold">{child.attendance.total_days}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {t("present")}
                          </p>
                          <p className="text-xl font-bold text-green-600">{child.attendance.present}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-600" />
                            {t("absent")}
                          </p>
                          <p className="text-xl font-bold text-red-600">{child.attendance.absent}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-orange-600" />
                            {t("late")}
                          </p>
                          <p className="text-xl font-bold text-orange-600">{child.attendance.late}</p>
                        </div>
                      </div>
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">{t("last30Days")}</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">{t("total")}</p>
                            <p className="font-bold">{child.attendance.last_30_days.total}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t("present")}</p>
                            <p className="font-bold text-green-600">{child.attendance.last_30_days.present}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t("absent")}</p>
                            <p className="font-bold text-red-600">{child.attendance.last_30_days.absent}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grades */}
                    {child.grades.total > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{t("grades")} ({child.grades.total} {t("total")})</p>
                          {child.grades.average !== undefined && (
                            <span className="text-sm text-muted-foreground">
                              • {t("average")}: {child.grades.average}%
                            </span>
                          )}
                        </div>
                        {child.grades.by_subject.length > 0 && (
                          <div className="space-y-2">
                            {child.grades.by_subject.map((subject, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <p className="text-sm font-medium">{subject.subject}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {subject.count} {t("assessments")}
                                  </p>
                                </div>
                                <p className="font-bold">{subject.average}%</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Homework */}
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{t("homework")}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("pending")}</p>
                          <p className="text-xl font-bold text-orange-600">{child.homework.pending}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t("completed")}</p>
                          <p className="text-xl font-bold text-green-600">{child.homework.completed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t("overdue")}</p>
                          <p className="text-xl font-bold text-red-600">{child.homework.overdue}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Children Message */}
          {stats.children.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("noChildren")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </QuickViewDialog>
  );
}

