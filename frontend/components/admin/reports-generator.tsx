"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { generateSchoolReport } from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { Loader2, Download, FileText } from "lucide-react";
import { format } from "date-fns";

/**
 * Reports Generator Component
 */

interface ReportsGeneratorProps {
  classes: Array<{ id: string; name: string; grade_level: string }>;
}

export function ReportsGenerator({ classes }: ReportsGeneratorProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const result = await generateSchoolReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        classId: selectedClass && selectedClass !== "all" ? selectedClass : undefined,
      });

      if (result.error || !result.data) {
        throw new Error("Failed to generate report");
      }

      // Convert report to JSON and download
      const reportData = JSON.stringify(result.data, null, 2);
      const blob = new Blob([reportData], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `school_report_${format(new Date(), "yyyy-MM-dd")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(tAdmin("generatedSuccessfully"));
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(tAdmin("failedToGenerate"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = async () => {
    setIsGenerating(true);

    try {
      const result = await generateSchoolReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        classId: selectedClass && selectedClass !== "all" ? selectedClass : undefined,
      });

      if (result.error || !result.data) {
        throw new Error("Failed to generate report");
      }

      // Convert students data to CSV
      const students = result.data.students || [];
      const headers = ["Name", "Student ID", "Class", "Parent", "Date of Birth", "Gender"];
      const rows = students.map((student: any) => [
        student.name,
        student.student_id_number || "",
        student.class?.name || "",
        student.parent?.name || "",
        student.date_of_birth,
        student.gender,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: string[]) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students_report_${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(tAdmin("exportedSuccessfully"));
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error(tAdmin("failedToExport"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">{t("date")} {t("start")}</Label>
          <Input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">{t("date")} {t("end")}</Label>
          <Input
            id="end_date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="class">{t("filter")} {tAdmin("class")}</Label>
          <Select
            value={selectedClass}
            onValueChange={setSelectedClass}
            disabled={isGenerating}
          >
            <SelectTrigger>
              <SelectValue placeholder={tAdmin("allClasses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tAdmin("allClasses")}</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - {cls.grade_level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("generating")}
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              {tAdmin("generateFullReport")}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("exporting")}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {tAdmin("exportStudentsCSV")}
            </>
          )}
        </Button>
      </div>

      <div className="p-4 border border-dashed rounded-lg bg-muted/50">
        <h3 className="font-medium mb-2">محتويات التقرير:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• معلومات وإحصائيات المدرسة</li>
          <li>• جميع الفصول والمواد</li>
          <li>• بيانات الطلاب (مُصفاة حسب التاريخ/الفصل إن تم اختياره)</li>
          <li>• سجلات الحضور (مُصفاة حسب التاريخ/الفصل إن تم اختياره)</li>
          <li>• سجلات الدرجات (مُصفاة حسب الفصل إن تم اختياره)</li>
        </ul>
      </div>
    </div>
  );
}

