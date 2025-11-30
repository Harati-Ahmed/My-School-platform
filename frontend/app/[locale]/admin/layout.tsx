import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AccountMenu } from "@/components/shared/account-menu";
import { Home, Users, GraduationCap, School, BookOpen, Bell, BarChart, Settings, TrendingUp, Search, Calendar, Shield, FileText, CreditCard, CheckSquare, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

/**
 * Admin Dashboard Layout
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const t = await getTranslations();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const { data: userProfile, error } = await supabase
    .from("users")
    .select("role, name, email, school_id")
    .eq("id", user.id)
    .single();

  // If no profile exists, redirect to onboarding
  if (error || !userProfile) {
    redirect("/onboarding");
  }

  // If not admin, redirect to login
  if (userProfile.role !== "admin") {
    redirect("/login");
  }

  // Check if user is super admin
  const isSuperAdmin = userProfile.school_id === null;

  const navigation = [
    ...(isSuperAdmin ? [
      {
        name: t("admin.superAdmin.title"),
        href: "/admin/super-admin",
        icon: Shield,
      },
      {
        name: t("admin.superAdmin.allAdmins"),
        href: "/admin/super-admin/admins",
        icon: Users,
      },
      {
        name: t("admin.superAdmin.allUsers"),
        href: "/admin/super-admin/users",
        icon: Users,
      },
      {
        name: t("admin.superAdmin.platformAuditLogs"),
        href: "/admin/super-admin/audit-logs",
        icon: FileText,
      },
      {
        name: t("admin.superAdmin.subscriptionManagement"),
        href: "/admin/super-admin/subscriptions",
        icon: CreditCard,
      },
      {
        name: t("admin.superAdmin.bulkOperations"),
        href: "/admin/super-admin/bulk-operations",
        icon: CheckSquare,
      },
      {
        name: t("admin.superAdmin.dataExport"),
        href: "/admin/super-admin/data-export",
        icon: FileSpreadsheet,
      },
    ] : []),
    { name: t("common.dashboard"), href: "/admin/dashboard", icon: Home },
    { name: t("navigation.teachers"), href: "/admin/teachers", icon: Users },
    { name: t("navigation.parents"), href: "/admin/parents", icon: Users },
    { name: t("admin.hr.title"), href: "/admin/hr", icon: Users },
    { name: t("navigation.students"), href: "/admin/students", icon: GraduationCap },
    { name: t("navigation.classes"), href: "/admin/classes", icon: School },
    { name: t("navigation.subjects"), href: "/admin/subjects", icon: BookOpen },
    { name: t("admin.schedules.title") || "Schedules", href: "/admin/schedules", icon: Calendar },
    { name: t("admin.attendance.title"), href: "/admin/attendance", icon: Calendar },
    { name: t("navigation.announcements"), href: "/admin/announcements", icon: Bell },
    { name: t("phase5.analytics.title"), href: "/admin/analytics", icon: TrendingUp },
    { name: t("navigation.reports"), href: "/admin/reports", icon: BarChart },
    { name: t("common.settings"), href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold text-foreground">Tilmeedhy - Admin</h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <AccountMenu
              userInitial={userProfile.name?.charAt(0).toUpperCase() || "A"}
              userRole="admin"
              userName={userProfile.name || undefined}
              userEmail={userProfile.email || user.email || undefined}
            />
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="hidden md:flex md:flex-col w-64 bg-card border-r border-border">
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

