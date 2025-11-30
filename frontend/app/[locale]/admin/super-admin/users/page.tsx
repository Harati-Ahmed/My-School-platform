import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getAllUsers } from "@/lib/actions/super-admin";
import { AllUsersManagement } from "@/components/admin/all-users-management";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AllUsersPage() {
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
  
  const usersResult = await getAllUsers();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.superAdmin.allUsersTitle")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.superAdmin.allUsersDescription")}
        </p>
      </div>

      <AllUsersManagement initialUsers={usersResult.data || []} />
    </div>
  );
}

