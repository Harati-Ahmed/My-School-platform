"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

interface ReportGeneratorProps {
  classId: string;
  classes: any[];
}

export function ReportGenerator({ classId, classes }: ReportGeneratorProps) {
  const t = useTranslations();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState<"comprehensive" | "grades" | "attendance">("comprehensive");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const selectedClass = classes.find((c: any) => c.id === classId);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // In a real implementation, this would call an API to generate a PDF
      // For now, we'll just simulate the download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a simple text report
      const reportContent = `
Class Report - ${selectedClass?.name}
Generated: ${new Date().toLocaleDateString()}
Date Range: ${dateRange.start} to ${dateRange.end}
Report Type: ${reportType}

This is a placeholder report. In production, this would be a properly formatted PDF
containing detailed information about grades, attendance, and student performance.
      `;
      
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `class-report-${selectedClass?.name}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teacher.reports.reportConfig")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("teacher.reports.selectedClass")}</Label>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="font-medium">{selectedClass?.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedClass?.studentCount} {t("teacher.classes.students")} • {selectedClass?.grade_level}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("teacher.reports.reportType")}</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                onClick={() => setReportType("comprehensive")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  reportType === "comprehensive"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-secondary"
                }`}
              >
                <p className="font-medium">{t("teacher.reports.comprehensive")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("teacher.reports.allData")}
                </p>
              </button>
              <button
                onClick={() => setReportType("grades")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  reportType === "grades"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-secondary"
                }`}
              >
                <p className="font-medium">{t("teacher.reports.gradesOnly")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("teacher.reports.gradeReports")}
                </p>
              </button>
              <button
                onClick={() => setReportType("attendance")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  reportType === "attendance"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-secondary"
                }`}
              >
                <p className="font-medium">{t("teacher.reports.attendanceOnly")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("teacher.reports.attendanceRecords")}
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">{t("teacher.reports.startDate")}</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">{t("teacher.reports.endDate")}</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teacher.reports.reportInclude")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(reportType === "comprehensive" || reportType === "grades") && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t("teacher.reports.gradeInfo")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("teacher.reports.gradeInfoDesc")}
                  </p>
                </div>
              </div>
            )}

            {(reportType === "comprehensive" || reportType === "attendance") && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t("teacher.reports.attendanceRecords")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("teacher.reports.attendanceDesc")}
                  </p>
                </div>
              </div>
            )}

            {reportType === "comprehensive" && (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t("teacher.reports.studentInfo")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("teacher.reports.studentInfoDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t("teacher.reports.teacherNotes")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("teacher.reports.teacherNotesDesc")}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">{t("teacher.reports.readyToGenerate")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("teacher.reports.downloadPDF")}
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? (
                <>{t("teacher.reports.generating")}</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {t("teacher.reports.generateReport")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

