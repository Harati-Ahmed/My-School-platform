"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { ClassFormDialog } from "./class-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Users, Eye } from "lucide-react";
import { deleteClass, getClassQuickViewStats } from "@/lib/actions/admin";
import { ClassQuickView } from "./class-quick-view";
import toast from "react-hot-toast";

/**
 * Classes Management Component
 */

interface Class {
  id: string;
  name: string;
  grade_level: string;
  section?: string;
  academic_year: string;
  main_teacher_id?: string;
  max_capacity: number;
  room_number?: string;
  is_active: boolean;
  main_teacher?: { id: string; name: string };
}

interface Teacher {
  id: string;
  name: string;
}

interface ClassesManagementProps {
  initialClasses: Class[];
  teachers: Teacher[];
}

export function ClassesManagement({
  initialClasses,
  teachers,
}: ClassesManagementProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const [classes, setClasses] = useState(initialClasses);
  const [selectedClass, setSelectedClass] = useState<Class | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewStats, setQuickViewStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const handleCreate = () => {
    setSelectedClass(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (classData: Class) => {
    setSelectedClass(classData);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = async (classData: Class) => {
    if (!confirm(`${t("confirmDeactivate")} ${classData.name}?`)) {
      return;
    }

    const result = await deleteClass(classData.id, classData.name);

    if (result.error) {
      const errorMessage = result.error || tAdmin("failedToDelete");
      toast.error(`Failed to deactivate ${classData.name}. ${errorMessage}`);
      return;
    }

    toast.success(tAdmin("deactivatedSuccessfully"));
    setClasses(classes.filter((c) => c.id !== classData.id));
  };

  const handleClassSuccess = (updatedClass: Class) => {
    if (dialogMode === "create") {
      // Optimistically add new class
      setClasses([...classes, updatedClass]);
    } else if (selectedClass) {
      // Optimistically update existing class
      setClasses(classes.map((c) => 
        c.id === selectedClass.id ? updatedClass : c
      ));
    }
  };

  const handleQuickView = async (classData: Class) => {
    setQuickViewOpen(true);
    setIsLoadingStats(true);
    try {
      const stats = await getClassQuickViewStats(classData.id);
      setQuickViewStats(stats);
    } catch (error) {
      toast.error("Failed to load class stats");
      console.error(error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: tAdmin("className"),
      render: (classData: Class) => (
        <div>
          <p className="font-medium">{classData.name}</p>
          <p className="text-xs text-muted-foreground">
            {classData.academic_year}
          </p>
          {!classData.is_active && (
            <span className="text-xs text-destructive">(Inactive)</span>
          )}
        </div>
      ),
    },
    {
      key: "grade_level",
      label: "الصف",
      render: (classData: Class) => (
        <div>
          <p>{classData.grade_level}</p>
          {classData.section && (
            <p className="text-xs text-muted-foreground">
              Section: {classData.section}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "main_teacher",
      label: tAdmin("mainTeacher"),
      render: (classData: Class) =>
        classData.main_teacher?.name || (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "capacity",
      label: "الطاقة الاستيعابية",
      render: (classData: Class) => {
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {classData.max_capacity || "-"}
            </span>
          </div>
        );
      },
    },
    {
      key: "room_number",
      label: "الغرفة",
      render: (classData: Class) =>
        classData.room_number || <span className="text-muted-foreground">-</span>,
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {tAdmin("addClass")}
          </Button>
        </div>

        <DataTable
          data={classes}
          columns={columns}
          searchKeys={["name", "grade_level", "academic_year"]}
          searchPlaceholder={tAdmin("searchClasses")}
          emptyMessage={tAdmin("noClasses")}
          actions={(classData) => (
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickView(classData)}
                title="View Stats"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(classData)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(classData)}
                className="text-destructive hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      <ClassFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        classData={selectedClass}
        mode={dialogMode}
        teachers={teachers}
        onSuccess={handleClassSuccess}
      />

      <ClassQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        stats={quickViewStats}
        isLoading={isLoadingStats}
      />
    </>
  );
}

