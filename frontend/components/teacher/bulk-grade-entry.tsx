"use client";

import { useState } from "react";
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
import { addGradesBulk } from "@/lib/actions/teacher";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface BulkGradeEntryProps {
  students: any[];
  subjectId: string;
  classId: string;
  existingGrades: any[];
}

type ExamType = "quiz" | "midterm" | "final" | "assignment" | "participation";

export function BulkGradeEntry({ students, subjectId, classId, existingGrades }: BulkGradeEntryProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [examInfo, setExamInfo] = useState({
    exam_name: "",
    exam_type: "quiz" as ExamType,
    max_grade: 100,
    date: new Date().toISOString().split('T')[0],
  });

  const [studentGrades, setStudentGrades] = useState<Record<string, {
    grade: string;
    feedback: string;
  }>>({});

  const handleGradeChange = (studentId: string, field: "grade" | "feedback", value: string) => {
    setStudentGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validation
      if (!examInfo.exam_name) {
        throw new Error(t("teacher.grades.enterExamName"));
      }

      // Filter students with grades entered
      const gradesToSubmit = Object.entries(studentGrades)
        .filter(([_, data]) => data.grade && data.grade.trim() !== "")
        .map(([studentId, data]) => ({
          student_id: studentId,
          subject_id: subjectId,
          grade: parseFloat(data.grade),
          max_grade: examInfo.max_grade,
          exam_type: examInfo.exam_type,
          exam_name: examInfo.exam_name,
          feedback: data.feedback || undefined,
          date: examInfo.date,
        }));

      if (gradesToSubmit.length === 0) {
        throw new Error(t("teacher.grades.enterOneGrade"));
      }

      // Validate grades
      for (const grade of gradesToSubmit) {
        if (grade.grade < 0 || grade.grade > examInfo.max_grade) {
          throw new Error(t("teacher.grades.gradeRange", { max: examInfo.max_grade }));
        }
      }

      await addGradesBulk(gradesToSubmit);

      // Reset form
      setStudentGrades({});
      setExamInfo({
        exam_name: "",
        exam_type: "quiz",
        max_grade: 100,
        date: new Date().toISOString().split('T')[0],
      });

      router.refresh();
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Exam Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teacher.grades.examInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam_name">{t("teacher.grades.examName")} *</Label>
                <Input
                  id="exam_name"
                  value={examInfo.exam_name}
                  onChange={(e) =>
                    setExamInfo({ ...examInfo, exam_name: e.target.value })
                  }
                  placeholder={t("teacher.grades.examNamePlaceholder")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam_type">{t("teacher.grades.type")} *</Label>
                <Select
                  value={examInfo.exam_type}
                  onValueChange={(value: ExamType) =>
                    setExamInfo({ ...examInfo, exam_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">{t("teacher.grades.quiz")}</SelectItem>
                    <SelectItem value="midterm">{t("teacher.grades.midterm")}</SelectItem>
                    <SelectItem value="final">{t("teacher.grades.final")}</SelectItem>
                    <SelectItem value="assignment">{t("teacher.grades.assignment")}</SelectItem>
                    <SelectItem value="participation">{t("teacher.grades.participation")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_grade">{t("teacher.grades.maxGrade")} *</Label>
                <Input
                  id="max_grade"
                  type="number"
                  value={examInfo.max_grade}
                  onChange={(e) =>
                    setExamInfo({ ...examInfo, max_grade: parseInt(e.target.value) })
                  }
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t("teacher.grades.date")} *</Label>
                <Input
                  id="date"
                  type="date"
                  value={examInfo.date}
                  onChange={(e) =>
                    setExamInfo({ ...examInfo, date: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Student Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teacher.grades.enterGrades")} ({students.length} {t("teacher.classes.students")})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 pb-2 border-b font-semibold text-sm">
              <div className="col-span-3">{t("teacher.grades.studentName")}</div>
              <div className="col-span-2">{t("teacher.grades.studentId")}</div>
              <div className="col-span-2">{t("teacher.grades.grade")}</div>
              <div className="col-span-1">%</div>
              <div className="col-span-4">{t("teacher.grades.feedback")}</div>
            </div>

            {/* Student Rows */}
            {students.map((student: any) => {
              const gradeValue = studentGrades[student.id]?.grade || "";
              const percentage = gradeValue && examInfo.max_grade
                ? ((parseFloat(gradeValue) / examInfo.max_grade) * 100).toFixed(1)
                : "-";

              return (
                <div key={student.id} className="grid grid-cols-12 gap-4 py-3 border-b items-center">
                  <div className="col-span-3 font-medium">{student.name}</div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {student.student_id_number || "-"}
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="0"
                      value={studentGrades[student.id]?.grade || ""}
                      onChange={(e) => handleGradeChange(student.id, "grade", e.target.value)}
                      min="0"
                      max={examInfo.max_grade}
                      step="0.5"
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-1 text-sm font-semibold">{percentage}%</div>
                  <div className="col-span-4">
                    <Input
                      placeholder={t("teacher.grades.feedbackPlaceholder")}
                      value={studentGrades[student.id]?.feedback || ""}
                      onChange={(e) => handleGradeChange(student.id, "feedback", e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStudentGrades({});
                setError(null);
              }}
              disabled={isSubmitting}
            >
              {t("teacher.grades.clearAll")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !examInfo.exam_name}
            >
              {isSubmitting ? t("common.saving") : t("teacher.grades.saveGrades")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Grades */}
      {existingGrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("teacher.grades.recentGrades")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingGrades.slice(0, 10).map((grade: any) => (
                <div key={grade.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{grade.students?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {grade.exam_name} ({grade.exam_type})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {grade.grade}/{grade.max_grade}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(grade.date), "MMM dd, yyyy")}
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

