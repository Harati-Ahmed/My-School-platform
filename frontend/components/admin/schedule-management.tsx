"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  getClassSchedule,
  getClassPeriods,
  upsertClassPeriods,
  upsertClassSchedules,
  getUsersByRole,
  getSubjects,
  type ClassPeriod,
  type ClassSchedule,
} from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { Loader2, Plus, Calendar, Clock } from "lucide-react";
import { ClassScheduleViewer } from "./class-schedule-viewer";
import { PeriodsManager } from "./periods-manager";

interface ScheduleManagementProps {
  classGroups: Record<
    string,
    Array<{
      id: string;
      name: string;
      grade_level: string;
      section?: string | null;
    }>
  >;
  periods: Array<{
    id: string;
    period_number: number;
    start_time: string;
    end_time: string;
    name?: string | null;
    is_break?: boolean;
    academic_year?: string | null;
  }>;
}

export function ScheduleManagement({
  classGroups,
  periods: initialPeriods,
}: ScheduleManagementProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const tSchedules = useTranslations("admin.schedules");
  const tScheduleDays = useTranslations("admin.schedules.days");
  
  const translateClassName = (className: string): string => {
    // Match "Grade X" or "Grade XA" pattern
    const gradeMatch = className.match(/^Grade\s+(\d+)([A-Z]?)/i);
    if (gradeMatch) {
      const gradeNumber = gradeMatch[1];
      const section = gradeMatch[2] || "";
      return tSchedules("gradeLabel", { number: gradeNumber, default: `Grade ${gradeNumber}` }) + section;
    }
    return className;
  };
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPeriodsManager, setShowPeriodsManager] = useState(false);
  const [periods, setPeriods] = useState(initialPeriods);

  useEffect(() => {
    if (selectedClassId && academicYear) {
      loadSchedule();
    } else {
      setSchedule([]);
    }
  }, [selectedClassId, academicYear]);

  useEffect(() => {
    // Reload periods when academic year changes to ensure defaults are created
    const loadPeriods = async () => {
      try {
        const result = await getClassPeriods(academicYear);
        if (result.error) {
          console.error("Failed to load periods:", result.error);
          return;
        }
        const loadedPeriods = result.data || [];
        // The server should ensure 6 periods exist, but if we have fewer, reload once more
        if (loadedPeriods.length > 0 && loadedPeriods.length < 6) {
          // Server should have created missing periods, reload to get them
          const retryResult = await getClassPeriods(academicYear);
          if (!retryResult.error && retryResult.data) {
            setPeriods(retryResult.data);
            return;
          }
        }
        setPeriods(loadedPeriods);
      } catch (error) {
        console.error("Failed to load periods:", error);
      }
    };
    loadPeriods();
  }, [academicYear]);

  const selectedClass =
    selectedYear && selectedClassId
      ? (classGroups[selectedYear] || []).find(
          (classItem) => classItem.id === selectedClassId
        )
      : undefined;

  const loadSchedule = async () => {
    if (!selectedClassId) return;
    setIsLoading(true);
    try {
      const result = await getClassSchedule(selectedClassId, academicYear);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSchedule(result.data || []);
    } catch (error) {
      console.error("Failed to load schedule:", error);
      toast.error("Failed to load schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodsUpdated = async (updatedPeriods: ClassPeriod[]) => {
    const result = await upsertClassPeriods(updatedPeriods);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Periods updated successfully");
    setPeriods(result.data || []);
    setShowPeriodsManager(false);
    if (selectedClassId) {
      await loadSchedule();
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {tSchedules("controlsTitle", { default: "Schedule Controls" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{tSchedules("academicYear")}</Label>
              <Input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2024-2025"
              />
            </div>
            <div className="space-y-2">
              <Label>{tSchedules("selectYear", { default: "Select Year" })}</Label>
              <Select
                value={selectedYear}
                onValueChange={(year) => {
                  setSelectedYear(year);
                  setSelectedClassId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tSchedules("selectYear", { default: "Select Year" })} />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(classGroups).map((year) => (
                    <SelectItem key={year} value={year}>
                      {translateClassName(year)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tSchedules("selectClass")}</Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                disabled={!selectedYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tSchedules("selectClass")} />
                </SelectTrigger>
                <SelectContent>
                  {(classGroups[selectedYear] || []).map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {translateClassName(classItem.name)}
                      {classItem.section && ` (${classItem.section})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tSchedules("actionsLabel", { default: "Actions" })}</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPeriodsManager(true)}
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {tSchedules("managePeriods")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Periods Manager */}
      {showPeriodsManager && (
        <PeriodsManager
          periods={periods}
          academicYear={academicYear}
          onClose={() => setShowPeriodsManager(false)}
          onSave={handlePeriodsUpdated}
        />
      )}

      {/* Schedule Viewer */}
      {selectedClassId && (
        <ClassScheduleViewer
          classId={selectedClassId}
          classGradeLevel={selectedClass?.grade_level}
          academicYear={academicYear}
          periods={periods}
          schedule={schedule}
          isLoading={isLoading}
          onScheduleUpdate={loadSchedule}
        />
      )}

      {!selectedClassId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {tSchedules("noClassSelected")}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {tSchedules("selectClassMessage")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

