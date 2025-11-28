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
import { createUser, updateUser } from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * User Form Dialog for creating/editing teachers and parents
 */

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["teacher", "parent", "hr"]),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  subjectIds: z.array(z.string()).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: "teacher" | "parent" | "hr";
    subjects?: Array<{
      id: string;
      name: string;
      name_ar?: string;
    }>;
  };
  mode: "create" | "edit";
  roleType: "teacher" | "parent" | "hr";
  availableSubjects?: Array<{
    id: string;
    name: string;
    name_ar?: string;
  }>;
  onSuccess?: (user: { id: string; name: string; email: string; phone?: string; role: string; is_active: boolean; created_at: string; last_login?: string }) => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  mode,
  roleType,
  availableSubjects = [],
  onSuccess,
}: UserFormDialogProps) {
  const t = useTranslations("common");
  const tRoles = useTranslations("roles");
  const tAdmin = useTranslations("admin.shared");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: roleType,
      subjectIds: [],
    },
  });

  // Reset form when user or dialog opens/closes
  useEffect(() => {
    if (open) {
      if (user && mode === "edit") {
        const currentSubjects =
          user.subjects?.map((subject) => subject.id) ?? [];
        reset({
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          subjectIds: currentSubjects,
        });
        setSelectedSubjects(currentSubjects);
      } else {
        reset({
          name: "",
          email: "",
          phone: "",
          role: roleType,
          subjectIds: [],
        });
        setSelectedSubjects([]);
      }
    }
  }, [open, user, mode, roleType, reset]);

  useEffect(() => {
    setValue("subjectIds", selectedSubjects);
  }, [selectedSubjects, setValue]);

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjectId)) {
        return prev.filter((id) => id !== subjectId);
      }
      return [...prev, subjectId];
    });
  };

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);

    try {
      let result;

      if (mode === "create") {
        result = await createUser(data);
        if (result.error) throw result.error;
        
        // Optimistic update callback
        if (result.data && onSuccess) {
          onSuccess({
            id: result.data.id,
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            role: result.data.role,
            is_active: result.data.is_active ?? true,
            created_at: result.data.created_at ?? new Date().toISOString(),
            last_login: result.data.last_login,
          });
        }
        
        toast.success(tAdmin("createdSuccessfully"));
      } else if (user) {
        result = await updateUser(user.id, data);
        if (result.error) throw result.error;
        
        // Optimistic update callback
        if (result.data && onSuccess) {
          onSuccess({
            id: result.data.id,
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            role: result.data.role,
            is_active: result.data.is_active ?? true,
            created_at: result.data.created_at ?? new Date().toISOString(),
            last_login: result.data.last_login,
          });
        }
        
        toast.success(tAdmin("updatedSuccessfully"));
      }

      reset({
        name: "",
        email: "",
        phone: "",
        role: roleType,
        subjectIds: [],
      });
      onOpenChange(false);
      router.refresh(); // Sync with server
    } catch (error: any) {
      console.error("Error saving user:", error);
      const errorMessage = error?.message || error || tAdmin("failedToSave");
      // Provide more context in error message
      const contextMessage = mode === "create" 
        ? `Failed to create ${roleType}. ${errorMessage}`
        : `Failed to update ${roleType}. ${errorMessage}`;
      toast.error(contextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? tAdmin("addNew") : t("edit")}{" "}
            {roleType === "teacher" ? tRoles("teacher") : roleType === "parent" ? tRoles("parent") : tRoles("hr")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `${tAdmin("fillInDetails")} ${roleType === "teacher" ? tRoles("teacher") : roleType === "parent" ? tRoles("parent") : tRoles("hr")}.`
              : tAdmin("updateInformation")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")} *</Label>
            <Input
              id="name"
              placeholder={t("name")}
              {...register("name")}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("email")} *</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("email")}
              {...register("email")}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t("phone")}
              {...register("phone")}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {roleType === "teacher" && (
            <div className="space-y-2">
              <Label>{tAdmin("assignedSubjects")}</Label>
              {availableSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {tAdmin("noSubjectsAvailable")}
                </p>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                  {availableSubjects.map((subject) => (
                    <label
                      key={subject.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-primary"
                        checked={selectedSubjects.includes(subject.id)}
                        onChange={() => toggleSubject(subject.id)}
                        disabled={isSubmitting}
                      />
                      <span className="flex flex-col">
                        <span className="font-medium">{subject.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {subject.name_ar || subject.name}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {tAdmin("assignedSubjectsHelper")}
              </p>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="password">
                {t("password")} *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t("password")}
                {...register("password")}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          )}

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

