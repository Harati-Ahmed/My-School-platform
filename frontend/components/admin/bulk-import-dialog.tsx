"use client";

import { useState } from "react";
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
import { bulkImportStudents } from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { Upload, Download, Loader2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Bulk Import Dialog for importing students from CSV
 */

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const downloadTemplate = () => {
    const csvContent = [
      "name,student_id_number,date_of_birth,gender,medical_info",
      "Ahmed Mohamed,ST001,2015-05-15,male,No allergies",
      "Fatima Ali,ST002,2016-08-20,female,Asthma medication required",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error(tAdmin("selectCSVFile"));
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());
    
    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const student: any = {};
      
      headers.forEach((header, index) => {
        student[header] = values[index] || "";
      });
      
      // Validate required fields
      if (student.name && student.date_of_birth && student.gender) {
        students.push(student);
      }
    }
    
    return students;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error(tAdmin("selectFile"));
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();
      const students = parseCSV(text);

      if (students.length === 0) {
        toast.error(tAdmin("noValidStudents"));
        return;
      }

      const result = await bulkImportStudents(students);

      if (result.error) {
        throw result.error;
      }

      toast.success(tAdmin("importSuccess").replace("{count}", result.count?.toString() || "0"));
      setFile(null);
      onOpenChange(false);
      router.refresh(); // Refresh to show new students
    } catch (error) {
      console.error("Error importing students:", error);
      toast.error(tAdmin("importError"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{tAdmin("bulkImportStudents")}</DialogTitle>
          <DialogDescription>
            {tAdmin("uploadCSVDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="p-4 border border-dashed rounded-lg">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{tAdmin("downloadTemplate")}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {tAdmin("downloadTemplateDesc")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="mt-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {tAdmin("downloadTemplate")}
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="p-4 border border-dashed rounded-lg">
            <div className="flex items-start gap-3">
              <Upload className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{tAdmin("uploadCSVFile")}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {tAdmin("selectCSVDesc")}
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="mt-2 text-sm"
                  disabled={isUploading}
                />
                {file && (
                  <p className="text-sm text-green-600 mt-2">
                    {tAdmin("selected")}: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-primary/10 rounded-lg">
            <h4 className="font-medium text-sm mb-2">{tAdmin("csvFormatRequirements")}:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• {tAdmin("requiredFields")}: name, date_of_birth, gender</li>
              <li>• {tAdmin("genderRequirement")}</li>
              <li>• {tAdmin("dateFormatRequirement")}</li>
              <li>• {tAdmin("optionalFields")}: student_id_number, medical_info</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleImport} disabled={!file || isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tAdmin("importStudents")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

