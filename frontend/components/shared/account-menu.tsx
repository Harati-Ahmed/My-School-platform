"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface AccountMenuProps {
  userInitial: string;
  userRole: "teacher" | "admin" | "parent" | "hr";
  userName?: string;
  userEmail?: string;
}

/**
 * Account Menu Component
 * Provides dropdown menu with profile options
 */
export function AccountMenu({ userInitial, userRole, userName, userEmail }: AccountMenuProps) {
  const router = useRouter();
  const t = useTranslations();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSettingsPath = () => {
    switch (userRole) {
      case "teacher":
        return "/teacher/settings";
      case "admin":
        return "/admin/settings";
      case "parent":
        return "/parent/settings";
      case "hr":
        return "/hr/settings";
      default:
        return "/settings";
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case "teacher":
        return "bg-primary hover:bg-primary/90";
      case "admin":
        return "bg-primary hover:bg-primary/90";
      case "parent":
        return "bg-primary hover:bg-primary/90";
      default:
        return "bg-primary hover:bg-primary/90";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative h-10 px-2 rounded-full hover:bg-accent transition-all",
            "flex items-center gap-2"
          )}
        >
          <div className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm",
            "ring-2 ring-background shadow-sm transition-all",
            getRoleColor()
          )}>
            {userInitial}
          </div>
          {userName && (
            <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
              {userName}
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50 hidden sm:block" />
          <span className="sr-only">Open account menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm",
              "ring-2 ring-border shadow-sm",
              getRoleColor()
            )}>
              {userInitial}
            </div>
            <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
              {userName && (
                <p className="text-sm font-semibold leading-none truncate">
                  {userName}
                </p>
              )}
              {userEmail && (
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {userEmail}
                </p>
              )}
              <p className="text-xs leading-none text-muted-foreground capitalize mt-1">
                {userRole}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          onClick={() => router.push(getSettingsPath())}
          className="cursor-pointer px-3 py-2.5 rounded-md"
        >
          <User className="mr-3 h-4 w-4" />
          <span>{t("common.profile")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(getSettingsPath())}
          className="cursor-pointer px-3 py-2.5 rounded-md"
        >
          <Settings className="mr-3 h-4 w-4" />
          <span>{t("common.settings")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={loading}
          className="cursor-pointer px-3 py-2.5 rounded-md text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>{loading ? t("common.loading") : t("common.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

