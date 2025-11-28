"use client";

import { useParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

/**
 * Language Switcher Component
 * Toggles between Arabic and English on click
 */
export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;

  const toggleLanguage = () => {
    const newLocale = currentLocale === "en" ? "ar" : "en";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="relative"
      title={currentLocale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      <Globe className="h-5 w-5" />
      <span className="absolute -top-1 -right-1 text-xs font-semibold">
        {currentLocale === "en" ? "EN" : "AR"}
      </span>
      <span className="sr-only">Switch language</span>
    </Button>
  );
}

