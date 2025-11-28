import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AccountMenu } from "@/components/shared/account-menu";
import { Home, Users, BookOpen, GraduationCap, Calendar, FileText, Bell, BarChart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { TeacherMobileNav } from "@/components/teacher/mobile-nav";

/**
 * Teacher Dashboard Layout
 */
export default async function TeacherLayout({
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
    .select("role, name, email")
    .eq("id", user.id)
    .single();

  if (error || !userProfile || userProfile.role !== "teacher") redirect("/login");

  const navigation = [
    { name: t("common.dashboard"), href: "/teacher/dashboard", iconName: "Home" },
    { name: t("navigation.classes"), href: "/teacher/classes", iconName: "Users" },
    { name: t("navigation.homework"), href: "/teacher/homework", iconName: "BookOpen" },
    { name: t("navigation.grades"), href: "/teacher/grades", iconName: "GraduationCap" },
    { name: t("navigation.attendance"), href: "/teacher/attendance", iconName: "Calendar" },
    { name: t("navigation.teacherNotes"), href: "/teacher/notes", iconName: "FileText" },
    { name: t("navigation.reports"), href: "/teacher/reports", iconName: "BarChart" },
    { name: t("common.settings"), href: "/teacher/settings", iconName: "Settings" },
  ];

  const iconMap = {
    Home,
    Users,
    BookOpen,
    GraduationCap,
    Calendar,
    FileText,
    BarChart,
    Settings,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <TeacherMobileNav navigation={navigation} />
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
            <h1 className="text-xl font-bold text-foreground">Tilmeedhy - Teacher</h1>
          </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <AccountMenu
              userInitial={userProfile.name?.charAt(0).toUpperCase() || "T"}
              userRole="teacher"
              userName={userProfile.name || undefined}
              userEmail={userProfile.email || user.email || undefined}
            />
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="hidden md:flex md:flex-col w-64 bg-card border-r border-border">
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const IconComponent = iconMap[item.iconName as keyof typeof iconMap];
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors"
                >
                  {IconComponent && <IconComponent className="h-5 w-5" />}
                  <span>{item.name}</span>
                </Link>
              );
            })}
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

