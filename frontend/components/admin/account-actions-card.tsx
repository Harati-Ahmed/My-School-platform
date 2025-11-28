"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";

/**
 * Account actions card for admin settings.
 * Provides a consistent sign-out experience across roles.
 */
export function AdminAccountActionsCard() {
  const supabase = createClient();
  const router = useRouter();
  const tAdminSettings = useTranslations("admin.settings");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success(tAuth("logoutSuccess"));
      router.push("/login");
    } catch (error) {
      console.error("Failed to sign out admin user:", error);
      toast.error(tAdminSettings("logoutError"));
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">{tAdminSettings("accountActions")}</CardTitle>
        <CardDescription>{tAdminSettings("logoutDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleSignOut}
          variant="destructive"
          className="w-full"
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? tCommon("loading") : tCommon("logout")}
        </Button>
      </CardContent>
    </Card>
  );
}


