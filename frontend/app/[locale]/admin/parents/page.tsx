import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getUsersByRole } from "@/lib/actions/admin";
import { ParentsManagement } from "@/components/admin/parents-management";

export default async function ParentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; search?: string }>;
}) {
  const t = await getTranslations();
  const params = await searchParams;
  const page = params?.page ? parseInt(params.page, 10) : 1;
  const search = params?.search;
  const { data: parents, pagination, error } = await getUsersByRole("parent", { page, pageSize: 50, search });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t("admin.parents.title")}</h1>
        <p className="text-destructive">{t("common.error")}: Failed to load parents</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.parents.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.parents.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.parents.allParents")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ParentsManagement initialParents={parents || []} />
        </CardContent>
      </Card>
    </div>
  );
}

