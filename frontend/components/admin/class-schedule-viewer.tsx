"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  upsertClassSchedules,
  getUsersByRole,
  getSubjects,
  getTeacherAssignments,
  type ClassSchedule,
  type TeacherAssignmentWithDetails,
} from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { LIBYA_SCHOOL_WEEK_DAYS } from "@/lib/constants/weekdays";
import { Badge } from "@/components/ui/badge";

interface ClassScheduleViewerProps {
  classId: string;
  classGradeLevel?: string | null;
  academicYear: string;
  periods: Array<{
    id: string;
    period_number: number;
    start_time: string;
    end_time: string;
    name?: string | null;
    is_break?: boolean;
  }>;
  schedule: any[];
  isLoading: boolean;
  onScheduleUpdate: () => void;
}

export function ClassScheduleViewer({
  classId,
  classGradeLevel,
  academicYear,
  periods,
  schedule: initialSchedule,
  isLoading,
  onScheduleUpdate,
}: ClassScheduleViewerProps) {
  const tSchedules = useTranslations("admin.schedules");
  const tScheduleDays = useTranslations("admin.schedules.days");
  const [teacherAssignmentsCache, setTeacherAssignmentsCache] = useState<
    Record<string, TeacherAssignmentWithDetails[]>
  >({});
  const [schedule, setSchedule] = useState<any[]>(initialSchedule);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [periodEditorEntries, setPeriodEditorEntries] = useState<Record<string, {
    teacherId: string;
    subjectId: string;
    roomNumber: string;
    teacherSubjects: Array<{ id: string; name?: string | null; name_ar?: string | null }>;
    showSubjectSelect: boolean;
    autoSubjectLabel: string;
    isLoadingSubjects: boolean;
  }>>({});
  type DraftEntry = {
    key: string;
    data: ClassSchedule;
    status: "create" | "update" | "delete";
    original?: ClassSchedule | null;
  };
  const [draftEntries, setDraftEntries] = useState<Record<string, DraftEntry>>(
    {}
  );

  const filteredTeachers = useMemo(() => {
    if (!classGradeLevel) {
      return teachers;
    }
    return teachers.filter((teacher) => {
      const gradeLevels: string[] = teacher.grade_levels ?? [];
      if (gradeLevels.length === 0) {
        return false;
      }
      return gradeLevels.includes(classGradeLevel);
    });
  }, [teachers, classGradeLevel]);

  useEffect(() => {
    setSchedule(initialSchedule);
    setDraftEntries({});
  }, [initialSchedule]);

  useEffect(() => {
    loadTeachersAndSubjects();
  }, [classId]);

  useEffect(() => {
    // Initialize period editor entries when editing a day
    if (editingDay !== null) {
      const initialEntries: Record<string, any> = {};
      
      periods.forEach((period) => {
        const entry = schedule.find(
          (s) => s.day_of_week === editingDay && s.period_id === period.id && s.is_active
        );
        
        initialEntries[period.id] = {
          teacherId: entry?.teacher_id || "",
          subjectId: entry?.subject_id || "",
          roomNumber: entry?.room_number || "",
          teacherSubjects: [],
          showSubjectSelect: true,
          autoSubjectLabel: "",
          isLoadingSubjects: false,
        };
      });
      
      setPeriodEditorEntries(initialEntries);
      
      // Load teacher subjects for existing entries
      const loadTeacherSubjects = async () => {
        const promises = periods.map(async (period) => {
          const entry = schedule.find(
            (s) => s.day_of_week === editingDay && s.period_id === period.id && s.is_active
          );
          
          if (!entry?.teacher_id) return null;
          
          try {
            const assignments = await fetchTeacherAssignments(entry.teacher_id);
            const classSpecific = assignments.filter(
              (assignment) => assignment.subject && assignment.class_id === classId
            );
            const genericAssignments = assignments.filter(
              (assignment) => assignment.subject && !assignment.class_id
            );
            const relevantAssignments =
              classSpecific.length > 0
                ? [
                    ...classSpecific,
                    ...genericAssignments.filter(
                      (assignment) =>
                        !classSpecific.some(
                          (specific) =>
                            specific.subject?.id === assignment.subject?.id
                        )
                    ),
                  ]
                : genericAssignments;
            const subjectsForTeacher = relevantAssignments
              .map((assignment) => assignment.subject!)
              .filter(
                (subject, index, array) =>
                  subject?.id &&
                  array.findIndex((item) => item?.id === subject.id) === index
              );

            return {
              periodId: period.id,
              subjectsForTeacher,
              entry,
            };
          } catch (error) {
            console.error(error);
            return null;
          }
        });
        
        const results = await Promise.all(promises);
        
        setPeriodEditorEntries((prev) => {
          const updated = { ...prev };
          results.forEach((result) => {
            if (result) {
              const singleSubject = result.subjectsForTeacher.length === 1 ? result.subjectsForTeacher[0] : null;
              updated[result.periodId] = {
                ...prev[result.periodId],
                teacherSubjects: result.subjectsForTeacher,
                showSubjectSelect: !singleSubject,
                autoSubjectLabel: singleSubject ? (singleSubject.name_ar || singleSubject.name || "") : "",
                subjectId: singleSubject ? singleSubject.id : (result.entry.subject_id || ""),
                isLoadingSubjects: false,
              };
            }
          });
          return updated;
        });
      };
      
      loadTeacherSubjects();
    } else {
      setPeriodEditorEntries({});
    }
  }, [editingDay, periods, schedule, classId]);

  const loadTeachersAndSubjects = async () => {
    try {
      const [teachersResult, subjectsResult] = await Promise.all([
        getUsersByRole("teacher"),
        getSubjects(),
      ]);

      setTeachers(teachersResult.data || []);
      setSubjects(
        (subjectsResult.data || []).filter((s: any) => s.is_active !== false)
      );
    } catch (error) {
      console.error("Failed to load teachers/subjects:", error);
    }
  };

  const draftCount = Object.keys(draftEntries).length;
  const getSlotKey = (day: number, periodId: string) => `${day}-${periodId}`;

  const getScheduleEntry = (day: number, periodId: string) => {
    const key = getSlotKey(day, periodId);
    const draft = draftEntries[key];
    const baseEntry = schedule.find(
      (s) => s.day_of_week === day && s.period_id === periodId && s.is_active
    );

    if (draft) {
      if (draft.status === "delete") {
        return {
          entry: draft.original ?? baseEntry ?? null,
          isDraft: true,
          isDeleted: true,
          key,
        };
      }

      return {
        entry: draft.data,
        isDraft: true,
        isDeleted: false,
        key,
      };
    }

    return { entry: baseEntry ?? null, isDraft: false, isDeleted: false, key };
  };

  const handleSaveDay = (
    day: number,
    periodEntries: Array<{
      periodId: string;
      teacherId: string;
      subjectId: string;
      roomNumber?: string;
    }>
  ) => {
    const newDrafts: Record<string, DraftEntry> = {};

    periodEntries.forEach(({ periodId, teacherId, subjectId, roomNumber }) => {
      if (!teacherId || !subjectId) {
        return;
      }

      const key = getSlotKey(day, periodId);
      const baseEntry = schedule.find(
        (entry) =>
          entry.day_of_week === day &&
          entry.period_id === periodId &&
          entry.is_active
      );

      // Find teacher and subject objects for display
      const teacher = teachers.find((t) => t.id === teacherId);
      const subject = subjects.find((s) => s.id === subjectId);

      const draftEntry: any = {
        class_id: classId,
        teacher_id: teacherId,
        subject_id: subjectId,
        period_id: periodId,
        day_of_week: day,
        room_number: roomNumber,
        academic_year: academicYear,
        is_active: true,
        // Add teacher and subject objects for display
        teacher: teacher ? { id: teacher.id, name: teacher.name } : null,
        subject: subject ? { 
          id: subject.id, 
          name: subject.name, 
          name_ar: subject.name_ar 
        } : null,
      };

      // Only include id if it exists (for updates)
      if (baseEntry?.id) {
        draftEntry.id = baseEntry.id;
      }

      newDrafts[key] = {
        key,
        data: draftEntry,
        status: baseEntry ? "update" : "create",
        original: baseEntry ?? null,
      };
    });

    setDraftEntries((prev) => ({
      ...prev,
      ...newDrafts,
    }));

    toast.success(tSchedules("draftSavedMessage"));
  };

  const handleInlineTeacherChange = async (periodId: string, teacherId: string) => {
    setPeriodEditorEntries((prev) => ({
      ...prev,
      [periodId]: {
        ...prev[periodId],
        teacherId,
        subjectId: "",
        isLoadingSubjects: true,
      },
    }));

    if (!teacherId) {
      setPeriodEditorEntries((prev) => ({
        ...prev,
        [periodId]: {
          ...prev[periodId],
          teacherSubjects: [],
          showSubjectSelect: true,
          autoSubjectLabel: "",
          isLoadingSubjects: false,
        },
      }));
      return;
    }

    try {
      const assignments = await fetchTeacherAssignments(teacherId);
      const classSpecific = assignments.filter(
        (assignment) => assignment.subject && assignment.class_id === classId
      );
      const genericAssignments = assignments.filter(
        (assignment) => assignment.subject && !assignment.class_id
      );
      const relevantAssignments =
        classSpecific.length > 0
          ? [
              ...classSpecific,
              ...genericAssignments.filter(
                (assignment) =>
                  !classSpecific.some(
                    (specific) =>
                      specific.subject?.id === assignment.subject?.id
                  )
              ),
            ]
          : genericAssignments;
      const subjectsForTeacher = relevantAssignments
        .map((assignment) => assignment.subject!)
        .filter(
          (subject, index, array) =>
            subject?.id &&
            array.findIndex((item) => item?.id === subject.id) === index
        );

      setPeriodEditorEntries((prev) => {
        const singleSubject = subjectsForTeacher.length === 1 ? subjectsForTeacher[0] : null;
        return {
          ...prev,
          [periodId]: {
            ...prev[periodId],
            teacherSubjects: subjectsForTeacher,
            showSubjectSelect: !singleSubject,
            autoSubjectLabel: singleSubject ? (singleSubject.name_ar || singleSubject.name || "") : "",
            subjectId: singleSubject ? singleSubject.id : "",
            isLoadingSubjects: false,
          },
        };
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load teacher subjects");
      setPeriodEditorEntries((prev) => ({
        ...prev,
        [periodId]: {
          ...prev[periodId],
          isLoadingSubjects: false,
        },
      }));
    }
  };

  const handleInlineSubjectChange = (periodId: string, subjectId: string) => {
    setPeriodEditorEntries((prev) => ({
      ...prev,
      [periodId]: {
        ...prev[periodId],
        subjectId,
      },
    }));
  };

  const handleInlineRoomChange = (periodId: string, roomNumber: string) => {
    setPeriodEditorEntries((prev) => ({
      ...prev,
      [periodId]: {
        ...prev[periodId],
        roomNumber,
      },
    }));
  };

  const handleRemoveSchedule = (entry: any, key?: string) => {
    if (!entry) return;

    const resolvedKey = key ?? getSlotKey(entry.day_of_week, entry.period_id);

    setDraftEntries((prev) => {
      const existingDraft = prev[resolvedKey];

      if (existingDraft?.status === "create") {
        const { [resolvedKey]: _omit, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [resolvedKey]: {
          key: resolvedKey,
          data: {
            ...entry,
            is_active: false,
          },
          status: "delete",
          original: entry,
        },
      };
    });

    toast.success(tSchedules("draftRemovalSaved"));
  };

  const handleRevertDraft = (key: string) => {
    setDraftEntries((prev) => {
      const { [key]: _omit, ...rest } = prev;
      return rest;
    });
  };

  const handleDiscardDrafts = () => {
    setDraftEntries({});
    toast.success(tSchedules("draftsDiscardedMessage"));
  };

  const handlePublishDrafts = async () => {
    if (draftCount === 0) return;

    setIsPublishing(true);
    try {
      const payload: ClassSchedule[] = [];

      Object.values(draftEntries).forEach((draft) => {
        if (draft.status === "delete" && draft.original) {
          // For deletions, strip any display objects and ensure we have the id
          const { teacher, subject, ...originalDbColumns } = draft.original as any;
          if (!originalDbColumns.id) {
            console.error("Delete draft missing id:", draft);
            return;
          }
          payload.push({
            ...originalDbColumns,
            is_active: false,
          } as ClassSchedule);
        } else {
          // For creates/updates, only send database columns (exclude display objects)
          const { id, ...dbColumns } = draft.data;
          // Remove display-only fields if they exist (teacher, subject are display objects)
          const { teacher, subject, ...cleanDbColumns } = dbColumns as any;
          
          // Create a clean entry with only database columns
          const scheduleEntry: any = {
            class_id: dbColumns.class_id,
            teacher_id: dbColumns.teacher_id,
            subject_id: dbColumns.subject_id,
            period_id: dbColumns.period_id,
            day_of_week: dbColumns.day_of_week,
            academic_year: dbColumns.academic_year,
            is_active: dbColumns.is_active ?? true,
          };
          
          // Only include optional fields if they have values
          if (dbColumns.room_number) {
            scheduleEntry.room_number = dbColumns.room_number;
          }
          
          // Only include id if it exists and is truthy (for updates)
          // For new entries, id should not be included at all
          if (id && typeof id === 'string' && id.length > 0) {
            scheduleEntry.id = id;
          }
          
          payload.push(scheduleEntry as ClassSchedule);
        }
      });

      const result = await upsertClassSchedules(payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(tSchedules("draftsPublishSuccess"));
      setDraftEntries({});
      onScheduleUpdate();
    } catch (error) {
      console.error("Failed to publish drafts:", error);
      toast.error(tSchedules("draftsPublishError"));
    } finally {
      setIsPublishing(false);
    }
  };

  const fetchTeacherAssignments = async (teacherId: string) => {
    if (teacherAssignmentsCache[teacherId]) {
      return teacherAssignmentsCache[teacherId];
    }

    const result = await getTeacherAssignments(teacherId);
    if (result.error) {
      throw new Error(result.error);
    }

    const assignments = result.data || [];
    setTeacherAssignmentsCache((prev) => ({
      ...prev,
      [teacherId]: assignments,
    }));

    return assignments;
  };

  const activePeriods = periods.filter((p) => !p.is_break);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left font-semibold">
                  {tSchedules("dayColumnHeader", { default: "Day" })}
                </th>
                {activePeriods.map((period) => (
                  <th key={period.id} className="border p-2 text-center font-semibold align-top">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {period.name && !period.name.match(/^Period \d+$/i)
                          ? period.name 
                          : tSchedules("periodLabel", { 
                              number: period.period_number,
                              default: `Period ${period.period_number}`
                            })
                        }
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {period.start_time} - {period.end_time}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LIBYA_SCHOOL_WEEK_DAYS.map((day) => {
                const isEditingThisDay = editingDay === day.value;
                return (
                  <tr key={day.value}>
                    <td className="border p-2 text-sm font-semibold align-middle">
                      <div className="space-y-2">
                        <div>{tScheduleDays(day.key)}</div>
                        {!isEditingThisDay && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingDay(day.value)}
                            className="w-full h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {tSchedules("editDay", { default: "Edit Day" })}
                          </Button>
                        )}
                        {isEditingThisDay && (
                          <div className="space-y-1">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                const entries = activePeriods.map((period) => {
                                  const entry = periodEditorEntries[period.id];
                                  return {
                                    periodId: period.id,
                                    teacherId: entry?.teacherId || "",
                                    subjectId: entry?.subjectId || "",
                                    roomNumber: entry?.roomNumber || undefined,
                                  };
                                }).filter((e) => e.teacherId && e.subjectId);
                                if (entries.length > 0) {
                                  handleSaveDay(day.value, entries);
                                  setEditingDay(null);
                                  setPeriodEditorEntries({});
                                } else {
                                  toast.error(tSchedules("selectAtLeastOnePeriod", { default: "Please select at least one period" }));
                                }
                              }}
                              className="w-full h-7 text-xs"
                            >
                              {tSchedules("saveDay", { default: "Save Day" })}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingDay(null);
                                setPeriodEditorEntries({});
                              }}
                              className="w-full h-7 text-xs"
                            >
                              {tSchedules("cancel", { default: "Cancel" })}
                            </Button>
                          </div>
                        )}
                      </div>
                    </td>
                    {activePeriods.map((period) => {
                      const slotInfo = getScheduleEntry(day.value, period.id);
                      const entry = slotInfo.entry;
                      const isDraftEntry = slotInfo.isDraft;
                      const isDraftDeletion = slotInfo.isDeleted;
                      const slotKey = slotInfo.key;

                      return (
                        <td key={period.id} className="border p-2 align-top">
                          {isEditingThisDay ? (
                            <InlinePeriodEditor
                              period={period}
                              entry={periodEditorEntries[period.id]}
                              teachers={filteredTeachers}
                              classId={classId}
                              schedule={schedule}
                              day={day.value}
                              onTeacherChange={(teacherId) => handleInlineTeacherChange(period.id, teacherId)}
                              onSubjectChange={(subjectId) => handleInlineSubjectChange(period.id, subjectId)}
                              onRoomChange={(roomNumber) => handleInlineRoomChange(period.id, roomNumber)}
                              fetchTeacherAssignments={fetchTeacherAssignments}
                              tSchedules={tSchedules}
                            />
                          ) : isDraftDeletion ? (
                            <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs">
                              <p className="font-medium text-destructive">
                                {tSchedules("markedForRemoval")}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs w-full"
                                onClick={() => handleRevertDraft(slotKey)}
                              >
                                {tSchedules("undo")}
                              </Button>
                            </div>
                          ) : entry ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">
                                  {entry.subject?.name_ar || entry.subject?.name}
                                </div>
                                {isDraftEntry && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {tSchedules("draftIndicator")}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {entry.teacher?.name}
                              </div>
                              {entry.room_number && (
                                <div className="text-xs text-muted-foreground">
                                  {tSchedules("schedule.roomLabel", {
                                    default: "Room",
                                  })}
                                  : {entry.room_number}
                                </div>
                              )}
                              <div className="flex gap-1 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveSchedule(entry, slotKey)}
                                  className="h-6 text-xs text-destructive"
                                  disabled={isSaving}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground text-center py-2">
                              {tSchedules("emptySlot", { default: "Empty" })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {draftCount > 0 && (
          <div className="mt-4 space-y-3 rounded-md border border-dashed border-border p-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {tSchedules("draftSummary", { count: draftCount })}
              </p>
              <p className="text-xs text-muted-foreground">
                {tSchedules("draftSummaryHelper")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handlePublishDrafts}
                disabled={isPublishing}
                className="flex-1 min-w-[160px]"
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {tSchedules("publishDrafts")}
              </Button>
              <Button
                variant="outline"
                onClick={handleDiscardDrafts}
                disabled={isPublishing}
                className="flex-1 min-w-[160px]"
              >
                {tSchedules("discardDrafts")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface InlinePeriodEditorProps {
  period: {
    id: string;
    period_number: number;
    start_time: string;
    end_time: string;
    name?: string | null;
  };
  entry: {
    teacherId: string;
    subjectId: string;
    roomNumber: string;
    teacherSubjects: Array<{ id: string; name?: string | null; name_ar?: string | null }>;
    showSubjectSelect: boolean;
    autoSubjectLabel: string;
    isLoadingSubjects: boolean;
  } | undefined;
  teachers: any[];
  classId: string;
  schedule: any[];
  day: number;
  onTeacherChange: (teacherId: string) => void;
  onSubjectChange: (subjectId: string) => void;
  onRoomChange: (roomNumber: string) => void;
  fetchTeacherAssignments: (teacherId: string) => Promise<TeacherAssignmentWithDetails[]>;
  tSchedules: any;
}

function InlinePeriodEditor({
  period,
  entry,
  teachers,
  onTeacherChange,
  onSubjectChange,
  onRoomChange,
  tSchedules,
}: InlinePeriodEditorProps) {
  const defaultEntry = {
    teacherId: "",
    subjectId: "",
    roomNumber: "",
    teacherSubjects: [],
    showSubjectSelect: true,
    autoSubjectLabel: "",
    isLoadingSubjects: false,
  };

  const currentEntry = entry || defaultEntry;
  const selectedTeacher = teachers.find((t) => t.id === currentEntry.teacherId);
  
  // Check if teacher has single subject from the loaded teacherSubjects
  const selectedTeacherSingleSubject =
    currentEntry.teacherSubjects.length === 1
      ? currentEntry.teacherSubjects[0]
      : null;

  const renderTeacherItem = (teacher: any) => {
    // For dropdown items, we can't easily check subjects here
    // So we'll just show the teacher name
    return (
      <SelectItem key={teacher.id} value={teacher.id}>
        {teacher.name}
      </SelectItem>
    );
  };

  return (
    <div className="space-y-2 p-2">
      <div className="space-y-1.5">
        <Label className="text-[10px] font-medium">
          {tSchedules("schedule.teacherLabel", { default: "Teacher" })}
        </Label>
        <Select
          value={currentEntry.teacherId || undefined}
          onValueChange={onTeacherChange}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder={tSchedules("selectTeacher")}>
              {selectedTeacher && (
                <div className="flex flex-col text-left">
                  <span className="text-[11px]">{selectedTeacher.name}</span>
                  {selectedTeacherSingleSubject && (
                    <span className="text-[9px] text-muted-foreground">
                      {selectedTeacherSingleSubject.name_ar ||
                        selectedTeacherSingleSubject.name}
                    </span>
                  )}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {teachers.map((teacher) => renderTeacherItem(teacher))}
          </SelectContent>
        </Select>
      </div>

      {currentEntry.showSubjectSelect && currentEntry.teacherSubjects.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-[10px] font-medium">
            {tSchedules("schedule.subjectLabel", { default: "Subject" })}
          </Label>
          <Select
            value={currentEntry.subjectId || undefined}
            onValueChange={onSubjectChange}
            disabled={currentEntry.isLoadingSubjects}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder={tSchedules("selectSubject")} />
            </SelectTrigger>
            <SelectContent>
              {currentEntry.teacherSubjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name_ar || subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!currentEntry.showSubjectSelect && currentEntry.autoSubjectLabel && (
        <div className="space-y-1.5">
          <Label className="text-[10px] font-medium">
            {tSchedules("schedule.subjectLabel", { default: "Subject" })}
          </Label>
          <div className="h-7 rounded-md border border-dashed border-border px-2 text-[11px] flex items-center text-muted-foreground">
            {currentEntry.autoSubjectLabel}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-[10px] font-medium">
          {tSchedules("schedule.roomNumber", { default: "Room (Optional)" })}
        </Label>
        <Input
          value={currentEntry.roomNumber}
          onChange={(e) => onRoomChange(e.target.value)}
          placeholder={tSchedules("schedule.roomPlaceholder", {
            default: "Room",
          })}
          className="h-7 text-xs"
        />
      </div>
    </div>
  );
}

interface PeriodEditorProps {
  period: any;
  classId: string;
  teachers: any[];
  subjects: any[];
  schedule: any[];
  onSave: (dayEntries: Array<{
    day: number;
    teacherId: string;
    subjectId: string;
    roomNumber?: string;
  }>) => void;
  onCancel: () => void;
  fetchTeacherAssignments: (
    teacherId: string
  ) => Promise<TeacherAssignmentWithDetails[]>;
}

function PeriodEditor({
  period,
  classId,
  teachers,
  subjects,
  schedule,
  onSave,
  onCancel,
  fetchTeacherAssignments,
}: PeriodEditorProps) {
  const tSchedules = useTranslations("admin.schedules");
  const tScheduleDays = useTranslations("admin.schedules.days");
  const [dayEntries, setDayEntries] = useState<Record<number, {
    teacherId: string;
    subjectId: string;
    roomNumber: string;
    teacherSubjects: Array<{ id: string; name?: string | null; name_ar?: string | null }>;
    showSubjectSelect: boolean;
    autoSubjectLabel: string;
    isLoadingSubjects: boolean;
  }>>({});

  useEffect(() => {
    const initialEntries: Record<number, any> = {};
    
    LIBYA_SCHOOL_WEEK_DAYS.forEach((day) => {
      const entry = schedule.find(
        (s) => s.day_of_week === day.value && s.period_id === period.id && s.is_active
      );
      
      initialEntries[day.value] = {
        teacherId: entry?.teacher_id || "",
        subjectId: entry?.subject_id || "",
        roomNumber: entry?.room_number || "",
        teacherSubjects: [],
        showSubjectSelect: true,
        autoSubjectLabel: "",
        isLoadingSubjects: false,
      };
    });
    
    setDayEntries(initialEntries);
    
    // Load teacher subjects for existing entries
    const loadTeacherSubjects = async () => {
      const promises = LIBYA_SCHOOL_WEEK_DAYS.map(async (day) => {
        const entry = schedule.find(
          (s) => s.day_of_week === day.value && s.period_id === period.id && s.is_active
        );
        
        if (!entry?.teacher_id) return null;
        
        try {
          const assignments = await fetchTeacherAssignments(entry.teacher_id);
          const classSpecific = assignments.filter(
            (assignment) => assignment.subject && assignment.class_id === classId
          );
          const genericAssignments = assignments.filter(
            (assignment) => assignment.subject && !assignment.class_id
          );
          const relevantAssignments = classSpecific.length > 0 ? classSpecific : genericAssignments;
          const subjectsForTeacher = relevantAssignments
            .map((assignment) => assignment.subject!)
            .filter(
              (subject, index, array) =>
                subject?.id &&
                array.findIndex((item) => item?.id === subject.id) === index
            );

          return {
            day: day.value,
            subjectsForTeacher,
            entry,
          };
        } catch (error) {
          console.error(error);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      
      setDayEntries((prev) => {
        const updated = { ...prev };
        results.forEach((result) => {
          if (result) {
            const singleSubject = result.subjectsForTeacher.length === 1 ? result.subjectsForTeacher[0] : null;
            updated[result.day] = {
              ...prev[result.day],
              teacherSubjects: result.subjectsForTeacher,
              showSubjectSelect: !singleSubject,
              autoSubjectLabel: singleSubject ? (singleSubject.name_ar || singleSubject.name || "") : "",
              subjectId: singleSubject ? singleSubject.id : (result.entry.subject_id || ""),
              isLoadingSubjects: false,
            };
          }
        });
        return updated;
      });
    };
    
    loadTeacherSubjects();
  }, [period.id, schedule, classId, fetchTeacherAssignments]);

  const handleTeacherChange = async (day: number, teacherId: string) => {
    setDayEntries((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        teacherId,
        subjectId: "",
        isLoadingSubjects: true,
      },
    }));

    if (!teacherId) {
      setDayEntries((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          teacherSubjects: [],
          showSubjectSelect: true,
          autoSubjectLabel: "",
          isLoadingSubjects: false,
        },
      }));
      return;
    }

    try {
      const assignments = await fetchTeacherAssignments(teacherId);
      const classSpecific = assignments.filter(
        (assignment) => assignment.subject && assignment.class_id === classId
      );
      const genericAssignments = assignments.filter(
        (assignment) => assignment.subject && !assignment.class_id
      );
      const relevantAssignments = classSpecific.length > 0 ? classSpecific : genericAssignments;
      const subjectsForTeacher = relevantAssignments
        .map((assignment) => assignment.subject!)
        .filter(
          (subject, index, array) =>
            subject?.id &&
            array.findIndex((item) => item?.id === subject.id) === index
        );

      setDayEntries((prev) => {
        const singleSubject = subjectsForTeacher.length === 1 ? subjectsForTeacher[0] : null;
        return {
          ...prev,
          [day]: {
            ...prev[day],
            teacherSubjects: subjectsForTeacher,
            showSubjectSelect: !singleSubject,
            autoSubjectLabel: singleSubject ? (singleSubject.name_ar || singleSubject.name || "") : "",
            subjectId: singleSubject ? singleSubject.id : "",
            isLoadingSubjects: false,
          },
        };
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load teacher subjects");
      setDayEntries((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          isLoadingSubjects: false,
        },
      }));
    }
  };

  const handleSubjectChange = (day: number, subjectId: string) => {
    setDayEntries((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        subjectId,
      },
    }));
  };

  const handleRoomChange = (day: number, roomNumber: string) => {
    setDayEntries((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        roomNumber,
      },
    }));
  };

  const handleSave = () => {
    const entries = LIBYA_SCHOOL_WEEK_DAYS.map((day) => {
      const entry = dayEntries[day.value];
      return {
        day: day.value,
        teacherId: entry?.teacherId || "",
        subjectId: entry?.subjectId || "",
        roomNumber: entry?.roomNumber || undefined,
      };
    }).filter((e) => e.teacherId && e.subjectId);

    if (entries.length === 0) {
      toast.error(tSchedules("selectAtLeastOneDay", { default: "Please select at least one day" }));
      return;
    }

    onSave(entries);
  };

  const renderTeacherItem = (teacher: any) => {
    const singleSubject =
      Array.isArray(teacher.subjects) && teacher.subjects.length === 1
        ? teacher.subjects[0]
        : null;

    return (
      <SelectItem key={teacher.id} value={teacher.id}>
        <div className="flex flex-col">
          <span>{teacher.name}</span>
          {singleSubject && (
            <span className="text-[11px] text-muted-foreground">
              {singleSubject.name_ar || singleSubject.name}
            </span>
          )}
        </div>
      </SelectItem>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {tSchedules("editPeriod")}: {period.name && !period.name.match(/^Period \d+$/i) 
            ? period.name 
            : tSchedules("periodLabel", { number: period.period_number, default: `Period ${period.period_number}` })}
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          {tSchedules("cancel", { default: "Cancel" })}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {LIBYA_SCHOOL_WEEK_DAYS.map((day) => {
          const entry = dayEntries[day.value] || {
            teacherId: "",
            subjectId: "",
            roomNumber: "",
            teacherSubjects: [],
            showSubjectSelect: true,
            autoSubjectLabel: "",
            isLoadingSubjects: false,
          };
          
          const selectedTeacher = teachers.find((t) => t.id === entry.teacherId);
          const selectedTeacherSingleSubject =
            selectedTeacher &&
            Array.isArray(selectedTeacher.subjects) &&
            selectedTeacher.subjects.length === 1
              ? selectedTeacher.subjects[0]
              : null;

          return (
            <div key={day.value} className="space-y-2 p-3 border rounded-md">
              <h5 className="text-xs font-medium">{tScheduleDays(day.key)}</h5>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">
                    {tSchedules("schedule.teacherLabel", { default: "Teacher" })}
                  </Label>
                  <Select
                    value={entry.teacherId}
                    onValueChange={(value) => handleTeacherChange(day.value, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      {selectedTeacher ? (
                        <div className="flex flex-col text-left">
                          <span>{selectedTeacher.name}</span>
                          {selectedTeacherSingleSubject && (
                            <span className="text-[11px] text-muted-foreground">
                              {selectedTeacherSingleSubject.name_ar ||
                                selectedTeacherSingleSubject.name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <SelectValue placeholder={tSchedules("selectTeacher")} />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => renderTeacherItem(teacher))}
                    </SelectContent>
                  </Select>
                </div>

                {entry.showSubjectSelect && (
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {tSchedules("schedule.subjectLabel", { default: "Subject" })}
                    </Label>
                    <Select
                      value={entry.subjectId}
                      onValueChange={(value) => handleSubjectChange(day.value, value)}
                      disabled={entry.isLoadingSubjects || entry.teacherSubjects.length === 0}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={tSchedules("selectSubject")} />
                      </SelectTrigger>
                      <SelectContent>
                        {entry.teacherSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name_ar || subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!entry.showSubjectSelect && entry.autoSubjectLabel && (
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {tSchedules("schedule.subjectLabel", { default: "Subject" })}
                    </Label>
                    <div className="h-8 rounded-md border border-dashed border-border px-2 text-xs flex items-center text-muted-foreground">
                      {entry.autoSubjectLabel}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">
                    {tSchedules("schedule.roomNumber", { default: "Room (Optional)" })}
                  </Label>
                  <Input
                    value={entry.roomNumber}
                    onChange={(e) => handleRoomChange(day.value, e.target.value)}
                    placeholder={tSchedules("schedule.roomPlaceholder", {
                      default: "Room number",
                    })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="h-8 text-xs"
        >
          {tSchedules("cancel", { default: "Cancel" })}
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          className="h-8 text-xs"
        >
          {tSchedules("savePeriod", { default: "Save Period" })}
        </Button>
      </div>
    </div>
  );
}

interface DayEditorProps {
  day: number;
  dayLabel: string;
  periods: Array<{
    id: string;
    period_number: number;
    start_time: string;
    end_time: string;
    name?: string | null;
  }>;
  classId: string;
  teachers: any[];
  subjects: any[];
  schedule: any[];
  onSave: (periodEntries: Array<{
    periodId: string;
    teacherId: string;
    subjectId: string;
    roomNumber?: string;
  }>) => void;
  onCancel: () => void;
  fetchTeacherAssignments: (
    teacherId: string
  ) => Promise<TeacherAssignmentWithDetails[]>;
}

function DayEditor({
  day,
  dayLabel,
  periods,
  classId,
  teachers,
  subjects,
  schedule,
  onSave,
  onCancel,
  fetchTeacherAssignments,
}: DayEditorProps) {
  const tSchedules = useTranslations("admin.schedules");
  const [periodEntries, setPeriodEntries] = useState<Record<string, {
    teacherId: string;
    subjectId: string;
    roomNumber: string;
    teacherSubjects: Array<{ id: string; name?: string | null; name_ar?: string | null }>;
    showSubjectSelect: boolean;
    autoSubjectLabel: string;
    isLoadingSubjects: boolean;
  }>>({});

  useEffect(() => {
    const initialEntries: Record<string, any> = {};
    
    periods.forEach((period) => {
      const entry = schedule.find(
        (s) => s.day_of_week === day && s.period_id === period.id && s.is_active
      );
      
      initialEntries[period.id] = {
        teacherId: entry?.teacher_id || "",
        subjectId: entry?.subject_id || "",
        roomNumber: entry?.room_number || "",
        teacherSubjects: [],
        showSubjectSelect: true,
        autoSubjectLabel: "",
        isLoadingSubjects: false,
      };
    });
    
    setPeriodEntries(initialEntries);
    
    // Load teacher subjects for existing entries
    const loadTeacherSubjects = async () => {
      const promises = periods.map(async (period) => {
        const entry = schedule.find(
          (s) => s.day_of_week === day && s.period_id === period.id && s.is_active
        );
        
        if (!entry?.teacher_id) return null;
        
        try {
          const assignments = await fetchTeacherAssignments(entry.teacher_id);
          const classSpecific = assignments.filter(
            (assignment) => assignment.subject && assignment.class_id === classId
          );
          const genericAssignments = assignments.filter(
            (assignment) => assignment.subject && !assignment.class_id
          );
          const relevantAssignments = classSpecific.length > 0 ? classSpecific : genericAssignments;
          const subjectsForTeacher = relevantAssignments
            .map((assignment) => assignment.subject!)
            .filter(
              (subject, index, array) =>
                subject?.id &&
                array.findIndex((item) => item?.id === subject.id) === index
            );

          return {
            periodId: period.id,
            subjectsForTeacher,
            entry,
          };
        } catch (error) {
          console.error(error);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      
      setPeriodEntries((prev) => {
        const updated = { ...prev };
        results.forEach((result) => {
          if (result) {
            const singleSubject = result.subjectsForTeacher.length === 1 ? result.subjectsForTeacher[0] : null;
            updated[result.periodId] = {
              ...prev[result.periodId],
              teacherSubjects: result.subjectsForTeacher,
              showSubjectSelect: !singleSubject,
              autoSubjectLabel: singleSubject ? (singleSubject.name_ar || singleSubject.name || "") : "",
              subjectId: singleSubject ? singleSubject.id : (result.entry.subject_id || ""),
              isLoadingSubjects: false,
            };
          }
        });
        return updated;
      });
    };
    
    loadTeacherSubjects();
  }, [day, periods, schedule, classId, fetchTeacherAssignments]);

  const handleTeacherChange = async (periodId: string, teacherId: string) => {
    setPeriodEntries((prev) => ({
      ...prev,
      [periodId]: {
        ...prev[periodId],
        teacherId,
        subjectId: "",
        isLoadingSubjects: true,
      },
    }));

    if (!teacherId) {
      setPeriodEntries((prev) => ({
        ...prev,
        [periodId]: {
          ...prev[periodId],
          teacherSubjects: [],
          showSubjectSelect: true,
          autoSubjectLabel: "",
          isLoadingSubjects: false,
        },
      }));
      return;
    }

    try {
      const assignments = await fetchTeacherAssignments(teacherId);
      const classSpecific = assignments.filter(
        (assignment) => assignment.subject && assignment.class_id === classId
      );
      const genericAssignments = assignments.filter(
        (assignment) => assignment.subject && !assignment.class_id
      );
      const relevantAssignments = classSpecific.length > 0 ? classSpecific : genericAssignments;
      const subjectsForTeacher = relevantAssignments
        .map((assignment) => assignment.subject!)
        .filter(
          (subject, index, array) =>
            subject?.id &&
            array.findIndex((item) => item?.id === subject.id) === index
        );

      setPeriodEntries((prev) => {
        const singleSubject = subjectsForTeacher.length === 1 ? subjectsForTeacher[0] : null;
        return {
          ...prev,
          [periodId]: {
            ...prev[periodId],
            teacherSubjects: subjectsForTeacher,
            showSubjectSelect: !singleSubject,
            autoSubjectLabel: singleSubject ? (singleSubject.name_ar || singleSubject.name || "") : "",
            subjectId: singleSubject ? singleSubject.id : "",
            isLoadingSubjects: false,
          },
        };
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load teacher subjects");
      setPeriodEntries((prev) => ({
        ...prev,
        [periodId]: {
          ...prev[periodId],
          isLoadingSubjects: false,
        },
      }));
    }
  };

  const handleSubjectChange = (periodId: string, subjectId: string) => {
    setPeriodEntries((prev) => ({
      ...prev,
      [periodId]: {
        ...prev[periodId],
        subjectId,
      },
    }));
  };

  const handleRoomChange = (periodId: string, roomNumber: string) => {
    setPeriodEntries((prev) => ({
      ...prev,
      [periodId]: {
        ...prev[periodId],
        roomNumber,
      },
    }));
  };

  const handleSave = () => {
    const entries = periods.map((period) => {
      const entry = periodEntries[period.id];
      return {
        periodId: period.id,
        teacherId: entry?.teacherId || "",
        subjectId: entry?.subjectId || "",
        roomNumber: entry?.roomNumber || undefined,
      };
    }).filter((e) => e.teacherId && e.subjectId);

    if (entries.length === 0) {
      toast.error(tSchedules("selectAtLeastOnePeriod", { default: "Please select at least one period" }));
      return;
    }

    onSave(entries);
  };

  const renderTeacherItem = (teacher: any) => {
    const singleSubject =
      Array.isArray(teacher.subjects) && teacher.subjects.length === 1
        ? teacher.subjects[0]
        : null;

    return (
      <SelectItem key={teacher.id} value={teacher.id}>
        <div className="flex flex-col">
          <span>{teacher.name}</span>
          {singleSubject && (
            <span className="text-[11px] text-muted-foreground">
              {singleSubject.name_ar || singleSubject.name}
            </span>
          )}
        </div>
      </SelectItem>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {tSchedules("editDay", { default: "Edit Day" })}: {dayLabel}
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          {tSchedules("cancel", { default: "Cancel" })}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {periods.map((period) => {
          const entry = periodEntries[period.id] || {
            teacherId: "",
            subjectId: "",
            roomNumber: "",
            teacherSubjects: [],
            showSubjectSelect: true,
            autoSubjectLabel: "",
            isLoadingSubjects: false,
          };
          
          const selectedTeacher = teachers.find((t) => t.id === entry.teacherId);
          const selectedTeacherSingleSubject =
            selectedTeacher &&
            Array.isArray(selectedTeacher.subjects) &&
            selectedTeacher.subjects.length === 1
              ? selectedTeacher.subjects[0]
              : null;

          const periodLabel = period.name && !period.name.match(/^Period \d+$/i)
            ? period.name 
            : tSchedules("periodLabel", { number: period.period_number, default: `Period ${period.period_number}` });

          return (
            <div key={period.id} className="space-y-2 p-3 border rounded-md">
              <h5 className="text-xs font-medium">
                {periodLabel} ({period.start_time} - {period.end_time})
              </h5>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">
                    {tSchedules("schedule.teacherLabel", { default: "Teacher" })}
                  </Label>
                  <Select
                    value={entry.teacherId}
                    onValueChange={(value) => handleTeacherChange(period.id, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      {selectedTeacher ? (
                        <div className="flex flex-col text-left">
                          <span>{selectedTeacher.name}</span>
                          {selectedTeacherSingleSubject && (
                            <span className="text-[11px] text-muted-foreground">
                              {selectedTeacherSingleSubject.name_ar ||
                                selectedTeacherSingleSubject.name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <SelectValue placeholder={tSchedules("selectTeacher")} />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => renderTeacherItem(teacher))}
                    </SelectContent>
                  </Select>
                </div>

                {entry.showSubjectSelect && (
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {tSchedules("schedule.subjectLabel", { default: "Subject" })}
                    </Label>
                    <Select
                      value={entry.subjectId}
                      onValueChange={(value) => handleSubjectChange(period.id, value)}
                      disabled={entry.isLoadingSubjects || entry.teacherSubjects.length === 0}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={tSchedules("selectSubject")} />
                      </SelectTrigger>
                      <SelectContent>
                        {entry.teacherSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name_ar || subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!entry.showSubjectSelect && entry.autoSubjectLabel && (
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {tSchedules("schedule.subjectLabel", { default: "Subject" })}
                    </Label>
                    <div className="h-8 rounded-md border border-dashed border-border px-2 text-xs flex items-center text-muted-foreground">
                      {entry.autoSubjectLabel}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">
                    {tSchedules("schedule.roomNumber", { default: "Room (Optional)" })}
                  </Label>
                  <Input
                    value={entry.roomNumber}
                    onChange={(e) => handleRoomChange(period.id, e.target.value)}
                    placeholder={tSchedules("schedule.roomPlaceholder", {
                      default: "Room number",
                    })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="h-8 text-xs"
        >
          {tSchedules("cancel", { default: "Cancel" })}
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          className="h-8 text-xs"
        >
          {tSchedules("saveDay", { default: "Save Day" })}
        </Button>
      </div>
    </div>
  );
}

