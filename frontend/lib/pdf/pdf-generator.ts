import type { Content, StyleDictionary, TDocumentDefinitions } from "pdfmake/interfaces";

let pdfMakeInstance: any = null;
let vfsInitialized = false;

async function getPdfMake() {
  if (typeof window === "undefined") {
    throw new Error("pdfMake can only be used in the browser");
  }

  if (!pdfMakeInstance) {
    // Use dynamic import with explicit path to avoid Turbopack issues
    const [pdfMakeModule, pdfFontsModule, amiriFont] = await Promise.all([
      import("pdfmake/build/pdfmake"),
      import("pdfmake/build/vfs_fonts").catch(() => ({ default: {} })),
      import("@/lib/pdf/fonts/amiri").catch(() => ({ AMIRI_REGULAR_BASE64: null })),
    ]);

    const pdfMake = (pdfMakeModule as any).default || (pdfMakeModule as any);
    const pdfFonts = (pdfFontsModule as any).default || (pdfFontsModule as any) || {};
    const { AMIRI_REGULAR_BASE64 } = amiriFont;

    // Create a completely custom VFS - don't rely on pdfmake's VFS structure
    // This works better with Turbopack's dynamic imports
    const customVfs: Record<string, string> = {};

    // Try to get default fonts from pdfmake, but don't fail if they're not available
    try {
      const defaultVfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || pdfFonts || {};
      if (typeof defaultVfs === 'object' && Object.keys(defaultVfs).length > 0) {
        Object.assign(customVfs, defaultVfs);
      }
    } catch (e) {
      console.warn("Could not load default pdfmake fonts, using custom VFS only:", e);
    }

    // Add Amiri font to VFS
    if (AMIRI_REGULAR_BASE64 && typeof AMIRI_REGULAR_BASE64 === 'string' && AMIRI_REGULAR_BASE64.length > 100) {
      customVfs["Amiri-Regular.ttf"] = AMIRI_REGULAR_BASE64;
    } else {
      console.error("Invalid Amiri font base64 string");
      throw new Error("Invalid Amiri font base64 string");
    }

    // Set VFS directly - this is the key fix for Turbopack
    // Use Object.assign to ensure VFS is properly set
    pdfMake.vfs = {};
    Object.assign(pdfMake.vfs, customVfs);

    // Force verify VFS is set correctly
    if (!pdfMake.vfs || typeof pdfMake.vfs !== 'object') {
      pdfMake.vfs = customVfs;
    }

    // Verify font is in VFS
    if (!pdfMake.vfs["Amiri-Regular.ttf"]) {
      console.error("VFS keys:", Object.keys(pdfMake.vfs || {}));
      console.error("Failed to register Amiri font in VFS");
      // Try one more time with direct assignment
      pdfMake.vfs["Amiri-Regular.ttf"] = customVfs["Amiri-Regular.ttf"];
      if (!pdfMake.vfs["Amiri-Regular.ttf"]) {
        throw new Error("Failed to register Amiri font in VFS");
      }
    }

    vfsInitialized = true;
    if (process.env.NODE_ENV === "development") {
      console.log("Amiri font registered successfully. VFS has", Object.keys(pdfMake.vfs).length, "fonts");
    }

    // Register font definitions - must reference files in VFS
    pdfMake.fonts = {
      ...(pdfMake.fonts || {}),
      Amiri: {
        normal: "Amiri-Regular.ttf",
        bold: "Amiri-Regular.ttf",
        italics: "Amiri-Regular.ttf",
        bolditalics: "Amiri-Regular.ttf",
      },
      // Use Roboto if available, otherwise fallback to built-in fonts
      Roboto: pdfMake.fonts?.Roboto || (customVfs["Roboto-Regular.ttf"] ? {
        normal: "Roboto-Regular.ttf",
        bold: "Roboto-Medium.ttf",
        italics: "Roboto-Italic.ttf",
        bolditalics: "Roboto-MediumItalic.ttf",
      } : undefined),
    };

    // If Roboto is not available, use built-in fonts
    if (!pdfMake.fonts.Roboto) {
      pdfMake.fonts.Roboto = {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      };
    }

    // Verify fonts are registered
    if (!pdfMake.fonts?.Amiri) {
      console.error("Failed to register Amiri font definition");
      throw new Error("Failed to register Amiri font definition");
    }

    pdfMakeInstance = pdfMake;
  }

  return pdfMakeInstance;
}

interface SchoolInfo {
  nameEn: string;
  nameAr: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

interface SchoolReportData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  averageAttendance: number;
  averageGrade: number;
  topPerformers: Array<{
    id: string;
    name: string;
    class: string;
    averageGrade: number;
  }>;
  needsAttention: Array<{
    id: string;
    name: string;
    class: string;
    attendanceRate: number;
    averageGrade: number;
  }>;
}

const createStyles = (isArabic: boolean): StyleDictionary => ({
  header: {
    fontSize: 22,
    bold: true,
    color: "#1e40af",
    alignment: isArabic ? "right" : "left",
    margin: [0, 0, 0, 10],
  },
  contact: {
    fontSize: 10,
    color: "#6b7280",
    alignment: isArabic ? "right" : "left",
    margin: [0, 0, 0, 20],
  },
  sectionTitle: {
    fontSize: 16,
    bold: true,
    alignment: isArabic ? "right" : "left",
    margin: [0, 20, 0, 10],
    color: "#1f2937",
  },
  tableHeader: {
    fontSize: 12,
    bold: true,
    fillColor: "#3b82f6",
    color: "white",
    alignment: isArabic ? "right" : "left",
  },
  tableCell: {
    fontSize: 10,
    alignment: isArabic ? "right" : "left",
  },
  footer: {
    fontSize: 9,
    color: "#6b7280",
    alignment: "center",
    margin: [0, 30, 0, 0],
  },
});

interface PDFSections {
  summary?: boolean;
  topPerformers?: boolean;
  needsAttention?: boolean;
}

export async function generateSchoolReportPDF(
  data: SchoolReportData,
  schoolInfo: SchoolInfo,
  locale: "en" | "ar",
  sections?: PDFSections
) {
  const pdfMake = await getPdfMake();
  const isArabic = locale === "ar";
  
  // Default sections - include all if not specified
  const selectedSections: PDFSections = {
    summary: sections?.summary !== false,
    topPerformers: sections?.topPerformers !== false,
    needsAttention: sections?.needsAttention !== false,
  };

  // Ensure VFS is set right before creating PDF
  // This is critical for Turbopack compatibility
  if (!pdfMake.vfs || !vfsInitialized) {
    console.warn("VFS not initialized, re-initializing...");
    pdfMakeInstance = null;
    vfsInitialized = false;
    const refreshedPdfMake = await getPdfMake();
    if (!refreshedPdfMake.vfs || !refreshedPdfMake.vfs["Amiri-Regular.ttf"]) {
      console.error("VFS keys after refresh:", Object.keys(refreshedPdfMake.vfs || {}));
      throw new Error("PDF font system not initialized");
    }
    return generateSchoolReportPDF(data, schoolInfo, locale, sections);
  }

  // Double-check Amiri font is available for Arabic
  if (isArabic && !pdfMake.vfs["Amiri-Regular.ttf"]) {
    console.error("Amiri font not found in VFS. Available fonts:", Object.keys(pdfMake.vfs));
    // Try to re-add it directly
    const { AMIRI_REGULAR_BASE64 } = await import("@/lib/pdf/fonts/amiri");
    if (AMIRI_REGULAR_BASE64) {
      pdfMake.vfs["Amiri-Regular.ttf"] = AMIRI_REGULAR_BASE64;
    }
    if (!pdfMake.vfs["Amiri-Regular.ttf"]) {
      throw new Error("Failed to register Amiri font in VFS");
    }
  }

  const styles = createStyles(isArabic);

  const currentDate = new Date().toLocaleDateString(
    isArabic ? "ar-SA" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const labels = isArabic
    ? {
        title: "تقرير المدرسة الشامل",
        date: "التاريخ",
        statistics: "الإحصائيات العامة",
        metric: "المؤشر",
        value: "القيمة",
        totalStudents: "إجمالي الطلاب",
        totalTeachers: "إجمالي المعلمين",
        totalClasses: "إجمالي الفصول",
        averageAttendance: "متوسط الحضور",
        averageGrade: "متوسط الدرجات",
        topPerformers: "أفضل الطلاب أداءً",
        studentName: "اسم الطالب",
        class: "الفصل",
        needsAttention: "طلاب يحتاجون إلى اهتمام",
        attendanceRate: "نسبة الحضور",
        footer: "هذا التقرير تم إنشاؤه تلقائياً بواسطة نظام تلميذي",
      }
    : {
        title: "Comprehensive School Report",
        date: "Date",
        statistics: "General Statistics",
        metric: "Metric",
        value: "Value",
        totalStudents: "Total Students",
        totalTeachers: "Total Teachers",
        totalClasses: "Total Classes",
        averageAttendance: "Average Attendance",
        averageGrade: "Average Grade",
        topPerformers: "Top Performing Students",
        studentName: "Student Name",
        class: "Class",
        needsAttention: "Students Needing Attention",
        attendanceRate: "Attendance Rate",
        footer: "This report was automatically generated by Tilmeedhy System",
      };

  const contactInfo = [
    schoolInfo.address,
    schoolInfo.phone,
    schoolInfo.email,
  ]
    .filter(Boolean)
    .join(" | ");

  const statisticsTable: Content = {
    table: {
      widths: ["*", "auto"],
      body: [
        [
          { text: labels.metric, style: "tableHeader" },
          { text: labels.value, style: "tableHeader" },
        ],
        [
          { text: labels.totalStudents, style: "tableCell" },
          { text: String(data.totalStudents), style: "tableCell" },
        ],
        [
          { text: labels.totalTeachers, style: "tableCell" },
          { text: String(data.totalTeachers), style: "tableCell" },
        ],
        [
          { text: labels.totalClasses, style: "tableCell" },
          { text: String(data.totalClasses), style: "tableCell" },
        ],
        [
          { text: labels.averageAttendance, style: "tableCell" },
          { text: `${data.averageAttendance.toFixed(1)}%`, style: "tableCell" },
        ],
        [
          { text: labels.averageGrade, style: "tableCell" },
          { text: `${data.averageGrade.toFixed(1)}%`, style: "tableCell" },
        ],
      ],
    },
    layout: "lightHorizontalLines",
    margin: [0, 0, 0, 20],
  };

  const topPerformersTable: Content | null =
    data.topPerformers && data.topPerformers.length > 0
      ? {
          table: {
            widths: ["*", "*", "auto"],
            body: [
              [
                { text: labels.studentName, style: "tableHeader" },
                { text: labels.class, style: "tableHeader" },
                { text: labels.averageGrade, style: "tableHeader" },
              ],
              ...data.topPerformers.map((student) => [
                { text: student.name, style: "tableCell" },
                { text: student.class, style: "tableCell" },
                {
                  text: `${(student.averageGrade ?? 0).toFixed(1)}%`,
                  style: "tableCell",
                },
              ]),
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 20],
        }
      : null;

  const needsAttentionTable: Content | null =
    data.needsAttention && data.needsAttention.length > 0
      ? {
          table: {
            widths: ["*", "*", "auto", "auto"],
            body: [
              [
                { text: labels.studentName, style: "tableHeader" },
                { text: labels.class, style: "tableHeader" },
                { text: labels.attendanceRate, style: "tableHeader" },
                { text: labels.averageGrade, style: "tableHeader" },
              ],
              ...data.needsAttention.map((student) => [
                { text: student.name, style: "tableCell" },
                { text: student.class, style: "tableCell" },
                {
                  text: `${(student.attendanceRate ?? 0).toFixed(1)}%`,
                  style: "tableCell",
                },
                {
                  text: `${(student.averageGrade ?? 0).toFixed(1)}%`,
                  style: "tableCell",
                },
              ]),
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 20],
        }
      : null;

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      font: isArabic ? "Amiri" : "Roboto",
      alignment: isArabic ? "right" : "left",
    },
    content: [
      { text: isArabic ? schoolInfo.nameAr : schoolInfo.nameEn, style: "header" },
      contactInfo ? { text: contactInfo, style: "contact" } : { text: "" },
      { text: labels.title, style: "sectionTitle" },
      {
        columns: isArabic
          ? [
              { text: `${labels.date}: ${currentDate}`, style: "tableCell" },
              { text: "", width: "auto" },
            ]
          : [
              { text: "", width: "auto" },
              { text: `${labels.date}: ${currentDate}`, style: "tableCell" },
            ],
        margin: [0, -10, 0, 10],
      },
      ...(selectedSections.summary ? [
        { text: labels.statistics, style: "sectionTitle" },
        statisticsTable,
      ] : []),
      ...(selectedSections.topPerformers && topPerformersTable ? [
        { text: labels.topPerformers, style: "sectionTitle" },
        topPerformersTable
      ] : []),
      ...(selectedSections.needsAttention && needsAttentionTable ? [
        { text: labels.needsAttention, style: "sectionTitle" },
        needsAttentionTable
      ] : []),
      { text: labels.footer, style: "footer" },
    ],
    styles,
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  
  // Return an object with download method for compatibility
  return {
    download: (filename?: string) => {
      pdfDoc.download(filename || `school-report-${new Date().toISOString().split("T")[0]}.pdf`);
    },
  };
}
