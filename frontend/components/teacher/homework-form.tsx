"use client";

import { useEffect, useMemo, useState } from "react";
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
import { createHomework, updateHomework } from "@/lib/actions/teacher";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { HomeworkAttachmentUpload } from "@/components/teacher/homework-attachment-upload";

interface HomeworkFormProps {
  subjects: any[];
  homework?: any;
  mode: "create" | "edit";
}

export function HomeworkForm({ subjects, homework, mode }: HomeworkFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>(homework?.attachments || []);

  const [formData, setFormData] = useState({
    title: homework?.title || "",
    description: homework?.description || "",
    subject_id: homework?.subject_id || "",
    class_id: homework?.class_id || "",
    due_date: homework?.due_date
      ? new Date(homework.due_date).toISOString().slice(0, 16)
      : "",
    is_published: homework?.is_published ?? true,
  });

  const classOptions = useMemo(() => {
    const classMap = new Map<
      string,
      {
        id: string;
        name?: string;
        grade_level?: string;
        section?: string;
        subjects: Array<{ id: string; name: string; name_ar?: string | null }>;
      }
    >();

    subjects.forEach((subject: any) => {
      if (!subject.class_id) return;

      const existing = classMap.get(subject.class_id);
      if (existing) {
        existing.subjects.push({
          id: subject.id,
          name: subject.name,
          name_ar: subject.name_ar,
        });
        return;
      }

      classMap.set(subject.class_id, {
        id: subject.class_id,
        name: subject.classes?.name,
        grade_level: subject.classes?.grade_level,
        section: subject.classes?.section,
        subjects: [
          {
            id: subject.id,
            name: subject.name,
            name_ar: subject.name_ar,
          },
        ],
      });
    });

    return Array.from(classMap.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [subjects]);

  const selectedClassSubjects = useMemo(() => {
    if (!formData.class_id) return [];

    return (
      classOptions.find((cls) => cls.id === formData.class_id)?.subjects || []
    );
  }, [classOptions, formData.class_id]);

  useEffect(() => {
    if (selectedClassSubjects.length === 1) {
      const [onlySubject] = selectedClassSubjects;
      if (formData.subject_id !== onlySubject.id) {
        setFormData((prev) => ({
          ...prev,
          subject_id: onlySubject.id,
        }));
      }
      return;
    }

    if (
      selectedClassSubjects.length > 1 &&
      formData.subject_id &&
      !selectedClassSubjects.some((subject) => subject.id === formData.subject_id)
    ) {
      setFormData((prev) => ({
        ...prev,
        subject_id: "",
      }));
    }

    if (selectedClassSubjects.length === 0 && formData.subject_id) {
      setFormData((prev) => ({
        ...prev,
        subject_id: "",
      }));
    }
  }, [selectedClassSubjects, formData.subject_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.title || !formData.description || !formData.subject_id || !formData.class_id || !formData.due_date) {
        throw new Error(t("teacher.homework.fillRequired"));
      }

      if (mode === "create") {
        await createHomework({
          ...formData,
          due_date: new Date(formData.due_date).toISOString(),
        });
      } else {
        await updateHomework(homework.id, {
          ...formData,
          due_date: new Date(formData.due_date).toISOString(),
        });
      }

      router.push("/teacher/homework");
      router.refresh();
    } catch (err: any) {
      setError(err.message || t("common.error"));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? t("teacher.homework.createNew") : t("teacher.homework.editHomework")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">{t("teacher.homework.titleLabel")} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder={t("teacher.homework.titlePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">{t("teacher.homework.classLabel")} *</Label>
              <Select
                value={formData.class_id}
                onValueChange={(value) =>
                  setFormData((prev) => {
                    const classSubjects =
                      classOptions.find((cls) => cls.id === value)?.subjects || [];

                    return {
                      ...prev,
                      class_id: value,
                      subject_id:
                        classSubjects.length === 1 ? classSubjects[0].id : "",
                    };
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("teacher.homework.selectClass")} />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((cls) => {
                    const sectionLabel = cls.section ? ` (${cls.section})` : "";
                    const gradeLabel = cls.grade_level
                      ? ` - ${cls.grade_level}`
                      : "";

                    return (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                        {gradeLabel}
                        {sectionLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t("teacher.homework.subjectLabel")} *</Label>
              {!formData.class_id ? (
                <p className="text-sm text-muted-foreground">
                  {t("teacher.homework.selectClassFirst")}
                </p>
              ) : selectedClassSubjects.length === 0 ? (
                <p className="text-sm text-destructive">
                  {t("teacher.homework.noSubjectForClass")}
                </p>
              ) : selectedClassSubjects.length === 1 ? (
                <div className="rounded-md border border-border bg-muted/60 px-3 py-2 text-sm font-medium">
                  {t("teacher.homework.autoAssignedSubject")}:{" "}
                  {selectedClassSubjects[0].name}
                </div>
              ) : (
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subject_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("teacher.homework.selectSubject")} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedClassSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("teacher.homework.descriptionLabel")} *</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("teacher.homework.descriptionPlaceholder")}
                className="w-full min-h-[120px] px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">{t("teacher.homework.dueDateLabel")} *</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) =>
                  setFormData({ ...formData, is_published: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="is_published" className="cursor-pointer">
                {t("teacher.homework.publishImmediately")}
              </Label>
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
                {isSubmitting
                  ? t("common.saving")
                  : mode === "create"
                  ? t("teacher.homework.createHomework")
                  : t("teacher.homework.updateHomework")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* File Attachments Section */}
      <div>
        <HomeworkAttachmentUpload
          existingAttachments={attachments}
          onAttachmentsChange={setAttachments}
          maxFiles={5}
        />
      </div>
    </div>
  );
}

