import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getAllSchools } from "@/lib/actions/super-admin";
import { SubscriptionManagement } from "@/components/admin/subscription-management";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SubscriptionsPage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
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
  
  const schoolsResult = await getAllSchools();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.superAdmin.subscriptionManagement")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.superAdmin.subscriptionManagementDescription")}
        </p>
      </div>

      <SubscriptionManagement initialSchools={schoolsResult.data || []} />
    </div>
  );
}

