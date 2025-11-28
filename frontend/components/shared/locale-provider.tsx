"use client";

import { useEffect } from "react";

/**
 * Client component to set HTML attributes based on locale
 * Sets lang and dir attributes on document root
 */
export function LocaleProvider({
  locale,
  direction,
  className,
  children,
}: {
  locale: string;
  direction: "rtl" | "ltr";
  className: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Set HTML attributes
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.body.className = className;
  }, [locale, direction, className]);

  return <>{children}</>;
}

