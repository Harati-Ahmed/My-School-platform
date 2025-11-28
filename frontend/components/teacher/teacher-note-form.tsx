"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTeacherNote } from "@/lib/actions/teacher";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface TeacherNoteFormProps {
  students: any[];
  initialStudentId?: string;
}

type NoteType = "positive" | "concern" | "general" | "behavioral";

export function TeacherNoteForm({ students, initialStudentId = "" }: TeacherNoteFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    student_id: initialStudentId,
    content: "",
    note_type: "general" as NoteType,
  });

  // When initialStudentId is provided, find the student and pre-select it
  useEffect(() => {
    if (initialStudentId) {
      if (students.length > 0) {
        const selectedStudent = students.find((s: any) => s.id === initialStudentId);
        if (selectedStudent) {
          setFormData((prev) => {
            if (prev.student_id !== initialStudentId) {
              return { ...prev, student_id: initialStudentId };
            }
            return prev;
          });
        }
      } else {
        // If students array is empty but we have initialStudentId, set it anyway
        setFormData((prev) => {
          if (prev.student_id !== initialStudentId) {
            return { ...prev, student_id: initialStudentId };
          }
          return prev;
        });
      }
    }
  }, [initialStudentId, students]);

  // Filter students based on search term (only when no initial student is selected)
  const filteredStudents = students.filter((student: any) => {
    // Always include the selected student (from formData or initialStudentId)
    const currentSelectedId = formData.student_id || initialStudentId;
    if (currentSelectedId && student.id === currentSelectedId) {
      return true;
    }
    // If no search term, show all students
    if (!searchTerm) {
      return true;
    }
    // Filter by search term
    return (
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get the selected student's display name (check both formData and initialStudentId)
  const selectedStudentId = formData.student_id || initialStudentId;
  const selectedStudent = students.find((s: any) => s.id === selectedStudentId);
  const hasPreSelectedStudent = !!initialStudentId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.student_id || !formData.content) {
        throw new Error(t("teacher.notes.fillRequired"));
      }

      await createTeacherNote(formData);
      router.push("/teacher/notes");
      router.refresh();
    } catch (err: any) {
      setError(err.message || t("common.error"));
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("teacher.notes.noteDetails")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="student">{t("teacher.notes.student")} *</Label>
            {hasPreSelectedStudent && selectedStudent ? (
              // When student is pre-selected and found, show a read-only display
              <div className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{selectedStudent.name}</div>
                  {selectedStudent.classes?.name && (
                    <div className="text-xs text-muted-foreground">
                      {selectedStudent.classes.name}
                      {selectedStudent.student_id_number && ` • ID: ${selectedStudent.student_id_number}`}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // When no pre-selected student found or no initial student, show search and select
              <div className="space-y-2">
                {!hasPreSelectedStudent && (
                  <Input
                    placeholder={t("teacher.notes.searchStudents")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                )}
                <Select
                  value={formData.student_id || initialStudentId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, student_id: value });
                    setSearchTerm("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("teacher.notes.selectStudent")} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student: any) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} - {student.classes?.name || "N/A"} (ID: {student.student_id_number || "N/A"})
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {t("teacher.notes.noStudentsFound")}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note_type">{t("teacher.notes.noteType")} *</Label>
            <Select
              value={formData.note_type}
              onValueChange={(value: NoteType) =>
                setFormData({ ...formData, note_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">{t("teacher.notes.positive")}</SelectItem>
                <SelectItem value="concern">{t("teacher.notes.concern")}</SelectItem>
                <SelectItem value="behavioral">{t("teacher.notes.behavioral")}</SelectItem>
                <SelectItem value="general">{t("teacher.notes.general")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t("teacher.notes.note")} *</Label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder={t("teacher.notes.notePlaceholder")}
              className="w-full min-h-[150px] px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("teacher.notes.saveNote")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

