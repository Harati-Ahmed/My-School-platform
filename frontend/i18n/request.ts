import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Configuration for loading messages on each request
 * This runs on the server for each request
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request, falling back to default
  let locale = await requestLocale;

  // Ensure valid locale
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

