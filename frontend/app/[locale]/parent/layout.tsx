import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AccountMenu } from "@/components/shared/account-menu";
import { NotificationDropdown } from "@/components/parent/notification-dropdown";
import { Home, Users, BookOpen, GraduationCap, Calendar, FileText, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

/**
 * Parent Dashboard Layout
 * Includes sidebar navigation for desktop and bottom navigation for mobile
 */
export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const t = await getTranslations();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Verify user is a parent
  const { data: userProfile, error } = await supabase
    .from("users")
    .select("role, name, email")
    .eq("id", user.id)
    .single();

  // If no profile exists, redirect to onboarding
  if (error || !userProfile) {
    redirect("/onboarding");
  }

  // If not parent, redirect to login
  if (userProfile.role !== "parent") {
    redirect("/login");
  }

  const navigation = [
    { name: t("common.dashboard"), href: "/parent/dashboard", icon: Home },
    { name: t("navigation.myChildren"), href: "/parent/children", icon: Users },
    { name: t("navigation.homework"), href: "/parent/homework", icon: BookOpen },
    { name: t("navigation.grades"), href: "/parent/grades", icon: GraduationCap },
    { name: t("navigation.attendance"), href: "/parent/attendance", icon: Calendar },
    { name: t("navigation.teacherNotes"), href: "/parent/notes", icon: FileText },
    { name: t("navigation.announcements"), href: "/parent/announcements", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <Link href="/parent/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold text-foreground">Tilmeedhy</h1>
          </Link>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <NotificationDropdown />
            <AccountMenu
              userInitial={userProfile.name?.charAt(0).toUpperCase() || "P"}
              userRole="parent"
              userName={userProfile.name || undefined}
              userEmail={userProfile.email || user.email || undefined}
            />
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Desktop */}
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
          
          <div className="p-4 border-t border-border">
            <Link
              href="/parent/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>{t("common.settings")}</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around p-2">
          {navigation.slice(0, 5).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground hover:text-primary"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

