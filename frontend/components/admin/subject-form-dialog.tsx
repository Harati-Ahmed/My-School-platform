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
import { createSubject, updateSubject, getAllSchools } from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const subjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  name_ar: z.string().min(2, "Arabic name must be at least 2 characters"),
  code: z.string().optional(),
  class_id: z.string().optional(), // Optional - NULL for global subjects
  teacher_id: z.string().optional(),
  max_grade: z.number().min(1).optional(),
  school_id: z.string().nullable().optional(), // NULL for global subjects
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: any;
  mode: "create" | "edit";
  classes?: Array<{ id: string; name: string; grade_level: string }>;
  teachers?: Array<{ id: string; name: string }>;
  schools?: Array<{ id: string; name: string; name_ar?: string }>;
  onSuccess?: (subject: any) => void;
}

export function SubjectFormDialog({
  open,
  onOpenChange,
  subject,
  mode,
  classes,
  teachers,
  schools: initialSchools,
  onSuccess,
}: SubjectFormDialogProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGlobal, setIsGlobal] = useState<boolean>(
    subject ? subject.school_id === null : false // Default to school-specific for new subjects
  );
  const [schools, setSchools] = useState(initialSchools || []);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: subject
      ? {
          name: subject.name,
          name_ar: subject.name_ar,
          code: subject.code || "",
          class_id: subject.class_id || "",
          teacher_id: subject.teacher_id || "",
          max_grade: subject.max_grade || 100,
          school_id: subject.school_id,
        }
      : {
          max_grade: 100,
        },
  });

  // Fetch schools if not provided and check if super admin
  useEffect(() => {
    if (open && !initialSchools) {
      getAllSchools().then(({ data }) => {
        if (data) {
          const mappedSchools = data
            .filter((school) => school?.name && school?.id)
            .map((school) => ({
              id: school.id,
              name: school.name || '',
              name_ar: school.name_ar || undefined,
            }));
          setSchools(mappedSchools);
          // Super admin sees all schools (more than 1), regular admin sees only their school (1)
          setIsSuperAdmin(mappedSchools.length > 1);
        }
      });
    } else if (initialSchools) {
      setSchools(initialSchools);
      // Super admin sees all schools (more than 1), regular admin sees only their school (1)
      setIsSuperAdmin(initialSchools.length > 1);
    }
  }, [open, initialSchools]);

  // Reset form and state when dialog opens/closes or subject changes
  useEffect(() => {
    if (open) {
      if (subject && mode === "edit") {
        setIsGlobal(subject.school_id === null);
        reset({
          name: subject.name,
          name_ar: subject.name_ar,
          code: subject.code || "",
          class_id: subject.class_id || "",
          teacher_id: subject.teacher_id || "",
          max_grade: subject.max_grade || 100,
          school_id: subject.school_id,
        });
      } else {
        // Reset for new subject
        // Regular admins always create school-specific subjects, super admins default to school-specific
        setIsGlobal(false);
        reset({
          name: "",
          name_ar: "",
          code: "",
          class_id: "",
          teacher_id: "",
          max_grade: 100,
          school_id: schools.length > 0 ? schools[0].id : undefined,
        });
      }
    }
  }, [open, subject, mode, reset, schools, isSuperAdmin]);


  const onSubmit = async (data: SubjectFormData) => {
    setIsSubmitting(true);

    try {
      let result;
      
      // Prepare form data
      // Regular admins can only create school-specific subjects (isGlobal is always false for them)
      // Super admins can create global or school-specific subjects
      const formData: any = {
        name: data.name,
        name_ar: data.name_ar,
        code: data.code || undefined,
        max_grade: data.max_grade ? Number(data.max_grade) : 100,
        school_id: (isSuperAdmin && isGlobal)
          ? null 
          : (schools.length > 0 ? schools[0].id : undefined), // null for global (super admin only), admin's school for school-specific
      };

      // Remove undefined values
      Object.keys(formData).forEach(key => {
        if (formData[key] === undefined) {
          delete formData[key];
        }
      });

      if (mode === "create") {
        result = await createSubject(formData);
        if (result.error) {
          console.error("Create subject error:", result.error);
          throw new Error(result.error);
        }
        
        // Optimistic update callback
        if (result.data && onSuccess) {
          onSuccess(result.data);
        }
        
        toast.success(tAdmin("createdSuccessfully"));
      } else if (subject) {
        result = await updateSubject(subject.id, formData);
        if (result.error) {
          console.error("Update subject error:", result.error);
          throw new Error(result.error);
        }
        
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
      console.error("Error saving subject:", error);
      const errorMessage = error?.message || error || tAdmin("failedToSave");
      const contextMessage = mode === "create"
        ? `Failed to create subject. ${errorMessage}`
        : `Failed to update subject. ${errorMessage}`;
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
            {mode === "create" ? tAdmin("addSubject") : tAdmin("editSubject")}
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
              <Label htmlFor="name">{tAdmin("subjectNameEnglish")} *</Label>
              <Input
                id="name"
                placeholder={tAdmin("subjectNamePlaceholder")}
                {...register("name")}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_ar">{tAdmin("subjectNameArabic")} *</Label>
              <Input
                id="name_ar"
                placeholder={tAdmin("subjectNameArabicPlaceholder")}
                {...register("name_ar")}
                disabled={isSubmitting}
                dir="rtl"
              />
              {errors.name_ar && (
                <p className="text-sm text-destructive">{errors.name_ar.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">{tAdmin("subjectCode")}</Label>
              <Input
                id="code"
                placeholder={tAdmin("subjectCodePlaceholder")}
                {...register("code")}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_grade">{tAdmin("maxGrade")}</Label>
              <Input
                id="max_grade"
                type="number"
                placeholder="100"
                {...register("max_grade")}
                disabled={isSubmitting}
              />
            </div>

            {/* Only show subject type selector for super admins */}
            {isSuperAdmin && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="is_global">{tAdmin("subjectType")}</Label>
                <Select
                  value={isGlobal ? "global" : "school"}
                  onValueChange={(value) => {
                    setIsGlobal(value === "global");
                  }}
                  disabled={isSubmitting || mode === "edit"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">{tAdmin("globalSubject")}</SelectItem>
                    <SelectItem value="school">{tAdmin("schoolSpecificSubject")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {isGlobal 
                    ? tAdmin("globalSubjectDescription")
                    : tAdmin("schoolSpecificSubjectDescription")}
                </p>
              </div>
            )}

            {/* Show school info for school-specific subjects (or always for regular admins) */}
            {(!isGlobal || !isSuperAdmin) && schools.length > 0 && (
              <div className="space-y-2 col-span-2">
                <Label>{tAdmin("school")}</Label>
                <p className="text-sm text-muted-foreground">
                  {schools[0].name} {schools[0].name_ar && `(${schools[0].name_ar})`}
                </p>
                <input type="hidden" {...register("school_id")} value={schools[0].id} />
              </div>
            )}

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

