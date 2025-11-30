"use server";

import { createServiceRoleClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Super Admin Server Actions
 * These actions allow super admin to manage schools and admins
 * Uses service role to bypass RLS
 */

/**
 * Check if current user is super admin
 */
async function checkSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role, school_id, email")
    .eq("id", user.id)
    .single();

  if (!userProfile || userProfile.role !== "admin" || userProfile.school_id !== null) {
    throw new Error("Unauthorized: Super admin access required");
  }

  return { userId: user.id, email: userProfile.email || user.email || "" };
}

/**
 * Get platform-wide statistics (all schools aggregated)
 */
export async function getPlatformStats() {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    // Get all schools count (active and inactive)
    const { count: totalSchools } = await serviceClient
      .from("schools")
      .select("*", { count: "exact", head: true });
    
    const { count: activeSchools } = await serviceClient
      .from("schools")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Get all users by role
    const [
      { count: totalAdmins },
      { count: totalTeachers },
      { count: totalParents },
      { count: totalHR },
    ] = await Promise.all([
      serviceClient.from("users").select("*", { count: "exact", head: true }).eq("role", "admin").eq("is_active", true),
      serviceClient.from("users").select("*", { count: "exact", head: true }).eq("role", "teacher").eq("is_active", true),
      serviceClient.from("users").select("*", { count: "exact", head: true }).eq("role", "parent").eq("is_active", true),
      serviceClient.from("users").select("*", { count: "exact", head: true }).eq("role", "hr").eq("is_active", true),
    ]);

    // Get all students
    const { count: totalStudents } = await serviceClient
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Get all classes
    const { count: totalClasses } = await serviceClient
      .from("classes")
      .select("*", { count: "exact", head: true });

    // Get all subjects
    const { count: totalSubjects } = await serviceClient
      .from("subjects")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Get recent schools (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: recentSchools } = await serviceClient
      .from("schools")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString())
      .eq("is_active", true);

    return {
      data: {
        totalSchools: totalSchools || 0,
        activeSchools: activeSchools || 0,
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        totalParents: totalParents || 0,
        totalAdmins: totalAdmins || 0,
        totalHR: totalHR || 0,
        totalClasses: totalClasses || 0,
        totalSubjects: totalSubjects || 0,
        recentSchools: recentSchools || 0,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Failed to get platform stats:", error);
    return { data: null, error: error.message || "Failed to get platform stats" };
  }
}

/**
 * Get all schools with their stats (super admin only)
 */
export async function getAllSchools() {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    const { data: schools, error } = await serviceClient
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get actual counts for each school
    const schoolsWithStats = await Promise.all(
      (schools || []).map(async (school) => {
        const [
          { count: adminCount },
          { count: studentCount },
          { count: teacherCount },
          { count: classCount },
        ] = await Promise.all([
          serviceClient
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id)
            .eq("role", "admin")
            .eq("is_active", true),
          serviceClient
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id)
            .eq("is_active", true),
          serviceClient
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id)
            .eq("role", "teacher")
            .eq("is_active", true),
          serviceClient
            .from("classes")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id),
        ]);

        return {
          ...school,
          stats: {
            admins: adminCount || 0,
            students: studentCount || 0,
            teachers: teacherCount || 0,
            classes: classCount || 0,
          },
        };
      })
    );

    return { data: schoolsWithStats, error: null };
  } catch (error: any) {
    console.error("Failed to get schools:", error);
    return { data: null, error: error.message || "Failed to get schools" };
  }
}

/**
 * Create a new school (super admin only)
 */
export async function createSchool(formData: {
  name: string;
  name_ar?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  logo_url?: string;
  theme_color?: string;
  subscription_status?: "active" | "trial" | "expired" | "canceled";
  subscription_plan?: string;
  subscription_end?: string;
  max_students?: number;
  max_teachers?: number;
  timezone?: string;
  is_active?: boolean;
}) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    const { data: school, error } = await serviceClient
      .from("schools")
      .insert({
        name: formData.name,
        name_ar: formData.name_ar || formData.name,
        contact_email: formData.contact_email || "",
        contact_phone: formData.contact_phone || "",
        address: formData.address,
        logo_url: formData.logo_url,
        theme_color: formData.theme_color || "#3B82F6",
        subscription_status: formData.subscription_status || "trial",
        subscription_plan: formData.subscription_plan || "basic",
        subscription_end: formData.subscription_end || null,
        max_students: formData.max_students || 100,
        max_teachers: formData.max_teachers || 10,
        timezone: formData.timezone || "Africa/Tripoli",
        is_active: formData.is_active !== undefined ? formData.is_active : true,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/super-admin");
    return { data: school, error: null };
  } catch (error: any) {
    console.error("Failed to create school:", error);
    return { data: null, error: error.message || "Failed to create school" };
  }
}

/**
 * Update a school (super admin only)
 */
export async function updateSchool(
  schoolId: string,
  formData: {
    name?: string;
    name_ar?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    logo_url?: string;
    theme_color?: string;
    subscription_status?: "active" | "trial" | "expired" | "canceled";
    subscription_plan?: string;
    subscription_end?: string;
    max_students?: number;
    max_teachers?: number;
    timezone?: string;
    is_active?: boolean;
  }
) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    const updateData: any = {};
    if (formData.name !== undefined) updateData.name = formData.name;
    if (formData.name_ar !== undefined) updateData.name_ar = formData.name_ar;
    if (formData.contact_email !== undefined) updateData.contact_email = formData.contact_email;
    if (formData.contact_phone !== undefined) updateData.contact_phone = formData.contact_phone;
    if (formData.address !== undefined) updateData.address = formData.address;
    if (formData.logo_url !== undefined) updateData.logo_url = formData.logo_url;
    if (formData.theme_color !== undefined) updateData.theme_color = formData.theme_color;
    if (formData.subscription_status !== undefined) updateData.subscription_status = formData.subscription_status;
    if (formData.subscription_plan !== undefined) updateData.subscription_plan = formData.subscription_plan;
    if (formData.subscription_end !== undefined) updateData.subscription_end = formData.subscription_end || null;
    if (formData.max_students !== undefined) updateData.max_students = formData.max_students;
    if (formData.max_teachers !== undefined) updateData.max_teachers = formData.max_teachers;
    if (formData.timezone !== undefined) updateData.timezone = formData.timezone;
    if (formData.is_active !== undefined) updateData.is_active = formData.is_active;

    const { data: school, error } = await serviceClient
      .from("schools")
      .update(updateData)
      .eq("id", schoolId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/super-admin");
    return { data: school, error: null };
  } catch (error: any) {
    console.error("Failed to update school:", error);
    return { data: null, error: error.message || "Failed to update school" };
  }
}

/**
 * Delete or deactivate a school (super admin only)
 */
export async function deleteSchool(schoolId: string, hardDelete: boolean = false) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    if (hardDelete) {
      // Hard delete - actually remove from database
      const { error } = await serviceClient
        .from("schools")
        .delete()
        .eq("id", schoolId);

      if (error) throw error;
    } else {
      // Soft delete - just deactivate
      const { error } = await serviceClient
        .from("schools")
        .update({ is_active: false })
        .eq("id", schoolId);

      if (error) throw error;
    }

    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/super-admin");
    return { error: null };
  } catch (error: any) {
    console.error("Failed to delete school:", error);
    return { error: error.message || "Failed to delete school" };
  }
}

/**
 * Create an admin user for a school (super admin only)
 */
export async function createSchoolAdmin(formData: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  school_id: string;
}) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    // Create auth user
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: formData.email,
      password: formData.password || Math.random().toString(36).slice(-8),
      email_confirm: true,
    });

    if (authError) throw authError;

    // Create user profile
    const { data: user, error: userError } = await serviceClient
      .from("users")
      .insert({
        id: authData.user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: "admin",
        school_id: formData.school_id,
        is_active: true,
      })
      .select()
      .single();

    if (userError) throw userError;

    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/super-admin");
    return { data: user, error: null };
  } catch (error: any) {
    console.error("Failed to create school admin:", error);
    return { data: null, error: error.message || "Failed to create school admin" };
  }
}

/**
 * Update a school admin (super admin only)
 */
export async function updateSchoolAdmin(
  adminId: string,
  formData: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    is_active?: boolean;
  }
) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    // Update auth user if email or password changed
    if (formData.email || formData.password) {
      const updateAuthData: any = {};
      if (formData.email) updateAuthData.email = formData.email;
      if (formData.password) updateAuthData.password = formData.password;

      const { error: authError } = await serviceClient.auth.admin.updateUserById(
        adminId,
        updateAuthData
      );

      if (authError) throw authError;
    }

    // Update user profile
    const updateData: any = {};
    if (formData.name !== undefined) updateData.name = formData.name;
    if (formData.email !== undefined) updateData.email = formData.email;
    if (formData.phone !== undefined) updateData.phone = formData.phone;
    if (formData.is_active !== undefined) updateData.is_active = formData.is_active;

    const { data: user, error: userError } = await serviceClient
      .from("users")
      .update(updateData)
      .eq("id", adminId)
      .select()
      .single();

    if (userError) throw userError;

    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/super-admin");
    return { data: user, error: null };
  } catch (error: any) {
    console.error("Failed to update school admin:", error);
    return { data: null, error: error.message || "Failed to update school admin" };
  }
}

/**
 * Delete or deactivate a school admin (super admin only)
 */
export async function deleteSchoolAdmin(adminId: string, hardDelete: boolean = false) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    if (hardDelete) {
      // Hard delete - remove auth user and profile
      const { error: authError } = await serviceClient.auth.admin.deleteUser(adminId);
      if (authError) throw authError;
    } else {
      // Soft delete - just deactivate
      const { error } = await serviceClient
        .from("users")
        .update({ is_active: false })
        .eq("id", adminId);

      if (error) throw error;
    }

    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/super-admin");
    return { error: null };
  } catch (error: any) {
    console.error("Failed to delete school admin:", error);
    return { error: error.message || "Failed to delete school admin" };
  }
}

/**
 * Get all admins across all schools (super admin only)
 */
export async function getAllAdmins() {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    const { data: admins, error } = await serviceClient
      .from("users")
      .select(`
        *,
        school:schools(id, name, name_ar)
      `)
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: admins, error: null };
  } catch (error: any) {
    console.error("Failed to get admins:", error);
    return { data: null, error: error.message || "Failed to get admins" };
  }
}

/**
 * Get admins for a specific school (super admin only)
 */
export async function getSchoolAdmins(schoolId: string) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    const { data: admins, error } = await serviceClient
      .from("users")
      .select("*")
      .eq("role", "admin")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: admins, error: null };
  } catch (error: any) {
    console.error("Failed to get school admins:", error);
    return { data: null, error: error.message || "Failed to get school admins" };
  }
}

/**
 * Transfer an admin from one school to another (super admin only)
 */
export async function transferAdmin(adminId: string, newSchoolId: string | null) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    // Get current admin info
    const { data: admin, error: adminError } = await serviceClient
      .from("users")
      .select("id, name, email, school_id")
      .eq("id", adminId)
      .eq("role", "admin")
      .single();

    if (adminError || !admin) {
      throw new Error("Admin not found");
    }

    const oldSchoolId = admin.school_id;

    // Update admin's school_id
    const { data: updatedAdmin, error: updateError } = await serviceClient
      .from("users")
      .update({
        school_id: newSchoolId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", adminId)
      .select()
      .single();

    if (updateError) throw updateError;

    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/super-admin");
    revalidatePath("/admin/super-admin/admins");
    if (oldSchoolId) {
      revalidatePath(`/admin/super-admin/schools/${oldSchoolId}`);
    }
    if (newSchoolId) {
      revalidatePath(`/admin/super-admin/schools/${newSchoolId}`);
    }

    return { data: updatedAdmin, error: null };
  } catch (error: any) {
    console.error("Failed to transfer admin:", error);
    return { data: null, error: error.message || "Failed to transfer admin" };
  }
}

/**
 * Get all users (teachers, parents, HR) across all schools (super admin only)
 */
export async function getAllUsers(role?: "teacher" | "parent" | "hr") {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    let query = serviceClient
      .from("users")
      .select(`
        *,
        school:schools(id, name, name_ar)
      `)
      .in("role", role ? [role] : ["teacher", "parent", "hr"])
      .order("created_at", { ascending: false });

    const { data: users, error } = await query;

    if (error) throw error;
    return { data: users, error: null };
  } catch (error: any) {
    console.error("Failed to get users:", error);
    return { data: null, error: error.message || "Failed to get users" };
  }
}

/**
 * Get platform-wide audit logs with advanced filtering (super admin only)
 */
export async function getPlatformAuditLogs(filters?: {
  schoolId?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    let query = serviceClient
      .from("audit_logs")
      .select(`
        *,
        user:users(id, name, role, email),
        school:schools(id, name, name_ar)
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.schoolId) {
      query = query.eq("school_id", filters.schoolId);
    }

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }

    if (filters?.action) {
      query = query.eq("action", filters.action);
    }

    if (filters?.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(500); // Default limit for platform-wide view
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Failed to get platform audit logs:", error);
    return { data: null, error: error.message || "Failed to get platform audit logs" };
  }
}

/**
 * Bulk update schools (activate/deactivate) (super admin only)
 */
export async function bulkUpdateSchools(
  schoolIds: string[],
  updates: {
    is_active?: boolean;
    subscription_status?: "active" | "trial" | "expired" | "canceled";
  }
) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    if (schoolIds.length === 0) {
      return { data: null, error: "No schools selected" };
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.subscription_status !== undefined)
      updateData.subscription_status = updates.subscription_status;

    const { data, error } = await serviceClient
      .from("schools")
      .update(updateData)
      .in("id", schoolIds)
      .select();

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/admin/super-admin");
    return { data, error: null };
  } catch (error: any) {
    console.error("Failed to bulk update schools:", error);
    return { data: null, error: error.message || "Failed to bulk update schools" };
  }
}

/**
 * Bulk update users (activate/deactivate) (super admin only)
 */
export async function bulkUpdateUsers(
  userIds: string[],
  updates: {
    is_active?: boolean;
  }
) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    if (userIds.length === 0) {
      return { data: null, error: "No users selected" };
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { data, error } = await serviceClient
      .from("users")
      .update(updateData)
      .in("id", userIds)
      .select();

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/admin/super-admin");
    return { data, error: null };
  } catch (error: any) {
    console.error("Failed to bulk update users:", error);
    return { data: null, error: error.message || "Failed to bulk update users" };
  }
}

/**
 * Export schools data to CSV format (super admin only)
 */
export async function exportSchoolsData() {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    const { data: schools, error } = await serviceClient
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Convert to CSV format
    const headers = [
      "ID",
      "Name",
      "Name (Arabic)",
      "Contact Email",
      "Contact Phone",
      "Address",
      "Subscription Status",
      "Subscription Plan",
      "Subscription End",
      "Max Students",
      "Max Teachers",
      "Timezone",
      "Is Active",
      "Created At",
    ];

    const rows = (schools || []).map((school) => [
      school.id,
      school.name || "",
      school.name_ar || "",
      school.contact_email || "",
      school.contact_phone || "",
      school.address || "",
      school.subscription_status || "",
      school.subscription_plan || "",
      school.subscription_end || "",
      school.max_students || "",
      school.max_teachers || "",
      school.timezone || "",
      school.is_active ? "Yes" : "No",
      school.created_at || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return { data: csvContent, error: null };
  } catch (error: any) {
    console.error("Failed to export schools data:", error);
    return { data: null, error: error.message || "Failed to export schools data" };
  }
}

/**
 * Export users data to CSV format (super admin only)
 */
export async function exportUsersData(role?: "admin" | "teacher" | "parent" | "hr") {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    let query = serviceClient
      .from("users")
      .select(`
        *,
        school:schools(id, name, name_ar)
      `)
      .in("role", role ? [role] : ["admin", "teacher", "parent", "hr"])
      .order("created_at", { ascending: false });

    const { data: users, error } = await query;

    if (error) throw error;

    // Convert to CSV format
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Role",
      "School Name",
      "School Name (Arabic)",
      "Is Active",
      "Last Login",
      "Created At",
    ];

    const rows = (users || []).map((user) => [
      user.id,
      user.name || "",
      user.email || "",
      user.phone || "",
      user.role || "",
      (user.school as any)?.name || "",
      (user.school as any)?.name_ar || "",
      user.is_active ? "Yes" : "No",
      user.last_login || "",
      user.created_at || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return { data: csvContent, error: null };
  } catch (error: any) {
    console.error("Failed to export users data:", error);
    return { data: null, error: error.message || "Failed to export users data" };
  }
}

/**
 * Export platform statistics report to CSV format (super admin only)
 */
export async function exportPlatformStatsReport() {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    // Get all schools with their stats
    const { data: schools, error: schoolsError } = await serviceClient
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });

    if (schoolsError) throw schoolsError;

    // Get stats for each school
    const schoolsWithStats = await Promise.all(
      (schools || []).map(async (school) => {
        const [
          { count: adminCount },
          { count: studentCount },
          { count: teacherCount },
          { count: parentCount },
          { count: hrCount },
          { count: classCount },
        ] = await Promise.all([
          serviceClient
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id)
            .eq("role", "admin")
            .eq("is_active", true),
          serviceClient
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id)
            .eq("is_active", true),
          serviceClient
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id)
            .eq("role", "teacher")
            .eq("is_active", true),
          serviceClient
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id)
            .eq("role", "parent")
            .eq("is_active", true),
          serviceClient
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id)
            .eq("role", "hr")
            .eq("is_active", true),
          serviceClient
            .from("classes")
            .select("*", { count: "exact", head: true })
            .eq("school_id", school.id),
        ]);

        return {
          ...school,
          stats: {
            admins: adminCount || 0,
            students: studentCount || 0,
            teachers: teacherCount || 0,
            parents: parentCount || 0,
            hr: hrCount || 0,
            classes: classCount || 0,
          },
        };
      })
    );

    // Convert to CSV format
    const headers = [
      "School Name",
      "School Name (Arabic)",
      "Contact Email",
      "Subscription Status",
      "Subscription Plan",
      "Admins",
      "Students",
      "Teachers",
      "Parents",
      "HR",
      "Classes",
      "Is Active",
      "Created At",
    ];

    const rows = schoolsWithStats.map((school) => [
      school.name || "",
      school.name_ar || "",
      school.contact_email || "",
      school.subscription_status || "",
      school.subscription_plan || "",
      school.stats.admins,
      school.stats.students,
      school.stats.teachers,
      school.stats.parents,
      school.stats.hr,
      school.stats.classes,
      school.is_active ? "Yes" : "No",
      school.created_at || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return { data: csvContent, error: null };
  } catch (error: any) {
    console.error("Failed to export platform stats:", error);
    return { data: null, error: error.message || "Failed to export platform stats" };
  }
}

/**
 * Get detailed school statistics for analytics dashboard (super admin only)
 */
export async function getSchoolStatistics(schoolId: string) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    // Get school info
    const { data: school, error: schoolError } = await serviceClient
      .from("schools")
      .select("*")
      .eq("id", schoolId)
      .single();

    if (schoolError) throw schoolError;
    if (!school) throw new Error("School not found");

    // Get last 6 months for trends
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get student growth over time (monthly)
    const { data: students } = await serviceClient
      .from("students")
      .select("created_at")
      .eq("school_id", schoolId)
      .gte("created_at", sixMonthsAgo.toISOString());

    // Get attendance trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: attendance } = await serviceClient
      .from("attendance")
      .select("date, status")
      .eq("school_id", schoolId)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

    // Get grade distribution
    const { data: grades } = await serviceClient
      .from("grades")
      .select("percentage")
      .eq("school_id", schoolId)
      .not("percentage", "is", null);

    // Get user growth over time
    const { data: users } = await serviceClient
      .from("users")
      .select("created_at, role")
      .eq("school_id", schoolId)
      .gte("created_at", sixMonthsAgo.toISOString());

    // Process data for charts
    const monthlyStudentGrowth = processMonthlyData(students || [], "created_at");
    const monthlyUserGrowth = processMonthlyDataByRole(users || []);
    const attendanceTrends = processAttendanceTrends(attendance || []);
    const gradeDistribution = processGradeDistribution(grades || []);

    // Get current stats
    const [
      { count: adminCount },
      { count: studentCount },
      { count: teacherCount },
      { count: parentCount },
      { count: classCount },
      { count: subjectCount },
    ] = await Promise.all([
      serviceClient
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "admin")
        .eq("is_active", true),
      serviceClient
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("is_active", true),
      serviceClient
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "teacher")
        .eq("is_active", true),
      serviceClient
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "parent")
        .eq("is_active", true),
      serviceClient
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId),
      serviceClient
        .from("subjects")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("is_active", true),
    ]);

    return {
      data: {
        school,
        currentStats: {
          admins: adminCount || 0,
          students: studentCount || 0,
          teachers: teacherCount || 0,
          parents: parentCount || 0,
          classes: classCount || 0,
          subjects: subjectCount || 0,
        },
        charts: {
          studentGrowth: monthlyStudentGrowth,
          userGrowth: monthlyUserGrowth,
          attendanceTrends,
          gradeDistribution,
        },
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Failed to get school statistics:", error);
    return { data: null, error: error.message || "Failed to get school statistics" };
  }
}

// Helper functions for data processing
function processMonthlyData(data: any[], dateField: string) {
  const months: Record<string, number> = {};
  const now = new Date();
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months[key] = 0;
  }

  // Count by month
  data.forEach((item) => {
    const date = new Date(item[dateField]);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (months.hasOwnProperty(key)) {
      months[key]++;
    }
  });

  // Convert to array format
  return Object.entries(months).map(([month, count]) => ({
    month: month.split("-")[1] + "/" + month.split("-")[0].slice(2),
    count,
  }));
}

function processMonthlyDataByRole(users: any[]) {
  const months: Record<string, { teachers: number; parents: number; hr: number }> = {};
  const now = new Date();
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months[key] = { teachers: 0, parents: 0, hr: 0 };
  }

  // Count by month and role
  users.forEach((user) => {
    const date = new Date(user.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (months.hasOwnProperty(key)) {
      if (user.role === "teacher") months[key].teachers++;
      if (user.role === "parent") months[key].parents++;
      if (user.role === "hr") months[key].hr++;
    }
  });

  // Convert to array format
  return Object.entries(months).map(([month, counts]) => ({
    month: month.split("-")[1] + "/" + month.split("-")[0].slice(2),
    ...counts,
  }));
}

function processAttendanceTrends(attendance: any[]) {
  const daily: Record<string, { present: number; absent: number; late: number }> = {};
  
  attendance.forEach((record) => {
    const date = record.date;
    if (!daily[date]) {
      daily[date] = { present: 0, absent: 0, late: 0 };
    }
    if (record.status === "present") daily[date].present++;
    if (record.status === "absent") daily[date].absent++;
    if (record.status === "late") daily[date].late++;
  });

  return Object.entries(daily)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30) // Last 30 days
    .map(([date, counts]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ...counts,
    }));
}

function processGradeDistribution(grades: any[]) {
  const distribution = {
    excellent: 0, // 90-100
    good: 0, // 80-89
    satisfactory: 0, // 70-79
    needsImprovement: 0, // <70
  };

  grades.forEach((grade) => {
    const percentage = Number(grade.percentage);
    if (percentage >= 90) distribution.excellent++;
    else if (percentage >= 80) distribution.good++;
    else if (percentage >= 70) distribution.satisfactory++;
    else distribution.needsImprovement++;
  });

  return [
    { name: "Excellent (90-100%)", value: distribution.excellent },
    { name: "Good (80-89%)", value: distribution.good },
    { name: "Satisfactory (70-79%)", value: distribution.satisfactory },
    { name: "Needs Improvement (<70%)", value: distribution.needsImprovement },
  ];
}

/**
 * Get detailed school information with all stats and users (super admin only)
 */
export async function getSchoolDetails(schoolId: string) {
  try {
    await checkSuperAdmin();
    const serviceClient = createServiceRoleClient();

    // Get school info
    const { data: school, error: schoolError } = await serviceClient
      .from("schools")
      .select("*")
      .eq("id", schoolId)
      .single();

    if (schoolError) throw schoolError;
    if (!school) throw new Error("School not found");

    // Get all stats
    const [
      { count: adminCount },
      { count: studentCount },
      { count: teacherCount },
      { count: parentCount },
      { count: hrCount },
      { count: classCount },
      { count: subjectCount },
    ] = await Promise.all([
      serviceClient
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "admin")
        .eq("is_active", true),
      serviceClient
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("is_active", true),
      serviceClient
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "teacher")
        .eq("is_active", true),
      serviceClient
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "parent")
        .eq("is_active", true),
      serviceClient
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "hr")
        .eq("is_active", true),
      serviceClient
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId),
      serviceClient
        .from("subjects")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("is_active", true),
    ]);

    // Get all admins
    const { data: admins } = await serviceClient
      .from("users")
      .select("*")
      .eq("school_id", schoolId)
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    // Get recent users (last 10)
    const { data: recentUsers } = await serviceClient
      .from("users")
      .select("*")
      .eq("school_id", schoolId)
      .in("role", ["teacher", "parent", "hr"])
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      data: {
        school,
        stats: {
          admins: adminCount || 0,
          students: studentCount || 0,
          teachers: teacherCount || 0,
          parents: parentCount || 0,
          hr: hrCount || 0,
          classes: classCount || 0,
          subjects: subjectCount || 0,
        },
        admins: admins || [],
        recentUsers: recentUsers || [],
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Failed to get school details:", error);
    return { data: null, error: error.message || "Failed to get school details" };
  }
}
