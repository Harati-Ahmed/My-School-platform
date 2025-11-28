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
import { createStudent, updateStudent } from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { useRouter } from "next/navigation";

/**
 * Student Form Dialog for creating/editing students
 */

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  student_id_number: z.string().optional(),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"]),
  class_id: z.string().optional(),
  parent_id: z.string().optional(),
  medical_info: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: any;
  mode: "create" | "edit";
  classes: Array<{ id: string; name: string; grade_level: string }>;
  parents: Array<{ id: string; name: string }>;
  onSuccess?: (student: any) => void;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  mode,
  classes,
  parents,
  onSuccess,
}: StudentFormDialogProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>("male");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      student_id_number: "",
      date_of_birth: "",
      gender: "male",
      class_id: "",
      parent_id: "",
      medical_info: "",
    },
  });

  // Reset form when student or dialog opens/closes
  useEffect(() => {
    if (open) {
      if (student && mode === "edit") {
        const dob = student.date_of_birth || "";
        setDateOfBirth(dob);
        setSelectedGender(student.gender || "male");
        setSelectedClass(student.class_id || "");
        setSelectedParent(student.parent_id || "");
        reset({
          name: student.name || "",
          student_id_number: student.student_id_number || "",
          date_of_birth: dob,
          gender: (student.gender as "male" | "female") || "male",
          class_id: student.class_id || "",
          parent_id: student.parent_id || "",
          medical_info: student.medical_info || "",
        });
      } else {
        setDateOfBirth("");
        setSelectedGender("male");
        setSelectedClass("");
        setSelectedParent("");
        reset({
          name: "",
          student_id_number: "",
          date_of_birth: "",
          gender: "male",
          class_id: "",
          parent_id: "",
          medical_info: "",
        });
      }
    }
  }, [open, student, mode, reset]);

  useEffect(() => {
    setValue("gender", selectedGender as "male" | "female");
  }, [selectedGender, setValue]);

  useEffect(() => {
    setValue("class_id", selectedClass === "none" ? "" : selectedClass);
  }, [selectedClass, setValue]);

  useEffect(() => {
    setValue("parent_id", selectedParent === "none" ? "" : selectedParent);
  }, [selectedParent, setValue]);

  useEffect(() => {
    setValue("date_of_birth", dateOfBirth);
  }, [dateOfBirth, setValue]);

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);

    try {
      let result;

      if (mode === "create") {
        result = await createStudent(data as any);
        if (result.error) throw result.error;
        
        // Optimistic update callback
        if (result.data && onSuccess) {
          onSuccess(result.data);
        }
        
        toast.success(tAdmin("createdSuccessfully"));
      } else if (student) {
        result = await updateStudent(student.id, data as any);
        if (result.error) throw result.error;
        
        // Optimistic update callback
        if (result.data && onSuccess) {
          onSuccess(result.data);
        }
        
        toast.success(tAdmin("updatedSuccessfully"));
      }

      reset({
        name: "",
        student_id_number: "",
        date_of_birth: "",
        gender: "male",
        class_id: "",
        parent_id: "",
        medical_info: "",
      });
      setDateOfBirth("");
      setSelectedGender("male");
      setSelectedClass("");
      setSelectedParent("");
      onOpenChange(false);
      router.refresh(); // Sync with server
    } catch (error: any) {
      console.error("Error saving student:", error);
      const errorMessage = error?.message || error || tAdmin("failedToSave");
      const contextMessage = mode === "create"
        ? `Failed to create student. ${errorMessage}`
        : `Failed to update student. ${errorMessage}`;
      toast.error(contextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? tAdmin("addStudent") : tAdmin("editStudent")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? tAdmin("fillInDetails")
              : tAdmin("updateInformation")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">{t("name")} *</Label>
              <Input
                id="name"
                placeholder={tAdmin("studentNamePlaceholder")}
                {...register("name")}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_id_number">{tAdmin("studentId")}</Label>
              <Input
                id="student_id_number"
                placeholder={t("optional")}
                {...register("student_id_number")}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">{tAdmin("dateOfBirth")} *</Label>
              <DatePicker
                value={dateOfBirth}
                onChange={(date) => setDateOfBirth(date)}
                placeholder={tAdmin("dateOfBirth")}
                disabled={isSubmitting}
                maxDate={new Date()}
              />
              <input
                type="hidden"
                {...register("date_of_birth")}
                value={dateOfBirth}
              />
              {errors.date_of_birth && (
                <p className="text-sm text-destructive">
                  {errors.date_of_birth.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">{tAdmin("gender")} *</Label>
              <Select
                value={selectedGender}
                onValueChange={setSelectedGender}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tAdmin("gender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class_id">{tAdmin("class")}</Label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tAdmin("class")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tAdmin("noClass")}</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.grade_level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="parent_id">{tAdmin("parent")}</Label>
              <Select
                value={selectedParent}
                onValueChange={setSelectedParent}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tAdmin("parent")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tAdmin("noParent")}</SelectItem>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="medical_info">{tAdmin("medicalInformation")}</Label>
              <Input
                id="medical_info"
                placeholder={tAdmin("medicalInfoPlaceholder")}
                {...register("medical_info")}
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

