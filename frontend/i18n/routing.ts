import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

/**
 * Internationalization routing configuration
 * Supports Arabic (RTL) and English (LTR)
 */
export const routing = defineRouting({
  // Supported locales
  locales: ["ar", "en"],
  
  // Default locale
  defaultLocale: "ar",
  
  // Locale prefix strategy
  localePrefix: "always",
});

// Create typed navigation functions
export const { Link, redirect, usePathname, useRouter } = 
  createNavigation(routing);

