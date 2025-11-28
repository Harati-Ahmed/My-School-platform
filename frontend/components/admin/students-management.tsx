"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { StudentFormDialog } from "./student-form-dialog";
import { BulkImportDialog } from "./bulk-import-dialog";
import { StudentQuickView } from "./student-quick-view";
import { getStudentQuickViewStats } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Upload, Download, Eye } from "lucide-react";
import { deleteStudent } from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { format } from "date-fns";

/**
 * Students Management Component
 * Client component for managing students with CRUD and bulk import
 */

interface Student {
  id: string;
  name: string;
  student_id_number?: string;
  date_of_birth: string;
  gender: "male" | "female";
  class_id?: string;
  parent_id?: string;
  is_active: boolean;
  class?: { id: string; name: string; grade_level: string };
  parent?: { id: string; name: string; email: string };
}

interface Class {
  id: string;
  name: string;
  grade_level: string;
}

interface Parent {
  id: string;
  name: string;
}

interface StudentsManagementProps {
  initialStudents: Student[];
  classes: Class[];
  parents: Parent[];
}

export function StudentsManagement({
  initialStudents,
  classes,
  parents,
}: StudentsManagementProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const [students, setStudents] = useState(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewStudentId, setQuickViewStudentId] = useState<string | null>(null);
  const [quickViewStats, setQuickViewStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const handleCreate = () => {
    setSelectedStudent(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`${t("confirmDeactivate")} ${student.name}?`)) {
      return;
    }

    const result = await deleteStudent(student.id, student.name);

    if (result.error) {
      const errorMessage = result.error || tAdmin("failedToDelete");
      toast.error(`Failed to deactivate ${student.name}. ${errorMessage}`);
      return;
    }

    toast.success(tAdmin("deactivatedSuccessfully"));
    setStudents(students.filter((s) => s.id !== student.id));
  };

  const handleStudentSuccess = (updatedStudent: Student) => {
    if (dialogMode === "create") {
      // Optimistically add new student
      setStudents([updatedStudent, ...students]);
    } else if (selectedStudent) {
      // Optimistically update existing student
      setStudents(students.map((s) => 
        s.id === selectedStudent.id ? updatedStudent : s
      ));
    }
  };

  const handleQuickView = async (student: Student) => {
    setQuickViewStudentId(student.id);
    setQuickViewOpen(true);
    setIsLoadingStats(true);
    try {
      const stats = await getStudentQuickViewStats(student.id);
      setQuickViewStats(stats);
    } catch (error) {
      toast.error("Failed to load student stats");
      console.error(error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      t("name"),
      tAdmin("studentId"),
      tAdmin("dateOfBirth"),
      tAdmin("gender"),
      tAdmin("class"),
      tAdmin("parent"),
    ];
    
    const rows = students.map((student) => [
      student.name,
      student.student_id_number || "",
      student.date_of_birth,
      student.gender,
      student.class?.name || "",
      student.parent?.name || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(tAdmin("studentsExported"));
  };

  const columns = [
    {
      key: "name",
      label: t("name"),
      render: (student: Student) => (
        <div>
          <p className="font-medium">{student.name}</p>
          {student.student_id_number && (
            <p className="text-xs text-muted-foreground">
              ID: {student.student_id_number}
            </p>
          )}
          {!student.is_active && (
            <span className="text-xs text-destructive">(Inactive)</span>
          )}
        </div>
      ),
    },
    {
      key: "date_of_birth",
      label: tAdmin("dateOfBirth"),
      render: (student: Student) =>
        format(new Date(student.date_of_birth), "MMM dd, yyyy"),
    },
    {
      key: "gender",
      label: tAdmin("gender"),
      render: (student: Student) =>
        student.gender.charAt(0).toUpperCase() + student.gender.slice(1),
    },
    {
      key: "class",
      label: tAdmin("class"),
      render: (student: Student) =>
        student.class ? (
          <div>
            <p className="font-medium">{student.class.name}</p>
            <p className="text-xs text-muted-foreground">
              {student.class.grade_level}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "parent",
      label: tAdmin("parent"),
      render: (student: Student) =>
        student.parent?.name || (
          <span className="text-muted-foreground">-</span>
        ),
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            {tAdmin("exportStudentsCSV")}
          </Button>
          <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            {tAdmin("bulkImport")}
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {tAdmin("addStudent")}
          </Button>
        </div>

        <DataTable
          data={students}
          columns={columns}
          searchKeys={["name", "student_id_number"]}
          searchPlaceholder={tAdmin("searchStudents")}
          emptyMessage={tAdmin("noStudents")}
          actions={(student) => (
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickView(student)}
                title="View Stats"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(student)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(student)}
                className="text-destructive hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={selectedStudent}
        mode={dialogMode}
        classes={classes}
        parents={parents}
        onSuccess={handleStudentSuccess}
      />

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
      />

      <StudentQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        stats={quickViewStats}
        isLoading={isLoadingStats}
      />
    </>
  );
}

