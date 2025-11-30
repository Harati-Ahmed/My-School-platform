import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getSchoolStatistics } from "@/lib/actions/super-admin";
import { SchoolStatisticsDashboard } from "@/components/admin/school-statistics-dashboard";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SchoolStatisticsPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const t = await getTranslations();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { id } = await params;
  
  // Check if user is super admin
  if (!user) redirect("/login");
  
  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();
  
  const isSuperAdmin = userProfile?.school_id === null;
  
  if (!isSuperAdmin) {
    redirect("/admin/dashboard");
  }
  
  const statsResult = await getSchoolStatistics(id);
  
  if (statsResult.error || !statsResult.data) {
    notFound();
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/super-admin/schools/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {t("admin.superAdmin.schoolStatistics")} - {statsResult.data.school.name}
          </h1>
          {statsResult.data.school.name_ar && (
            <p className="text-muted-foreground mt-1">{statsResult.data.school.name_ar}</p>
          )}
        </div>
      </div>

      <SchoolStatisticsDashboard statistics={statsResult.data} />
    </div>
  );
}

