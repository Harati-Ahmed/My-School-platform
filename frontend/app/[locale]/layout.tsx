import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Tajawal } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { LocaleProvider } from "@/components/shared/locale-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";

// Arabic font - Tajawal supports Arabic and Latin characters
const tajawal = Tajawal({
  weight: ["400", "500", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
  display: "swap",
});

/**
 * Generate static params for all supported locales
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Locale-specific root layout
 * Handles:
 * - RTL/LTR direction based on locale
 * - Font loading
 * - Internationalization provider
 * - Theme provider
 * - Global toast notifications
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure valid locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Load messages for the locale
  const messages = await getMessages();

  // Determine text direction
  const direction = locale === "ar" ? "rtl" : "ltr";
  const bodyClassName = `${tajawal.variable} font-sans antialiased`;

  return (
    <LocaleProvider locale={locale} direction={direction} className={bodyClassName}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster
            position={direction === "rtl" ? "top-left" : "top-right"}
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
              },
              success: {
                iconTheme: {
                  primary: "hsl(var(--primary))",
                  secondary: "hsl(var(--primary-foreground))",
                },
              },
              error: {
                iconTheme: {
                  primary: "hsl(var(--destructive))",
                  secondary: "hsl(var(--destructive-foreground))",
                },
              },
            }}
          />
        </NextIntlClientProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}

