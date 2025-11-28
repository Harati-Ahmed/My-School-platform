"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { UserFormDialog } from "./user-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Users, Loader2, Save } from "lucide-react";
import { deleteUser, getTeacherQuickViewStats, batchUpdateTeacherAssignments, getTeacherSubjectSkills, getTeacherGradeLevels, getTeacherAllowedClasses } from "@/lib/actions/admin";
import { TeacherQuickView } from "./teacher-quick-view";
import { TeacherAssignmentsDialog, TeacherDraftState } from "./teacher-assignments-dialog";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { teacherDataCache, CACHE_KEYS } from "@/lib/cache/teacher-data-cache";
import { useRouter } from "next/navigation";

/**
 * Teachers Management Component
 * Client component for managing teachers with CRUD operations
 */

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "teacher";
  is_active: boolean;
  created_at: string;
  last_login?: string;
  subjects?: SubjectSummary[];
  grade_levels?: string[];
}

interface SubjectSummary {
  id: string;
  name: string;
  name_ar?: string;
  code?: string | null;
}

interface TeachersManagementProps {
  initialTeachers: Teacher[];
  availableSubjects?: SubjectSummary[];
  availableGradeLevels?: string[];
}

export function TeachersManagement({
  initialTeachers,
  availableSubjects = [],
  availableGradeLevels = [],
}: TeachersManagementProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const tAssignments = useTranslations("admin.teachers.assignments");
  const router = useRouter();
  const [teachers, setTeachers] = useState(initialTeachers);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewStats, setQuickViewStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [assignmentsDialogOpen, setAssignmentsDialogOpen] = useState(false);
  const [selectedTeacherForAssignments, setSelectedTeacherForAssignments] = useState<Teacher | undefined>();
  
  // Draft state management for multiple teachers
  const [teacherDrafts, setTeacherDrafts] = useState<Record<string, TeacherDraftState>>({});
  const [teacherInitialStates, setTeacherInitialStates] = useState<Record<string, TeacherDraftState>>({});
  const [isPublishingAll, setIsPublishingAll] = useState(false);

  useEffect(() => {
    setTeachers(initialTeachers);
  }, [initialTeachers]);

  const handleCreate = () => {
    setSelectedTeacher(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!confirm(`${t("confirmDeactivate")} ${teacher.name}?`)) {
      return;
    }

    const result = await deleteUser(teacher.id, teacher.name);

    if (result.error) {
      toast.error(tAdmin("failedToDelete"));
      return;
    }

    toast.success(tAdmin("deactivatedSuccessfully"));
    setTeachers(teachers.filter((t) => t.id !== teacher.id));
  };

  const handleQuickView = async (teacher: Teacher) => {
    setQuickViewOpen(true);
    setIsLoadingStats(true);
    try {
      const stats = await getTeacherQuickViewStats(teacher.id);
      setQuickViewStats(stats);
    } catch (error) {
      toast.error("Failed to load teacher stats");
      console.error(error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleManageAssignments = async (teacher: Teacher) => {
    setSelectedTeacherForAssignments(teacher);
    
    // Load initial state if not already loaded
    if (!teacherInitialStates[teacher.id]) {
      try {
        const subjectsCacheKey = CACHE_KEYS.TEACHER_SUBJECTS(teacher.id);
        const gradesCacheKey = CACHE_KEYS.TEACHER_GRADE_LEVELS(teacher.id);
        const classesCacheKey = CACHE_KEYS.TEACHER_CLASSES(teacher.id);

        const [subjectsResult, gradesResult, allowedClassesResult] = await Promise.all([
          getTeacherSubjectSkills(teacher.id),
          getTeacherGradeLevels(teacher.id),
          getTeacherAllowedClasses(teacher.id),
        ]);

        const subjectIds =
          subjectsResult.data?.map((s) => s.subject_id).filter(Boolean) ?? [];
        const gradeLevels = gradesResult.data || [];
        const classesByGrade: Record<string, string[]> = {};

        (allowedClassesResult.data || []).forEach((assignment) => {
          const grade = assignment.class?.grade_level;
          if (!grade || !assignment.class_id) return;
          if (!classesByGrade[grade]) {
            classesByGrade[grade] = [];
          }
          if (!classesByGrade[grade].includes(assignment.class_id)) {
            classesByGrade[grade].push(assignment.class_id);
          }
        });

        teacherDataCache.set(subjectsCacheKey, subjectIds);
        teacherDataCache.set(gradesCacheKey, gradeLevels);
        teacherDataCache.set(classesCacheKey, classesByGrade);

        const initialState: TeacherDraftState = {
          subjects: subjectIds,
          gradeLevels: gradeLevels,
          classes: classesByGrade,
        };

        setTeacherInitialStates((prev) => ({
          ...prev,
          [teacher.id]: initialState,
        }));
        setTeacherDrafts((prev) => ({
          ...prev,
          [teacher.id]: initialState,
        }));
        
        // Open dialog after data is loaded
        setAssignmentsDialogOpen(true);
      } catch (error) {
        console.error("Failed to load teacher initial state:", error);
        toast.error("Failed to load teacher data");
        return;
      }
    } else {
      // Data already loaded, open dialog immediately
      setAssignmentsDialogOpen(true);
    }
  };

  const handleDraftChange = (teacherId: string) => {
    return (draft: TeacherDraftState | ((prev: TeacherDraftState) => TeacherDraftState)) => {
      setTeacherDrafts((prev) => {
        const currentDraft = prev[teacherId] || { subjects: [], gradeLevels: [], classes: {} };
        const newDraft = typeof draft === 'function' ? draft(currentDraft) : draft;
        return {
          ...prev,
          [teacherId]: newDraft,
        };
      });
    };
  };

  const getTeachersWithDrafts = useMemo(() => {
    return Object.keys(teacherDrafts).filter((teacherId) => {
      const draft = teacherDrafts[teacherId];
      const initial = teacherInitialStates[teacherId];
      if (!initial) return false;

      // Check if there are any changes
      const subjectsChanged = JSON.stringify(draft.subjects.sort()) !== JSON.stringify(initial.subjects.sort());
      const gradesChanged = JSON.stringify(draft.gradeLevels.sort()) !== JSON.stringify(initial.gradeLevels.sort());
      const classesChanged = JSON.stringify(draft.classes) !== JSON.stringify(initial.classes);

      return subjectsChanged || gradesChanged || classesChanged;
    });
  }, [teacherDrafts, teacherInitialStates]);

  const handlePublishAll = async () => {
    if (getTeachersWithDrafts.length === 0) {
      toast.error("No pending changes to publish");
      return;
    }

    setIsPublishingAll(true);
    try {
    const updates = getTeachersWithDrafts.map((teacherId) => ({
      teacherId,
      subjects: teacherDrafts[teacherId].subjects,
      gradeLevels: teacherDrafts[teacherId].gradeLevels,
      classes: teacherDrafts[teacherId].classes,
    }));

      const result = await batchUpdateTeacherAssignments(updates);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Update initial states to match drafts (now saved)
      const newInitialStates = { ...teacherInitialStates };
      getTeachersWithDrafts.forEach((teacherId) => {
        newInitialStates[teacherId] = teacherDrafts[teacherId];
        // Invalidate cache for this teacher
        teacherDataCache.invalidate(CACHE_KEYS.TEACHER_SUBJECTS(teacherId));
        teacherDataCache.invalidate(CACHE_KEYS.TEACHER_GRADE_LEVELS(teacherId));
        teacherDataCache.invalidate(CACHE_KEYS.TEACHER_CLASSES(teacherId));
      });
      setTeacherInitialStates(newInitialStates);

      toast.success(tAssignments("draftsPublishSuccess"));
      
      // Refresh to show updated data
      router.refresh();
    } catch (error) {
      console.error("Failed to publish all changes:", error);
      toast.error("Failed to publish changes");
    } finally {
      setIsPublishingAll(false);
    }
  };

  const handleDiscardAll = () => {
    if (getTeachersWithDrafts.length === 0) {
      toast.error("No pending changes to discard");
      return;
    }

    if (!confirm(`Discard all pending changes for ${getTeachersWithDrafts.length} teacher(s)?`)) {
      return;
    }

    // Reset all drafts to initial states
    const newDrafts = { ...teacherDrafts };
    getTeachersWithDrafts.forEach((teacherId) => {
      newDrafts[teacherId] = teacherInitialStates[teacherId];
    });
    setTeacherDrafts(newDrafts);

    toast.success(tAssignments("draftsDiscardedMessage"));
  };

  const getUniqueSubjects = (subjects?: SubjectSummary[]) =>
    subjects
      ? subjects.filter(
          (subject, index, array) =>
            subject?.id &&
            array.findIndex((item) => item?.id === subject?.id) === index
        )
      : [];

  const columns = [
    {
      key: "name",
      label: t("name"),
      render: (teacher: Teacher) => (
        <div>
          <p className="font-medium">{teacher.name}</p>
          {!teacher.is_active && (
            <span className="text-xs text-destructive">(Inactive)</span>
          )}
        </div>
      ),
    },
    {
      key: "email",
      label: t("email"),
    },
    {
      key: "phone",
      label: t("phone"),
      render: (teacher: Teacher) => teacher.phone || "-",
    },
    {
      key: "subjects",
      label: tAdmin("subjectsColumn"),
      render: (teacher: Teacher) =>
        teacher.subjects && teacher.subjects.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {getUniqueSubjects(teacher.subjects).map((subject, index) => (
              <span
                key={`${subject.id}-${index}`}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {subject.name_ar || subject.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {tAdmin("noSubjectsAssigned")}
          </span>
        ),
    },
    {
      key: "last_login",
      label: tAdmin("lastLogin"),
      render: (teacher: Teacher) =>
        teacher.last_login
          ? formatDistanceToNow(new Date(teacher.last_login), { addSuffix: true })
          : tAdmin("never"),
    },
    {
      key: "created_at",
      label: t("date"),
      render: (teacher: Teacher) =>
        formatDistanceToNow(new Date(teacher.created_at), { addSuffix: true }),
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          {getTeachersWithDrafts.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePublishAll}
                disabled={isPublishingAll}
                className="bg-primary"
              >
                {isPublishingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {tAdmin("publishAllChanges", { count: getTeachersWithDrafts.length })}
              </Button>
              <Button
                variant="outline"
                onClick={handleDiscardAll}
                disabled={isPublishingAll}
              >
                {tAdmin("discardAllChanges")}
              </Button>
            </div>
          )}
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {tAdmin("addTeacher")}
          </Button>
        </div>

        <DataTable
          data={teachers}
          columns={columns}
          searchKeys={["name", "email", "phone"]}
          searchPlaceholder={tAdmin("searchTeachers")}
          emptyMessage={tAdmin("noTeachers")}
          actions={(teacher) => (
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickView(teacher)}
                title="View Stats"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleManageAssignments(teacher)}
                title={tAdmin("manageSubjects")}
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(teacher)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(teacher)}
                className="text-destructive hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedTeacher}
        mode={dialogMode}
        roleType="teacher"
        availableSubjects={availableSubjects}
      />

      <TeacherQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        stats={quickViewStats}
        isLoading={isLoadingStats}
      />

      {selectedTeacherForAssignments && (() => {
        const teacherId = selectedTeacherForAssignments.id;
        const initialState = teacherInitialStates[teacherId] || { subjects: [], gradeLevels: [], classes: {} };
        const currentDraft = teacherDrafts[teacherId];
        // Always use current draft if it exists, otherwise use initial state
        // This ensures we show the latest state
        const draftState = currentDraft || initialState;
        
        return (
          <TeacherAssignmentsDialog
            open={assignmentsDialogOpen}
            onOpenChange={setAssignmentsDialogOpen}
            teacherId={teacherId}
            teacherName={selectedTeacherForAssignments.name}
            availableSubjects={availableSubjects}
            availableGradeLevels={availableGradeLevels}
            draftState={draftState}
            onDraftChange={handleDraftChange(teacherId)}
            initialState={initialState}
          />
        );
      })()}
    </>
  );
}

