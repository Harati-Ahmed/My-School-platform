import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations, getLocale } from "next-intl/server";
import { getClasses, getSchoolSettings, getPDFReportData } from "@/lib/actions/admin";
import { ReportsGenerator } from "@/components/admin/reports-generator";
import { PDFReportGenerator } from "@/components/shared/pdf-report-generator";

export default async function ReportsPage() {
  const t = await getTranslations();
  const locale = await getLocale() as 'en' | 'ar';
  
  // Fetch all data in parallel for better performance
  const [
    { data: classes },
    { data: settings },
    { data: reportData }
  ] = await Promise.all([
    getClasses(),
    getSchoolSettings(),
    getPDFReportData()
  ]);

  const pdfLabels = {
    title: t("phase5.pdf.title"),
    classReport: t("phase5.pdf.classReport"),
    schoolReport: t("phase5.pdf.comprehensiveReport"),
    studentReport: t("phase5.pdf.studentReport"),
    generating: t("phase5.pdf.generating"),
    generated: t("phase5.pdf.generated"),
    failed: t("phase5.pdf.failed"),
    unsupported: t("phase5.pdf.unsupported"),
    download: t("phase5.pdf.download"),
    footer: t("phase5.pdf.footer"),
  };

  const schoolInfo = {
    nameEn: settings?.name || 'Tilmeedhy School',
    nameAr: settings?.name_ar || 'مدرسة تلميذي',
    address: typeof settings?.address === 'string' ? settings.address : '',
    phone: typeof settings?.contact_phone === 'string' ? settings.contact_phone : '',
    email: typeof settings?.contact_email === 'string' ? settings.contact_email : '',
    logo: settings?.logo_url || '',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.reports.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.reports.description")}
        </p>
      </div>

      {/* PDF Report Generator - Real data with full Arabic support using pdfmake */}
      {reportData && (
        <PDFReportGenerator
          reportType="school"
          data={reportData}
          schoolInfo={schoolInfo}
          locale={locale}
          labels={pdfLabels}
        />
      )}

      {!reportData && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              {t("admin.reports.noData")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* JSON Reports Generator */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.reports.generateReports")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportsGenerator classes={classes || []} />
        </CardContent>
      </Card>
    </div>
  );
}

