import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getUsersByRole } from "@/lib/actions/admin";
import { HRManagement } from "@/components/admin/hr-management";

export default async function HRPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; search?: string }>;
}) {
  const t = await getTranslations();
  const params = await searchParams;
  const page = params?.page ? parseInt(params.page, 10) : 1;
  const search = params?.search;
  const hrResult = await getUsersByRole("hr", { page, pageSize: 50, search });

  const { data: hrUsers, pagination, error } = hrResult;

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("admin.hr.title")}</h1>
        <p className="text-destructive">{t("common.error")}: Failed to load HR users</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.hr.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.hr.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.hr.allHR")}</CardTitle>
        </CardHeader>
        <CardContent>
          <HRManagement initialHRUsers={hrUsers || []} />
        </CardContent>
      </Card>
    </div>
  );
}

