import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/**
 * Homepage - Landing page for the platform
 * Redirects users to appropriate dashboards based on their role
 */
export default function HomePage() {
  const t = useTranslations("common");

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Language and Theme Toggle */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <h1 className="text-xl font-bold text-foreground">Tilmeedhy - تلميذي</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">
              {t("landingTitle")}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {t("landingTagline")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              {t("landingIntro")}
            </p>
            <Link href="/login" className="block">
              <Button className="w-full" size="lg">
                {t("login")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

