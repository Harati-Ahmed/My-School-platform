"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { createClass, updateClass } from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Class Form Dialog for creating/editing classes
 */

const classSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  grade_level: z.string().min(1, "Grade level is required"),
  section: z.string().min(1, "Section is required"),
  academic_year: z.string().min(1, "Academic year is required"),
  main_teacher_id: z.string().optional(),
  max_capacity: z.number().min(1).optional(),
  room_number: z.string().optional(),
});

type ClassFormData = z.infer<typeof classSchema>;

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: any;
  mode: "create" | "edit";
  teachers: Array<{ id: string; name: string }>;
  onSuccess?: (classData: any) => void;
}

export function ClassFormDialog({
  open,
  onOpenChange,
  classData,
  mode,
  teachers,
  onSuccess,
}: ClassFormDialogProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>(
    classData?.main_teacher_id || ""
  );
  const [selectedGrade, setSelectedGrade] = useState<string>(
    classData?.grade_level || ""
  );
  const [selectedSection, setSelectedSection] = useState<string>(
    classData?.section || ""
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: classData
      ? {
          name: classData.name,
          grade_level: classData.grade_level,
          section: classData.section || "",
          academic_year: classData.academic_year,
          main_teacher_id: classData.main_teacher_id || "",
          max_capacity: classData.max_capacity || 30,
          room_number: classData.room_number || "",
        }
      : {
          academic_year: new Date().getFullYear().toString(),
          max_capacity: 30,
        },
  });

  const watchedGrade = watch("grade_level");
  const watchedSection = watch("section");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (classData && mode === "edit") {
        // Edit mode - populate with existing data
        setSelectedGrade(classData.grade_level || "");
        setSelectedSection(classData.section || "");
        setSelectedTeacher(classData.main_teacher_id || "");
      } else if (mode === "create") {
        // Create mode - reset to defaults
        setSelectedGrade("");
        setSelectedSection("");
        setSelectedTeacher("");
        reset({
          academic_year: new Date().getFullYear().toString(),
          max_capacity: 30,
          name: "",
          grade_level: "",
          section: "",
        });
      }
    }
  }, [open, classData, mode, reset]);

  // Auto-generate class name when grade or section changes (only in create mode)
  useEffect(() => {
    if (mode === "create" && watchedGrade && watchedSection) {
      const autoName = `${watchedGrade}-${watchedSection}`;
      setValue("name", autoName);
    }
  }, [watchedGrade, watchedSection, mode, setValue]);

  useEffect(() => {
    setValue("main_teacher_id", selectedTeacher === "none" ? "" : selectedTeacher);
  }, [selectedTeacher, setValue]);

  useEffect(() => {
    if (selectedGrade) {
      setValue("grade_level", selectedGrade);
    }
  }, [selectedGrade, setValue]);

  useEffect(() => {
    if (selectedSection) {
      setValue("section", selectedSection);
    }
  }, [selectedSection, setValue]);

  const onSubmit = async (data: ClassFormData) => {
    setIsSubmitting(true);

    try {
      let result;
      
      // Convert max_capacity to number if it's a string
      const formData = {
        ...data,
        max_capacity: data.max_capacity ? Number(data.max_capacity) : undefined,
      };

      if (mode === "create") {
        result = await createClass(formData as any);
        if (result.error) throw result.error;
        
        // Optimistic update callback
        if (result.data && onSuccess) {
          onSuccess(result.data);
        }
        
        toast.success(tAdmin("createdSuccessfully"));
      } else if (classData) {
        result = await updateClass(classData.id, formData as any);
        if (result.error) throw result.error;
        
        // Optimistic update callback
        if (result.data && onSuccess) {
          onSuccess(result.data);
        }
        
        toast.success(tAdmin("updatedSuccessfully"));
      }

      reset();
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error saving class:", error);
      const errorMessage = error?.message || error || tAdmin("failedToSave");
      const contextMessage = mode === "create"
        ? `Failed to create class. ${errorMessage}`
        : `Failed to update class. ${errorMessage}`;
      toast.error(contextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? tAdmin("addClass") : tAdmin("editClass")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? tAdmin("fillInDetails")
              : tAdmin("updateInformation")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade_level">{tAdmin("gradeLevel")} *</Label>
              <Select
                value={selectedGrade}
                onValueChange={setSelectedGrade}
                disabled={isSubmitting || mode === "edit"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tAdmin("selectGradeLevel")} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade_level && (
                <p className="text-sm text-destructive">
                  {errors.grade_level.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">{tAdmin("section")} *</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={isSubmitting || mode === "edit"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tAdmin("selectSection")} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }, (_, i) => i + 1).map((section) => (
                    <SelectItem key={section} value={section.toString()}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.section && (
                <p className="text-sm text-destructive">
                  {errors.section.message}
                </p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">{tAdmin("className")} *</Label>
              <Input
                id="name"
                placeholder={mode === "create" ? tAdmin("classNamePlaceholderAuto") : tAdmin("classNamePlaceholderEdit")}
                {...register("name")}
                disabled={isSubmitting || !!(mode === "create" && watchedGrade && watchedSection)}
                className={mode === "create" && watchedGrade && watchedSection ? "bg-muted" : ""}
              />
              {mode === "create" && watchedGrade && watchedSection && (
                <p className="text-xs text-muted-foreground">
                  {tAdmin("classNameAutoGenerated")}
                </p>
              )}
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="academic_year">{tAdmin("academicYear")} *</Label>
              <Input
                id="academic_year"
                placeholder={tAdmin("academicYearPlaceholder")}
                {...register("academic_year")}
                disabled={isSubmitting}
              />
              {errors.academic_year && (
                <p className="text-sm text-destructive">
                  {errors.academic_year.message}
                </p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="main_teacher_id">{tAdmin("mainTeacher")}</Label>
              <Select
                value={selectedTeacher}
                onValueChange={setSelectedTeacher}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tAdmin("mainTeacher")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tAdmin("noTeacher")}</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_capacity">{tAdmin("maxCapacity")}</Label>
              <Input
                id="max_capacity"
                type="number"
                placeholder={tAdmin("maxCapacityPlaceholder")}
                {...register("max_capacity")}
                disabled={isSubmitting}
              />
              {errors.max_capacity && (
                <p className="text-sm text-destructive">
                  {errors.max_capacity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="room_number">{tAdmin("roomNumber")}</Label>
              <Input
                id="room_number"
                placeholder={tAdmin("roomNumberPlaceholder")}
                {...register("room_number")}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? t("create") : t("update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

