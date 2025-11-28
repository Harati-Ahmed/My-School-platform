"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { generateSchoolReportPDF } from "@/lib/pdf/react-pdf-generator";

interface PDFReportGeneratorProps {
  reportType: "class" | "school" | "student";
  data: any;
  schoolInfo: {
    nameEn: string;
    nameAr: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  locale?: "en" | "ar";
  className?: string;
  labels?: PdfReportLabels;
}

interface PDFSections {
  summary: boolean;
  topPerformers: boolean;
  needsAttention: boolean;
}

interface PdfReportLabels {
  title: string;
  classReport: string;
  schoolReport: string;
  studentReport: string;
  generating: string;
  generated: string;
  failed: string;
  unsupported: string;
  download: string;
  footer: string;
}

const DEFAULT_LABELS: PdfReportLabels = {
  title: "Generate PDF Report",
  classReport: "Class performance report",
  schoolReport: "Comprehensive school report",
  studentReport: "Student performance report",
  generating: "Generating…",
  generated: "PDF generated successfully",
  failed: "Failed to generate PDF",
  unsupported: "Report type not supported yet",
  download: "Download PDF",
  footer: "Download a comprehensive PDF report with attendance & performance data.",
};

export function PDFReportGenerator({
  reportType,
  data,
  schoolInfo,
  locale = "en",
  className,
  labels,
}: PDFReportGeneratorProps) {
  const strings = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels]
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState<PDFSections>({
    summary: true,
    topPerformers: true,
    needsAttention: true,
  });
  const [showOptions, setShowOptions] = useState(false);

  const isArabic = locale === "ar";

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      const toastId = toast.loading(strings.generating);

      if (reportType !== "school") {
        toast.dismiss(toastId);
        toast.error(strings.unsupported);
        return;
      }

      // Filter data based on selected sections
      const filteredData = {
        ...data,
        topPerformers: sections.topPerformers ? data.topPerformers : [],
        needsAttention: sections.needsAttention ? data.needsAttention : [],
      };

      const pdfGenerator = await generateSchoolReportPDF(
        filteredData,
        schoolInfo,
        locale,
        sections
      );
      
      // Trigger download
      pdfGenerator.download();

      toast.dismiss(toastId);
      toast.success(strings.generated);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.dismiss();
      toast.error(strings.failed);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {strings.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {reportType === "class" && strings.classReport}
                {reportType === "school" && strings.schoolReport}
                {reportType === "student" && strings.studentReport}
              </p>
            </div>
          </div>

          <Button onClick={handleGeneratePDF} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {strings.generating}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {strings.download}
              </>
            )}
          </Button>
        </div>

        {/* Data Sections Selector */}
        <div className="mt-4 space-y-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
            className="w-full"
          >
            {isArabic ? "اختر البيانات المطلوبة" : "Select Data Sections"}
          </Button>

          {showOptions && (
            <div className={`rounded-lg border bg-card p-4 space-y-3 ${isArabic ? 'rtl' : 'ltr'}`}>
              <div className={`flex items-center ${isArabic ? 'flex-row-reverse space-x-reverse' : 'space-x-2'}`}>
                <Checkbox
                  id="summary"
                  checked={sections.summary}
                  onCheckedChange={(checked) =>
                    setSections({ ...sections, summary: checked as boolean })
                  }
                />
                <Label
                  htmlFor="summary"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {isArabic ? "الملخص (الإحصائيات العامة)" : "Summary (General Statistics)"}
                </Label>
              </div>

              <div className={`flex items-center ${isArabic ? 'flex-row-reverse space-x-reverse' : 'space-x-2'}`}>
                <Checkbox
                  id="topPerformers"
                  checked={sections.topPerformers}
                  onCheckedChange={(checked) =>
                    setSections({ ...sections, topPerformers: checked as boolean })
                  }
                />
                <Label
                  htmlFor="topPerformers"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {isArabic ? "أفضل الطلاب أداءً" : "Top Performers"}
                </Label>
              </div>

              <div className={`flex items-center ${isArabic ? 'flex-row-reverse space-x-reverse' : 'space-x-2'}`}>
                <Checkbox
                  id="needsAttention"
                  checked={sections.needsAttention}
                  onCheckedChange={(checked) =>
                    setSections({ ...sections, needsAttention: checked as boolean })
                  }
                />
                <Label
                  htmlFor="needsAttention"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {isArabic ? "طلاب يحتاجون إلى اهتمام" : "Students Needing Attention"}
                </Label>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            {strings.footer}
          </p>
        </div>
      </div>
    </Card>
  );
}
