"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickViewDialog } from "@/components/shared/quick-view-dialog";
import { StudentQuickViewStats } from "@/lib/actions/admin";
import { 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  Users, 
  Mail, 
  Phone,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Stethoscope,
  Home,
  School,
  UserCircle,
  BadgeCheck,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface StudentQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: StudentQuickViewStats | null;
  isLoading: boolean;
}

export function StudentQuickView({
  open,
  onOpenChange,
  stats,
  isLoading,
}: StudentQuickViewProps) {
  const t = useTranslations("admin.students.quickView");
  
  return (
    <QuickViewDialog
      open={open}
      onOpenChange={onOpenChange}
      title={stats ? `${t("student")}: ${stats.name}` : t("studentPreview")}
      entityId=""
      entityType="student"
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
                {stats.student_id_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("studentId")}</p>
                    <p className="font-medium">{stats.student_id_number}</p>
                  </div>
                )}
                {stats.date_of_birth && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("dateOfBirth")}</p>
                    <p className="font-medium">{format(new Date(stats.date_of_birth), "MMM dd, yyyy")}</p>
                  </div>
                )}
                {stats.gender && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("gender")}</p>
                    <p className="font-medium capitalize">{stats.gender}</p>
                  </div>
                )}
                {stats.enrollment_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("enrollmentDate")}</p>
                    <p className="font-medium">{format(new Date(stats.enrollment_date), "MMM dd, yyyy")}</p>
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
              </div>
            </CardContent>
          </Card>

          {/* Class Information */}
          {stats.class && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  {t("classInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("className")}</p>
                    <p className="font-medium">{stats.class.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("gradeLevel")}</p>
                    <p className="font-medium">{stats.class.grade_level}</p>
                  </div>
                  {stats.class.section && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("section")}</p>
                      <p className="font-medium">{stats.class.section}</p>
                    </div>
                  )}
                  {stats.class.academic_year && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("academicYear")}</p>
                      <p className="font-medium">{stats.class.academic_year}</p>
                    </div>
                  )}
                  {stats.class.room_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("roomNumber")}</p>
                      <p className="font-medium">{stats.class.room_number}</p>
                    </div>
                  )}
                  {stats.class.main_teacher && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("mainTeacher")}</p>
                      <p className="font-medium">{stats.class.main_teacher}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parent Information */}
          {stats.parent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t("parentInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{stats.parent.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{stats.parent.email}</span>
                </div>
                {stats.parent.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{stats.parent.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Emergency Contact */}
          {stats.emergency_contact && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {t("emergencyContact")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.emergency_contact.name && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("contactName")}</p>
                    <p className="font-medium">{stats.emergency_contact.name}</p>
                  </div>
                )}
                {stats.emergency_contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{stats.emergency_contact.phone}</span>
                  </div>
                )}
                {stats.emergency_contact.relation && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("relation")}</p>
                    <p className="font-medium">{stats.emergency_contact.relation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Medical Information */}
          {stats.medical_info && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  {t("medicalInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{stats.medical_info}</p>
              </CardContent>
            </Card>
          )}

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
                <div className="grid grid-cols-3 gap-4">
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grades by Subject */}
          {stats.grades.by_subject.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t("gradesBySubject")} ({stats.grades.total} {t("total")})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.grades.by_subject.map((subject, idx) => (
                    <div key={idx} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{subject.subject}</p>
                        <span className="text-sm text-muted-foreground">{subject.count} {t("assessments")}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">{t("average")}</p>
                          <p className="font-bold">{subject.average_grade}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("highest")}</p>
                          <p className="font-bold text-green-600">{subject.highest_grade}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("lowest")}</p>
                          <p className="font-bold text-red-600">{subject.lowest_grade}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Grades */}
          {stats.grades.recent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("recentGrades")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.grades.recent.map((grade, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="font-medium">{grade.exam_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">{grade.subject}</p>
                          {grade.teacher && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <p className="text-sm text-muted-foreground">{grade.teacher}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{grade.grade}/{grade.max_grade}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(grade.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Homework */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("homework")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("pending")}</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.homework.pending}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("completed")}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.homework.completed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("overdue")}</p>
                  <p className="text-2xl font-bold text-red-600">{stats.homework.overdue}</p>
                </div>
              </div>
              {stats.homework.pending_list.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">{t("pendingAssignments")}</p>
                  <div className="space-y-2">
                    {stats.homework.pending_list.slice(0, 5).map((hw, idx) => {
                      const isOverdue = new Date(hw.due_date) < new Date();
                      return (
                        <div key={idx} className={`p-2 border rounded ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{hw.title}</p>
                              <p className="text-xs text-muted-foreground">{hw.subject}</p>
                            </div>
                            <div className="text-right">
                              {isOverdue && (
                                <span className="text-xs text-red-600 font-medium">{t("overdue")}</span>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {t("due")}: {format(new Date(hw.due_date), "MMM dd")}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {stats.notes_count > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("notes")} ({stats.notes_count})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recent_notes.map((note, idx) => (
                    <div key={idx} className="border-b pb-3 last:border-0 last:pb-0">
                      <p className="text-sm mb-1">{note.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{note.teacher}</span>
                        <span>{format(new Date(note.date), "MMM dd, yyyy")}</span>
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
