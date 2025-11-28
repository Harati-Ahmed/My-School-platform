"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { SubjectFormDialog } from "./subject-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { deleteSubject } from "@/lib/actions/admin";
import toast from "react-hot-toast";

interface Subject {
  id: string;
  name: string;
  name_ar: string;
  code?: string;
  class_id?: string | null;
  teacher_id?: string;
  school_id?: string | null;
  max_grade: number;
  is_active: boolean;
  class?: { id: string; name: string; grade_level: string };
  teacher?: { id: string; name: string };
}

interface SubjectsManagementProps {
  initialSubjects: Subject[];
  classes?: Array<{ id: string; name: string; grade_level: string }>;
  teachers?: Array<{ id: string; name: string }>;
  schools?: Array<{ id: string; name: string; name_ar?: string }>;
}

export function SubjectsManagement({
  initialSubjects,
  classes,
  teachers,
  schools,
}: SubjectsManagementProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const [subjects, setSubjects] = useState(initialSubjects);
  const [selectedSubject, setSelectedSubject] = useState<Subject | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const handleCreate = () => {
    setSelectedSubject(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`${t("confirmDeactivate")} ${subject.name}?`)) {
      return;
    }

    const result = await deleteSubject(subject.id, subject.name);

    if (result.error) {
      const errorMessage = result.error || tAdmin("failedToDelete");
      toast.error(`Failed to deactivate ${subject.name}. ${errorMessage}`);
      return;
    }

    toast.success(tAdmin("deactivatedSuccessfully"));
    setSubjects(subjects.filter((s) => s.id !== subject.id));
  };

  const handleSubjectSuccess = (updatedSubject: Subject) => {
    if (dialogMode === "create") {
      // Optimistically add new subject
      setSubjects([...subjects, updatedSubject]);
    } else if (selectedSubject) {
      // Optimistically update existing subject
      setSubjects(subjects.map((s) => 
        s.id === selectedSubject.id ? updatedSubject : s
      ));
    }
  };

  const columns = [
    {
      key: "name",
      label: t("name"),
      render: (subject: Subject) => (
        <div>
          <p className="font-medium">{subject.name}</p>
          <p className="text-xs text-muted-foreground">{subject.name_ar}</p>
          {!subject.is_active && (
            <span className="text-xs text-destructive">(Inactive)</span>
          )}
        </div>
      ),
    },
    {
      key: "code",
      label: tAdmin("code"),
      render: (subject: Subject) =>
        subject.code || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "type",
      label: "Type",
      render: (subject: Subject) => (
        <div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            subject.school_id === null 
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          }`}>
            {subject.school_id === null ? "Global" : "School-specific"}
          </span>
        </div>
        ),
    },
    {
      key: "max_grade",
      label: tAdmin("maxGrade"),
      render: (subject: Subject) => subject.max_grade,
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {tAdmin("addSubject")}
          </Button>
        </div>

        <DataTable
          data={subjects}
          columns={columns}
          searchKeys={["name", "name_ar", "code"]}
          searchPlaceholder={tAdmin("searchSubjects")}
          emptyMessage={tAdmin("noSubjects")}
          actions={(subject) => (
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(subject)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(subject)}
                className="text-destructive hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      <SubjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subject={selectedSubject}
        mode={dialogMode}
        schools={schools}
        onSuccess={handleSubjectSuccess}
      />
    </>
  );
}

