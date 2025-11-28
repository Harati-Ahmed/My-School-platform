import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "./i18n/routing";

/**
 * Middleware for authentication and internationalization
 * Handles:
 * 1. Session refresh (Supabase)
 * 2. Route protection based on user role
 * 3. Language detection and routing (next-intl)
 */

// Public routes that don't require authentication
const publicRoutes = ["/login", "/reset-password", "/", "/onboarding"];

// Role-based route prefixes
const roleRoutes = {
  admin: ["/admin"],
  teacher: ["/teacher"],
  parent: ["/parent"],
  hr: ["/hr"],
};

export default async function middleware(request: NextRequest) {
  // First, handle Supabase auth session refresh
  const { supabaseResponse, user, supabase } = await updateSession(request);
  
  const pathname = request.nextUrl.pathname;
  
  // Get locale from pathname (e.g., /ar/dashboard or /en/dashboard)
  const pathnameLocale = pathname.split("/")[1];
  const isValidLocale = ["ar", "en"].includes(pathnameLocale);
  
  // Extract the actual path without locale
  const pathWithoutLocale = isValidLocale 
    ? pathname.replace(`/${pathnameLocale}`, "") || "/"
    : pathname;
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathWithoutLocale === route || pathWithoutLocale.startsWith(route + "/")
  );
  
  // Redirect to login if not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const loginUrl = new URL(`/${pathnameLocale || "en"}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If authenticated and trying to access login or root, check if profile exists
  if (user && (pathWithoutLocale === "/login" || pathWithoutLocale === "/")) {
    try {
      // Fetch user profile from database
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      
      // If no profile exists, redirect to onboarding
      if (profileError || !userProfile) {
        const onboardingPath = `/${pathnameLocale || "en"}/onboarding`;
        return NextResponse.redirect(new URL(onboardingPath, request.url));
      }
      
      // User has profile, redirect to dashboard
      const role = userProfile.role;
      const dashboardPath = `/${pathnameLocale || "en"}/${role}/dashboard`;
      
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    } catch (error) {
      console.error("Error fetching user role:", error);
      // If error, redirect to onboarding to be safe
      const onboardingPath = `/${pathnameLocale || "en"}/onboarding`;
      return NextResponse.redirect(new URL(onboardingPath, request.url));
    }
  }

  // Check if user is trying to access protected routes without a profile
  if (user && !isPublicRoute && pathWithoutLocale !== "/onboarding") {
    try {
      const { data: userProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      
      // If no profile, redirect to onboarding
      if (!userProfile) {
        const onboardingPath = `/${pathnameLocale || "en"}/onboarding`;
        return NextResponse.redirect(new URL(onboardingPath, request.url));
      }
    } catch (error) {
      // If error checking profile, allow through (will be caught by layout)
    }
  }
  
  // Handle internationalization with next-intl
  const intlMiddleware = createMiddleware(routing);
  const response = intlMiddleware(request);
  
  // Merge Supabase cookies with intl response
  if (supabaseResponse.cookies.getAll().length > 0) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });
  }
  
  return response;
}

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - _next (Next.js internals)
  // - Static files
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};

