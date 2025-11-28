"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, X } from "lucide-react";
import { type ClassPeriod } from "@/lib/actions/admin";
import { useTranslations } from "next-intl";

interface PeriodsManagerProps {
  periods: Array<{
    id: string;
    period_number: number;
    start_time: string;
    end_time: string;
    name?: string | null;
    is_break?: boolean;
    academic_year?: string | null;
  }>;
  academicYear: string;
  onClose: () => void;
  onSave: (periods: ClassPeriod[]) => void;
}

export function PeriodsManager({
  periods: initialPeriods,
  academicYear,
  onClose,
  onSave,
}: PeriodsManagerProps) {
  const tSchedules = useTranslations("admin.schedules");
  const tPeriods = useTranslations("admin.schedules.periods");
  
  const [periods, setPeriods] = useState<ClassPeriod[]>(
    initialPeriods.length > 0
      ? initialPeriods.map((p) => ({
          id: p.id,
          period_number: p.period_number,
          start_time: p.start_time,
          end_time: p.end_time,
          name: p.name || undefined,
          is_break: p.is_break || false,
          academic_year: academicYear,
        }))
      : Array.from({ length: 6 }, (_, i) => {
          const periodNum = i + 1;
          const startHour = 8 + i; // 08:00, 09:00, 10:00, 11:00, 12:00, 13:00
          const endHour = startHour + 1;
          return {
            period_number: periodNum,
            start_time: `${String(startHour).padStart(2, "0")}:00`,
            end_time: `${String(endHour).padStart(2, "0")}:00`,
            name: tSchedules("periodLabel", { number: periodNum, default: `Period ${periodNum}` }),
            is_break: false,
            academic_year: academicYear,
          };
        })
  );

  const addPeriod = () => {
    const nextNumber = periods.length > 0 
      ? Math.max(...periods.map((p) => p.period_number)) + 1
      : 1;
    setPeriods([
      ...periods,
      {
        period_number: nextNumber,
        start_time: "09:00",
        end_time: "10:00",
        name: tSchedules("periodLabel", { number: nextNumber, default: `Period ${nextNumber}` }),
        is_break: false,
        academic_year: academicYear,
      },
    ]);
  };

  const removePeriod = (index: number) => {
    setPeriods(periods.filter((_, i) => i !== index));
  };

  const updatePeriod = (index: number, field: keyof ClassPeriod, value: any) => {
    const updated = [...periods];
    updated[index] = { ...updated[index], [field]: value };
    setPeriods(updated);
  };

  const handleSave = () => {
    // Validate periods
    for (const period of periods) {
      if (!period.start_time || !period.end_time) {
        alert(tPeriods("fillAllFields", { default: "Please fill in all time fields" }));
        return;
      }
      if (period.start_time >= period.end_time) {
        alert(tPeriods("startBeforeEnd", { default: "Start time must be before end time" }));
        return;
      }
    }
    onSave(periods);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{tPeriods("title")}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {tPeriods("description")}
            </p>
            <Button onClick={addPeriod} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {tPeriods("addPeriod")}
            </Button>
          </div>

          <div className="space-y-3">
            {periods.map((period, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-1">
                      <Label>{tPeriods("periodNumber")}</Label>
                      <Input
                        type="number"
                        value={period.period_number}
                        onChange={(e) =>
                          updatePeriod(
                            index,
                            "period_number",
                            parseInt(e.target.value) || 0
                          )
                        }
                        min={1}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>{tPeriods("startTime")}</Label>
                      <Input
                        type="time"
                        value={period.start_time}
                        onChange={(e) =>
                          updatePeriod(index, "start_time", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>{tPeriods("endTime")}</Label>
                      <Input
                        type="time"
                        value={period.end_time}
                        onChange={(e) =>
                          updatePeriod(index, "end_time", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-4">
                      <Label>{tPeriods("name")}</Label>
                      <Input
                        type="text"
                        value={period.name || ""}
                        onChange={(e) =>
                          updatePeriod(index, "name", e.target.value)
                        }
                        placeholder={tPeriods("namePlaceholder", { default: "e.g., Period 1, Break, Lunch" })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>
                        <input
                          type="checkbox"
                          checked={period.is_break || false}
                          onChange={(e) =>
                            updatePeriod(index, "is_break", e.target.checked)
                          }
                          className="mr-2"
                        />
                        {tPeriods("isBreak")}
                      </Label>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePeriod(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              {tSchedules("cancel")}
            </Button>
            <Button onClick={handleSave}>{tPeriods("savePeriods")}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

