"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Server Actions for Onboarding
 * These actions allow users without profiles to create schools and complete onboarding
 */

/**
 * Create a school during onboarding
 * Uses service role key to bypass RLS since user doesn't have a profile yet
 */
export async function createSchoolOnboarding(formData: {
  name: string;
  name_ar?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
}) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "User not authenticated" };
    }

    // Use service role client to bypass RLS for onboarding
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return { data: null, error: "Service role key not configured" };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return { data: null, error: "Supabase URL not configured" };
    }

    const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create school
    const { data: school, error: schoolError } = await serviceClient
      .from("schools")
      .insert({
        name: formData.name,
        name_ar: formData.name_ar || formData.name,
        contact_email: formData.contact_email || user.email || "",
        contact_phone: formData.contact_phone || "",
        address: formData.address,
        subscription_status: "active",
        is_active: true,
      })
      .select("id")
      .single();

    if (schoolError) {
      console.error("Failed to create school:", schoolError);
      return { data: null, error: schoolError.message };
    }

    return { data: school, error: null };
  } catch (error: any) {
    console.error("Error creating school during onboarding:", error);
    return { data: null, error: error.message || "Failed to create school" };
  }
}

/**
 * Create user profile during onboarding
 */
export async function createUserProfileOnboarding(formData: {
  name: string;
  phone?: string;
  language_preference: "ar" | "en";
  theme_preference: "light" | "dark" | "system";
  role: "admin" | "teacher" | "parent" | "hr";
  school_id?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "User not authenticated" };
    }

    // Use service role client to bypass RLS for onboarding
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return { data: null, error: "Service role key not configured" };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return { data: null, error: "Supabase URL not configured" };
    }

    const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user profile
    // Note: If the create_audit_log function is missing, the trigger will fail
    // The user needs to run the migration: 20241207_create_audit_log_function.sql
    const { data: profile, error: profileError } = await serviceClient
      .from("users")
      .insert({
        id: user.id,
        name: formData.name,
        email: user.email || "",
        phone: formData.phone,
        role: formData.role,
        school_id: formData.school_id || null,
        language_preference: formData.language_preference,
        theme_preference: formData.theme_preference,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Failed to create user profile:", profileError);
      
      // If error is about missing function, provide helpful message with migration instructions
      if (profileError.message?.includes('create_audit_log') || 
          profileError.message?.includes('function') && profileError.message?.includes('does not exist')) {
        return { 
          data: null, 
          error: "Database configuration error: The audit log function is missing. Please run the migration SQL in your Supabase dashboard. See: frontend/supabase/migrations/20241207_create_audit_log_function.sql" 
        };
      }
      
      return { data: null, error: profileError.message };
    }

    return { data: profile, error: null };
  } catch (error: any) {
    console.error("Error creating user profile during onboarding:", error);
    return { data: null, error: error.message || "Failed to create profile" };
  }
}

