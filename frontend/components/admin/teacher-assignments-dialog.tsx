"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  getTeacherSubjectSkills,
  getTeacherGradeLevels,
  getClasses,
} from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { teacherDataCache, CACHE_KEYS } from "@/lib/cache/teacher-data-cache";

export interface TeacherDraftState {
  subjects: string[];
  gradeLevels: string[];
  classes: Record<string, string[]>; // grade -> class IDs
}

interface TeacherAssignmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  teacherName: string;
  availableSubjects: Array<{
    id: string;
    name: string;
    name_ar?: string | null;
  }>;
  availableGradeLevels: string[];
  // Draft state managed by parent
  draftState: TeacherDraftState;
  onDraftChange: (draft: TeacherDraftState | ((prev: TeacherDraftState) => TeacherDraftState)) => void;
  // Initial state for comparison
  initialState: TeacherDraftState;
}

export function TeacherAssignmentsDialog({
  open,
  onOpenChange,
  teacherId,
  teacherName,
  availableSubjects,
  availableGradeLevels,
  draftState,
  onDraftChange,
  initialState,
}: TeacherAssignmentsDialogProps) {
  const t = useTranslations("common");
  const tAssignments = useTranslations("admin.teachers.assignments");
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [classesByGrade, setClassesByGrade] = useState<Record<string, Array<{ id: string; name: string; section?: string | null }>>>({});
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  const hasSubjectChanges = useMemo(() => {
    if (draftState.subjects.length !== initialState.subjects.length) return true;
    const baseline = new Set(initialState.subjects);
    return draftState.subjects.some((id) => !baseline.has(id));
  }, [initialState.subjects, draftState.subjects]);

  const hasGradeChanges = useMemo(() => {
    if (draftState.gradeLevels.length !== initialState.gradeLevels.length) return true;
    const baseline = new Set(initialState.gradeLevels);
    return draftState.gradeLevels.some((level) => !baseline.has(level));
  }, [initialState.gradeLevels, draftState.gradeLevels]);

  const hasClassChanges = useMemo(() => {
    const initialKeys = Object.keys(initialState.classes);
    const draftKeys = Object.keys(draftState.classes);
    if (initialKeys.length !== draftKeys.length) return true;
    
    for (const grade of initialKeys) {
      const initial = new Set(initialState.classes[grade] || []);
      const draft = new Set(draftState.classes[grade] || []);
      if (initial.size !== draft.size) return true;
      if ([...initial].some((id) => !draft.has(id))) return true;
    }
    
    for (const grade of draftKeys) {
      if (!initialState.classes[grade]) return true;
    }
    
    return false;
  }, [initialState.classes, draftState.classes]);

  const hasChanges = hasSubjectChanges || hasGradeChanges || hasClassChanges;

  useEffect(() => {
    if (open && teacherId) {
      setSearchTerm("");
      // Load classes - use cache if available
      const cachedClasses = teacherDataCache.get<Record<string, Array<{ id: string; name: string; section?: string | null }>>>(CACHE_KEYS.CLASSES);
      if (cachedClasses) {
        setClassesByGrade(cachedClasses);
      } else {
        void loadClassesByGrade();
      }
      
      // Expand grades that are selected in draft state (only on open)
      const gradesToExpand = draftState.gradeLevels.length > 0 ? draftState.gradeLevels : initialState.gradeLevels;
      if (gradesToExpand.length > 0) {
        setExpandedGrades(new Set(gradesToExpand));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teacherId]);

  // Sync draft state with initial state when dialog opens or initial state changes
  useEffect(() => {
    if (open && teacherId) {
      // If draft state is empty but initial state has data, sync them
      const draftIsEmpty = draftState.subjects.length === 0 && draftState.gradeLevels.length === 0;
      const initialStateHasData = initialState.subjects.length > 0 || initialState.gradeLevels.length > 0;
      
      if (draftIsEmpty && initialStateHasData) {
        onDraftChange({
          subjects: [...initialState.subjects],
          gradeLevels: [...initialState.gradeLevels],
          classes: { ...initialState.classes },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teacherId, initialState.subjects, initialState.gradeLevels]);

  const loadSubjectSkills = async () => {
    setIsLoadingSubjects(true);
    try {
      // Check cache first
      const cacheKey = CACHE_KEYS.TEACHER_SUBJECTS(teacherId);
      const cached = teacherDataCache.get<string[]>(cacheKey);
      
      if (cached) {
        onDraftChange((prev) => ({ ...prev, subjects: cached }));
        setIsLoadingSubjects(false);
        return;
      }

      const result = await getTeacherSubjectSkills(teacherId);
      if (result.error) {
        toast.error(result.error);
        setIsLoadingSubjects(false);
        return;
      }
      const subjectIds =
        result.data?.map((subject) => subject.subject_id).filter(Boolean) ?? [];
      
      // Cache the result
      teacherDataCache.set(cacheKey, subjectIds);
      
      onDraftChange((prev) => ({ ...prev, subjects: subjectIds }));
    } catch (error) {
      console.error("Failed to load teacher subjects:", error);
      toast.error(tAssignments("failedToLoadSubjects"));
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const loadGradeLevels = async () => {
    if (availableGradeLevels.length === 0) {
      onDraftChange((prev) => ({ ...prev, gradeLevels: [] }));
      return;
    }

    setIsLoadingGrades(true);
    try {
      // Check cache first
      const cacheKey = CACHE_KEYS.TEACHER_GRADE_LEVELS(teacherId);
      const cached = teacherDataCache.get<string[]>(cacheKey);
      
      if (cached) {
        onDraftChange((prev) => ({ ...prev, gradeLevels: cached }));
        setExpandedGrades(new Set(cached));
        setIsLoadingGrades(false);
        return;
      }

      const result = await getTeacherGradeLevels(teacherId);
      if (result.error) {
        toast.error(result.error);
        setIsLoadingGrades(false);
        return;
      }
      const gradeLevels = result.data || [];
      
      // Cache the result
      teacherDataCache.set(cacheKey, gradeLevels);
      
      onDraftChange((prev) => ({ ...prev, gradeLevels }));
      // Expand all selected grades
      setExpandedGrades(new Set(gradeLevels));
    } catch (error) {
      console.error("Failed to load teacher grade levels:", error);
      toast.error(tAssignments("failedToLoadGradeLevels"));
    } finally {
      setIsLoadingGrades(false);
    }
  };

  const loadClassesByGrade = async () => {
    // Check cache first
    const cached = teacherDataCache.get<Record<string, Array<{ id: string; name: string; section?: string | null }>>>(CACHE_KEYS.CLASSES);
    if (cached) {
      setClassesByGrade(cached);
      return;
    }

    setIsLoadingClasses(true);
    try {
      const result = await getClasses();
      if (result.error) {
        console.error("Failed to load classes:", result.error);
        return;
      }
      
      // Group classes by grade_level (only active classes)
      const grouped: Record<string, Array<{ id: string; name: string; section?: string | null }>> = {};
      (result.data || [])
        .filter((cls: any) => cls.is_active !== false) // Only show active classes
        .forEach((cls: any) => {
          const grade = cls.grade_level || "";
          if (!grade) return; // Skip classes without grade_level
          if (!grouped[grade]) {
            grouped[grade] = [];
          }
          grouped[grade].push({
            id: cls.id,
            name: cls.name,
            section: cls.section,
          });
        });
      
      // Sort classes within each grade by name (or by section if name format is consistent)
      Object.keys(grouped).forEach((grade) => {
        grouped[grade].sort((a, b) => {
          // Try to sort numerically if names are like "1-1", "1-2", etc.
          const numA = parseInt(a.name.split("-")[1] || a.name) || 0;
          const numB = parseInt(b.name.split("-")[1] || b.name) || 0;
          if (numA !== numB) return numA - numB;
          return a.name.localeCompare(b.name);
        });
      });
      
      // Cache the result (longer TTL for classes as they change less frequently)
      teacherDataCache.set(CACHE_KEYS.CLASSES, grouped, 15 * 60 * 1000); // 15 minutes
      setClassesByGrade(grouped);
    } catch (error) {
      console.error("Failed to load classes:", error);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleToggleSubject = (subjectId: string, checked: boolean) => {
    onDraftChange((prev) => {
      if (checked) {
        if (prev.subjects.includes(subjectId)) return prev;
        return { ...prev, subjects: [...prev.subjects, subjectId] };
      } else {
        return { ...prev, subjects: prev.subjects.filter((id) => id !== subjectId) };
      }
    });
  };

  const handleSelectAllSubjects = () => {
    if (availableSubjects.length === 0) return;
    onDraftChange((prev) => ({ ...prev, subjects: availableSubjects.map((subject) => subject.id) }));
  };

  const handleClearSubjectSelection = () => {
    onDraftChange((prev) => ({ ...prev, subjects: [] }));
  };

  const handleToggleGradeLevel = (gradeLevel: string, checked: boolean) => {
    // Update expanded grades state outside of onDraftChange to avoid render issues
    if (checked) {
      setExpandedGrades((expanded) => new Set(expanded).add(gradeLevel));
    } else {
      setExpandedGrades((expanded) => {
        const newExpanded = new Set(expanded);
        newExpanded.delete(gradeLevel);
        return newExpanded;
      });
    }

    // Update draft state
    onDraftChange((prev) => {
      if (checked) {
        if (prev.gradeLevels.includes(gradeLevel)) return prev;
        // Initialize empty array for classes if not already set
        const newClasses = { ...prev.classes };
        if (!newClasses[gradeLevel]) {
          newClasses[gradeLevel] = [];
        }
        return {
          ...prev,
          gradeLevels: [...prev.gradeLevels, gradeLevel],
          classes: newClasses,
        };
      } else {
        // When deselecting a grade, deselect all its classes
        const newClasses = { ...prev.classes };
        delete newClasses[gradeLevel];
        return {
          ...prev,
          gradeLevels: prev.gradeLevels.filter((level) => level !== gradeLevel),
          classes: newClasses,
        };
      }
    });
  };

  const handleToggleClass = (gradeLevel: string, classId: string, checked: boolean) => {
    onDraftChange((prev) => {
      const gradeClasses = prev.classes[gradeLevel] || [];
      if (checked) {
        if (gradeClasses.includes(classId)) return prev;
        return {
          ...prev,
          classes: {
            ...prev.classes,
            [gradeLevel]: [...gradeClasses, classId],
          },
        };
      } else {
        return {
          ...prev,
          classes: {
            ...prev.classes,
            [gradeLevel]: gradeClasses.filter((id) => id !== classId),
          },
        };
      }
    });
  };

  const handleToggleGradeExpansion = (gradeLevel: string) => {
    setExpandedGrades((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(gradeLevel)) {
        newExpanded.delete(gradeLevel);
      } else {
        newExpanded.add(gradeLevel);
      }
      return newExpanded;
    });
  };

  const handleSelectAllGrades = () => {
    if (availableGradeLevels.length === 0) return;
    setExpandedGrades(new Set(availableGradeLevels));
    // Expand all grades but don't auto-select classes
    onDraftChange((prev) => {
      const newClasses = { ...prev.classes };
      availableGradeLevels.forEach((grade) => {
        if (!newClasses[grade]) {
          newClasses[grade] = [];
        }
      });
      return {
        ...prev,
        gradeLevels: availableGradeLevels,
        classes: newClasses,
      };
    });
  };

  const handleClearGradeSelection = () => {
    onDraftChange((prev) => ({
      ...prev,
      gradeLevels: [],
      classes: {},
    }));
    setExpandedGrades(new Set());
  };

  const handleDiscardDrafts = () => {
    onDraftChange(initialState);
    toast.success(tAssignments("draftsDiscardedMessage"));
  };

  const handleSaveDraft = () => {
    toast.success(tAssignments("saveDraftSuccess"));
    onOpenChange(false);
  };

  const filteredSubjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return availableSubjects;
    return availableSubjects.filter((subject) => {
      const english = subject.name?.toLowerCase() ?? "";
      const arabic = subject.name_ar?.toLowerCase() ?? "";
      return english.includes(normalizedSearch) || arabic.includes(normalizedSearch);
    });
  }, [availableSubjects, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {tAssignments("title")} - {teacherName}
          </DialogTitle>
          <DialogDescription>
            {tAssignments("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            {tAssignments("helperText")}
          </div>

          {/* Subjects */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="w-full space-y-1 md:w-1/2">
                <Label htmlFor="subject-search">
                  {tAssignments("searchLabel")}
                </Label>
                <Input
                  id="subject-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={tAssignments("searchPlaceholder")}
                  disabled={isLoadingSubjects}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSubjectSelection}
                  disabled={isLoadingSubjects || draftState.subjects.length === 0}
                >
                  {tAssignments("clearSelection")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllSubjects}
                  disabled={
                    isLoadingSubjects ||
                    draftState.subjects.length === availableSubjects.length ||
                    availableSubjects.length === 0
                  }
                >
                  {tAssignments("selectAll")}
                </Button>
              </div>
            </div>

            {isLoadingSubjects ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tAssignments("loadingSubjects")}
              </div>
            ) : availableSubjects.length === 0 ? (
              <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
                {tAssignments("noSubjectsAvailable")}
              </div>
            ) : (
              <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-border p-4">
                {filteredSubjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {tAssignments("noSubjectsMatch")}
                  </p>
                ) : (
                  filteredSubjects.map((subject) => (
                    <label
                      key={subject.id}
                      className="flex items-start gap-3 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded-md -mx-2"
                    >
                      <Checkbox
                        checked={draftState.subjects.includes(subject.id)}
                        onCheckedChange={(checked) =>
                          handleToggleSubject(subject.id, checked === true)
                        }
                        className="mt-1"
                      />
                      <span className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{subject.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {subject.name_ar || subject.name}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Grade levels */}
          <div className="space-y-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <Label className="text-sm font-semibold">
                  {tAssignments("gradeLevelsTitle")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {tAssignments("gradeLevelsHelper")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearGradeSelection}
                  disabled={isLoadingGrades || draftState.gradeLevels.length === 0}
                >
                  {tAssignments("clearYears")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllGrades}
                  disabled={
                    isLoadingGrades ||
                    availableGradeLevels.length === 0 ||
                    draftState.gradeLevels.length === availableGradeLevels.length
                  }
                >
                  {tAssignments("selectAllYears")}
                </Button>
              </div>
            </div>

            {isLoadingGrades ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tAssignments("loadingGradeLevels")}
              </div>
            ) : availableGradeLevels.length === 0 ? (
              <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
                {tAssignments("noGradeLevelsAvailable")}
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-md border border-border p-4 space-y-3">
                {availableGradeLevels
                  .sort((a, b) => {
                    const numA = parseInt(a.replace(/\D/g, "")) || 0;
                    const numB = parseInt(b.replace(/\D/g, "")) || 0;
                    return numA - numB;
                  })
                  .map((gradeLevel) => {
                    const classes = classesByGrade[gradeLevel] || [];
                    const isSelected = draftState.gradeLevels.includes(gradeLevel);
                    const isExpanded = expandedGrades.has(gradeLevel);
                    const selectedClassIds = draftState.classes[gradeLevel] || [];
                    
                    return (
                      <div
                        key={gradeLevel}
                        className={`rounded-md border ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/20"
                        }`}
                      >
                        <div className="p-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleToggleGradeLevel(gradeLevel, checked === true)
                              }
                            />
                            <button
                              type="button"
                              onClick={() => handleToggleGradeExpansion(gradeLevel)}
                              className="flex-1 flex items-center justify-between text-left hover:opacity-80 min-w-0"
                              disabled={classes.length === 0}
                            >
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span className="font-semibold text-sm whitespace-nowrap">
                                  {(() => {
                                    const gradeNum = gradeLevel.replace("Grade ", "").trim();
                                    return tAssignments("gradeLabel", { grade: gradeNum });
                                  })()}
                                </span>
                                {isSelected && (
                                  <span className="text-xs text-primary whitespace-nowrap">
                                    ({tAssignments("selected")})
                                  </span>
                                )}
                                {classes.length > 0 && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    ({classes.length} {tAssignments("classesInGrade")})
                                  </span>
                                )}
                              </div>
                              {classes.length > 0 && (
                                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                  {isExpanded ? "▼" : "▶"}
                                </span>
                              )}
                            </button>
                          </div>
                          
                          {isExpanded && classes.length > 0 && (
                            <div className="mt-3 ml-7 space-y-2 border-t border-border pt-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                {tAssignments("selectClasses")}:
                              </p>
                              <div className="space-y-2">
                                {classes.map((cls) => {
                                  const isClassSelected = selectedClassIds.includes(cls.id);
                                  return (
                                    <label
                                      key={cls.id}
                                      className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 p-1 rounded -mx-1"
                                    >
                                      <Checkbox
                                        checked={isClassSelected}
                                        onCheckedChange={(checked) =>
                                          handleToggleClass(gradeLevel, cls.id, checked === true)
                                        }
                                        disabled={!isSelected}
                                      />
                                      <span className="text-sm truncate">{cls.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {classes.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-2 ml-7">
                              {tAssignments("noClassesInGrade")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {hasChanges && (
          <div className="rounded-md border border-dashed border-primary/50 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">
              {tAssignments("draftIndicator")} - {tAssignments("draftSummaryHelper")}
            </p>
          </div>
        )}

        <DialogFooter className="pt-4">
          {hasChanges && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscardDrafts}
              className="mr-auto"
            >
              {tAssignments("discardDrafts")}
            </Button>
          )}
          {hasChanges && (
            <Button
              type="button"
              onClick={handleSaveDraft}
              className="bg-primary text-primary-foreground"
            >
              {tAssignments("saveSubjects")}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

