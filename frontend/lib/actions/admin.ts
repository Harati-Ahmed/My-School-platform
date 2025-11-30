"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { getTranslations } from "next-intl/server";
import { getCachedSession, setCachedSession, invalidateUserSessions } from "@/lib/cache/session-cache";
import { getCachedSchool, setCachedSchool, invalidateSchoolCache, type SchoolRecord } from "@/lib/cache/school-cache";
import {
  getCachedTeacherAssignments,
  setCachedTeacherAssignments,
  setCachedTeacherAssignmentsBatch,
  invalidateTeacherAssignments,
  type TeacherAssignmentData,
} from "@/lib/cache/teacher-assignments-cache";

type SupabaseAdminClient = Awaited<ReturnType<typeof createClient>>;
type SupabaseServiceClient = ReturnType<typeof import("@/lib/supabase/service").createServiceRoleClient>;

/**
 * Admin Server Actions
 * Type-safe CRUD operations for admin functionality
 */

// =============================================
// TYPES & INTERFACES
// =============================================

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  activeClasses: number;
  totalSubjects: number;
  recentActivities: ActivityLog[];
  studentsGrowth: number; // percentage
  teachersGrowth: number; // percentage
}

export interface ActivityLog {
  id: string;
  action: string;
  userName: string;
  userRole: string;
  timestamp: string;
  details?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  role: "teacher" | "parent" | "admin" | "hr";
  password?: string;
  subjectIds?: string[];
}

export interface StudentFormData {
  name: string;
  student_id_number?: string;
  date_of_birth: string;
  gender: "male" | "female";
  class_id?: string;
  parent_id?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medical_info?: string;
}

export interface ClassFormData {
  name: string;
  grade_level: string;
  section?: string;
  academic_year: string;
  main_teacher_id?: string;
  max_capacity?: number;
  room_number?: string;
}

export interface SubjectFormData {
  name: string;
  name_ar: string;
  code?: string;
  class_id: string;
  teacher_id?: string;
  max_grade?: number;
  school_id?: string | null;
}

export interface TeacherSubjectSummary {
  id: string;
  name: string;
  name_ar?: string | null;
  code?: string | null;
  school_id?: string | null;
}

export interface TeacherGradeLevelSummary {
  grade_level: string;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  priority: "urgent" | "normal" | "info";
  target_audience: "all" | "parents" | "teachers" | "class";
  target_class_id?: string;
  is_published: boolean;
}

export interface SchoolSettingsFormData {
  name: string;
  name_ar: string;
  contact_email: string;
  contact_phone: string;
  address?: string;
  theme_color?: string;
  timezone?: string;
  logo_url?: string;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Get authenticated admin user
 * Uses session cache to avoid repeated database queries
 * Returns super admin status (school_id = NULL)
 */
async function getAuthenticatedAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check cache first
  const cached = getCachedSession(user.id);
  if (cached && cached.role === "admin") {
    return {
      userId: cached.userId,
      schoolId: cached.schoolId,
      isSuperAdmin: cached.isSuperAdmin,
      email: cached.email,
    };
  }

  // Cache miss - fetch from database
  const { data: userProfile, error } = await supabase
    .from("users")
    .select("role, school_id, email")
    .eq("id", user.id)
    .single();

  if (error || !userProfile || userProfile.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  // Check if user is super admin (school_id is NULL)
  const isSuperAdmin = userProfile.school_id === null;

  // Cache the result
  setCachedSession(user.id, {
    userId: user.id,
    schoolId: userProfile.school_id,
    isSuperAdmin,
    email: userProfile.email,
    role: userProfile.role,
  });

  return { 
    userId: user.id, 
    schoolId: userProfile.school_id,
    isSuperAdmin,
    email: userProfile.email
  };
}

/**
 * Get Supabase client for admin operations
 * Uses service role for super admin to bypass RLS
 * Uses regular client for regular admins
 */
async function getAdminClient(): Promise<SupabaseAdminClient | SupabaseServiceClient> {
  const { isSuperAdmin } = await getAuthenticatedAdmin();
  
  if (isSuperAdmin) {
    // Super admin uses service role to bypass RLS
    const { createServiceRoleClient } = await import("@/lib/supabase/service");
    return createServiceRoleClient();
  } else {
    // Regular admin uses normal client (RLS applies)
    return await createClient();
  }
}

/**
 * Load a school record with caching to avoid repeated Supabase reads.
 */
async function getSchoolWithCache(
  supabase: SupabaseAdminClient,
  schoolId: string | null
): Promise<SchoolRecord> {
  if (!schoolId) {
    throw new Error("School ID is required for this operation");
  }

  const cached = getCachedSchool(schoolId);
  if (cached) {
    return cached;
  }

  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolId)
    .single();

  if (error || !data) {
    throw error || new Error("School not found");
  }

  setCachedSchool(schoolId, data);
  return data;
}

/**
 * Log audit action
 */
async function logAuditAction(
  action: string,
  entityType: string,
  entityId: string,
  details?: string
) {
  try {
    const supabase = await createClient();
    const { userId, schoolId } = await getAuthenticatedAdmin();

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      school_id: schoolId,
      details,
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}

/**
 * Format error messages for user-friendly display
 * Provides actionable, context-aware error messages
 */
function formatActionError(error: unknown): string {
  // Handle Supabase errors with user-friendly messages
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error
  ) {
    const supabaseError = error as { code?: string; message?: string };
    const code = supabaseError.code;
    const message = supabaseError.message || "";

    // Handle common Supabase error codes
    switch (code) {
      case "23505": // Unique constraint violation
        if (message.includes("email")) {
          return "This email is already registered. Please use a different email address.";
        }
        if (message.includes("student_id_number")) {
          return "This student ID number already exists. Please use a unique ID.";
        }
        return "This record already exists. Please check for duplicates.";
      
      case "23503": // Foreign key violation
        return "Cannot complete this action. The related record may have been deleted or does not exist.";
      
      case "23502": // Not null violation
        return "Please fill in all required fields.";
      
      case "PGRST116": // No rows returned
        return "The requested record was not found. It may have been deleted.";
      
      case "42501": // Insufficient privilege
        return "You don't have permission to perform this action.";
      
      case "42P01": // Table does not exist
        return "A database error occurred. Please contact support.";
      
      default:
        // Extract user-friendly message if available
        if (message) {
          // Clean up technical error messages
          const cleaned = message
            .replace(/^.*?error:\s*/i, "")
            .replace(/violates\s+unique\s+constraint/i, "already exists")
            .replace(/duplicate\s+key\s+value/i, "already exists");
          return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const msg = error.message;
    
    // Common network/connection errors
    if (msg.includes("network") || msg.includes("fetch")) {
      return "Network error. Please check your connection and try again.";
    }
    if (msg.includes("timeout")) {
      return "Request timed out. Please try again.";
    }
    
    return msg || "An error occurred. Please try again.";
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle objects with message property
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "An unexpected error occurred. Please try again or contact support if the problem persists.";
}

function calculatePeriodGrowth(
  currentPeriod: number,
  previousPeriod: number
): number {
  if (previousPeriod === 0) {
    return currentPeriod > 0 ? 100 : 0;
  }

  return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
}

async function syncTeacherSubjects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string,
  subjectIds: string[] | undefined,
  schoolId: string
) {
  try {
    const requestedIds = Array.from(new Set(subjectIds?.filter(Boolean) ?? []));

    let allowedIds: string[] = [];

    if (requestedIds.length > 0) {
      const { data: allowedSubjects, error: allowedError } = await supabase
        .from("subjects")
        .select("id")
        .in("id", requestedIds)
        .or(`school_id.is.null,school_id.eq.${schoolId}`);

      if (allowedError) throw allowedError;
      allowedIds = allowedSubjects?.map((subject) => subject.id) ?? [];
    }

    // Get existing assignments from junction table
    const { data: existingAssignments, error: existingError } = await supabase
      .from("teacher_subject_classes")
      .select("subject_id, class_id")
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId);

    if (existingError) {
      // If table doesn't exist yet, fall back to old method
      console.warn("teacher_subject_classes table not found, using legacy method");
      const { data: existingSubjects } = await supabase
        .from("subjects")
        .select("id")
        .eq("teacher_id", teacherId)
        .or(`school_id.is.null,school_id.eq.${schoolId}`);
      
      const existingIds = existingSubjects?.map((subject) => subject.id) ?? [];
      const toRemove = existingIds.filter((id) => !allowedIds.includes(id));
      
      if (toRemove.length > 0) {
        await supabase.from("subjects").update({ teacher_id: null }).in("id", toRemove);
      }
      
      if (allowedIds.length > 0) {
        await supabase.from("subjects").update({ teacher_id: teacherId }).in("id", allowedIds);
      }
      return;
    }

    const existingIds = existingAssignments?.map((a) => a.subject_id) ?? [];

    // Remove assignments that are no longer needed
    const toRemove = existingIds.filter((id) => !allowedIds.includes(id));
    if (toRemove.length > 0) {
      await supabase
        .from("teacher_subject_classes")
        .delete()
        .eq("teacher_id", teacherId)
        .eq("school_id", schoolId)
        .in("subject_id", toRemove);
    }

    // Add new assignments (only for subjects not already assigned)
    const toAdd = allowedIds.filter((id) => !existingIds.includes(id));
    if (toAdd.length > 0) {
      const newAssignments = toAdd.map((subjectId) => ({
        teacher_id: teacherId,
        subject_id: subjectId,
        class_id: null, // NULL means teacher teaches this subject for all classes
        school_id: schoolId,
      }));

      await supabase.from("teacher_subject_classes").insert(newAssignments);
    }

    // Also update subjects.teacher_id for backward compatibility (set to first teacher or null)
    // This is optional but helps with legacy code
    for (const subjectId of allowedIds) {
      const { data: currentAssignments } = await supabase
        .from("teacher_subject_classes")
        .select("teacher_id")
        .eq("subject_id", subjectId)
        .eq("school_id", schoolId)
        .limit(1);
      
      if (currentAssignments && currentAssignments.length > 0) {
        await supabase
          .from("subjects")
          .update({ teacher_id: currentAssignments[0].teacher_id })
          .eq("id", subjectId);
      }
    }
  } catch (error) {
    console.error("Failed to sync teacher subjects:", error);
    throw error;
  }
}

const buildTeacherSubjectKey = (teacherId: string, subjectId: string) =>
  `${teacherId}:${subjectId}`;

async function syncTeacherClasses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string,
  classIds: string[],
  schoolId: string
) {
  const normalizedClassIds = Array.from(
    new Set(classIds.filter((classId) => Boolean(classId)))
  );

  const { data: existingAssignments, error: existingError } = await supabase
    .from("teacher_class_assignments")
    .select("id, class_id")
    .eq("teacher_id", teacherId)
    .eq("school_id", schoolId);

  if (existingError) {
    console.error("Failed to load teacher class assignments:", existingError);
    throw existingError;
  }

  const existingMap = new Map(
    (existingAssignments || []).map((row) => [row.class_id, row.id])
  );

  const toRemove = (existingAssignments || [])
    .filter((row) => !normalizedClassIds.includes(row.class_id))
    .map((row) => row.id);

  if (toRemove.length > 0) {
    await supabase
      .from("teacher_class_assignments")
      .delete()
      .in("id", toRemove);
  }

  const toAdd = normalizedClassIds.filter(
    (classId) => !existingMap.has(classId)
  );

  if (toAdd.length > 0) {
    await supabase.from("teacher_class_assignments").insert(
      toAdd.map((classId) => ({
        teacher_id: teacherId,
        class_id: classId,
        school_id: schoolId,
      }))
    );
  }
}

async function assertTeacherHasSubjectSkill(
  supabase: SupabaseAdminClient,
  schoolId: string,
  teacherId: string,
  subjectId: string,
  teacherSubjectSet?: Set<string>
) {
  if (teacherSubjectSet) {
    if (!teacherSubjectSet.has(buildTeacherSubjectKey(teacherId, subjectId))) {
      throw new Error(
        "This teacher is not assigned to the selected subject. Update the teacher subjects first."
      );
    }
    return;
  }

  const { data, error } = await supabase
    .from("teacher_subject_classes")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("subject_id", subjectId)
    .eq("school_id", schoolId)
    .is("class_id", null)
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error(
      "This teacher is not assigned to the selected subject. Update the teacher subjects first."
    );
  }
}

async function ensureTeacherClassAssignment(
  supabase: SupabaseAdminClient,
  schoolId: string,
  teacherId: string,
  classId: string,
  subjectId: string
) {
  const { data, error } = await supabase
    .from("teacher_subject_classes")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .eq("school_id", schoolId)
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    await supabase.from("teacher_subject_classes").insert({
      teacher_id: teacherId,
      class_id: classId,
      subject_id: subjectId,
      school_id: schoolId,
    });
  }
}

// =============================================
// DASHBOARD ANALYTICS
// =============================================

/**
 * Get dashboard statistics and analytics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const perfLabel = `getDashboardStats_${randomUUID().slice(0, 8)}`;
  console.time(perfLabel);
  try {
    const authStart = performance.now();
    const { schoolId, isSuperAdmin } = await getAuthenticatedAdmin();
    const supabase = await getAdminClient();
    console.timeLog(perfLabel, `Auth: ${(performance.now() - authStart).toFixed(2)}ms`);

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    // Get basic counts from materialized view (much faster than live queries)
    // Super admin sees aggregated stats from all schools, regular admin sees their school's
    const countsStart = performance.now();
    
    const [
      { data: overviewStats },
      { count: recentStudentAdds },
      { count: prevStudentAdds },
      { count: recentTeacherAdds },
      { count: prevTeacherAdds },
    ] = await Promise.all([
      // Use enhanced materialized view for all basic counts
      isSuperAdmin
        ? supabase
            .from("school_overview_stats_view")
            .select("active_student_count, active_teacher_count, active_parent_count, active_class_count, active_subject_count")
        : supabase
            .from("school_overview_stats_view")
            .select("active_student_count, active_teacher_count, active_parent_count, active_class_count, active_subject_count")
            .eq("school_id", schoolId!)
            .single(),
      // Growth calculations (need date filtering, can't use materialized view)
      (async () => {
        let query = supabase.from("students").select("*", { count: "exact", head: true });
        if (!isSuperAdmin && schoolId) query = query.eq("school_id", schoolId);
        return query.gte("created_at", thirtyDaysAgo.toISOString());
      })(),
      (async () => {
        let query = supabase.from("students").select("*", { count: "exact", head: true });
        if (!isSuperAdmin && schoolId) query = query.eq("school_id", schoolId);
        return query.gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString());
      })(),
      (async () => {
        let query = supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "teacher");
        if (!isSuperAdmin && schoolId) query = query.eq("school_id", schoolId);
        return query.gte("created_at", thirtyDaysAgo.toISOString());
      })(),
      (async () => {
        let query = supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "teacher");
        if (!isSuperAdmin && schoolId) query = query.eq("school_id", schoolId);
        return query.gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString());
      })(),
    ]);

    // Extract counts from materialized view
    // For super admin, aggregate all schools; for regular admin, use their school's stats
    let totalStudents = 0;
    let totalTeachers = 0;
    let totalParents = 0;
    let activeClasses = 0;
    let totalSubjects = 0;
    
    if (isSuperAdmin && Array.isArray(overviewStats)) {
      // Aggregate all schools
      totalStudents = overviewStats.reduce((sum, s) => sum + (s.active_student_count || 0), 0);
      totalTeachers = overviewStats.reduce((sum, s) => sum + (s.active_teacher_count || 0), 0);
      totalParents = overviewStats.reduce((sum, s) => sum + (s.active_parent_count || 0), 0);
      activeClasses = overviewStats.reduce((sum, s) => sum + (s.active_class_count || 0), 0);
      totalSubjects = overviewStats.reduce((sum, s) => sum + (s.active_subject_count || 0), 0);
    } else if (overviewStats && !Array.isArray(overviewStats)) {
      totalStudents = overviewStats.active_student_count || 0;
      totalTeachers = overviewStats.active_teacher_count || 0;
      totalParents = overviewStats.active_parent_count || 0;
      activeClasses = overviewStats.active_class_count || 0;
      totalSubjects = overviewStats.active_subject_count || 0;
    }
    
    console.timeLog(perfLabel, `Count queries: ${(performance.now() - countsStart).toFixed(2)}ms (using materialized view)`);

    // Get recent audit logs for activity (reduced to 5 for faster load)
    const auditStart = performance.now();
    let auditQuery = supabase
      .from("audit_logs")
      .select(
        `
        id,
        action,
        entity_type,
        created_at,
        details,
        user:users!inner(name, role)
      `
      );
    
    // Super admin sees all audit logs, regular admin sees only their school's
    if (!isSuperAdmin && schoolId) {
      auditQuery = auditQuery.eq("school_id", schoolId);
    }
    
    const { data: recentLogs } = await auditQuery
      .order("created_at", { ascending: false })
      .limit(5); // Reduced from 10 to 5 for faster query
    console.timeLog(perfLabel, `Audit logs: ${(performance.now() - auditStart).toFixed(2)}ms`);

    type AuditLogWithUser = {
      id: string;
      action: string;
      created_at: string;
      details: string | null;
      user: Array<{
        name: string;
        role: string;
      }>;
    };
    const recentActivities: ActivityLog[] =
      (recentLogs?.map((log) => {
        const user = Array.isArray(log.user) ? log.user[0] : log.user;
        if (!user || !user.name || !user.role) return null;
        return {
          id: log.id,
          action: log.action,
          userName: user.name,
          userRole: user.role,
          timestamp: log.created_at,
          details: log.details || undefined, // Convert null to undefined
        };
      }).filter((log) => log !== null) as ActivityLog[]) || [];

    const studentsGrowth = calculatePeriodGrowth(
      recentStudentAdds || 0,
      prevStudentAdds || 0
    );

    const teachersGrowth = calculatePeriodGrowth(
      recentTeacherAdds || 0,
      prevTeacherAdds || 0
    );

    const result = {
      totalStudents: totalStudents || 0,
      totalTeachers: totalTeachers || 0,
      totalParents: totalParents || 0,
      activeClasses: activeClasses || 0,
      totalSubjects: totalSubjects || 0,
      recentActivities,
      studentsGrowth: Math.round(studentsGrowth * 10) / 10,
      teachersGrowth: Math.round(teachersGrowth * 10) / 10,
    };
    console.timeEnd(perfLabel);
    return result;
  } catch (error) {
    console.timeEnd(perfLabel);
    console.error("Failed to get dashboard stats:", error);
    throw error;
  }
}

export interface AnalyticsData {
  studentPerformance: Array<{ month: string; average: number }>;
  attendanceTrends: Array<{
    month: string;
    present: number;
    absent: number;
    late: number;
  }>;
  gradeDistribution: Array<{ range: string; count: number }>;
  subjectPerformance: Array<{ subject: string; average: number }>;
  topPerformers: Array<{ name: string; grade: number }>;
  needsAttention: Array<{ name: string; grade: number; attendance: number }>;
  stats: {
    totalStudents: number;
    totalTeachers: number;
    classAverage: number;
    attendanceRate: number;
  };
}

/**
 * Get comprehensive analytics data
 */
export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Get all students
    const { data: students } = await supabase
      .from("students")
      .select("id, name")
      .eq("school_id", schoolId)
      .eq("is_active", true);

    const studentIds = students?.map((s) => s.id) || [];

    if (studentIds.length === 0) {
      // Return empty data structure if no students
      return {
        studentPerformance: [],
        attendanceTrends: [],
        gradeDistribution: [],
        subjectPerformance: [],
        topPerformers: [],
        needsAttention: [],
        stats: {
          totalStudents: 0,
          totalTeachers: 0,
          classAverage: 0,
          attendanceRate: 0,
        },
      };
    }

    // Get stats
    const [{ count: totalStudents }, { count: totalTeachers }] =
      await Promise.all([
        supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("is_active", true),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("role", "teacher")
          .eq("is_active", true),
      ]);

    // Get grades for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: grades } = await supabase
      .from("grades")
      .select("percentage, date, student_id")
      .eq("school_id", schoolId)
      .gte("date", sixMonthsAgo.toISOString().split("T")[0]);

    // Get attendance for the last 6 months
    const { data: attendance } = await supabase
      .from("attendance")
      .select("date, status, student_id")
      .eq("school_id", schoolId)
      .gte("date", sixMonthsAgo.toISOString().split("T")[0]);

    // Calculate student performance by month
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const performanceByMonth: Record<string, { values: number[]; year: number; month: number }> = {};

    grades?.forEach((grade) => {
      const date = new Date(grade.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${month}`;
      if (!performanceByMonth[monthKey]) {
        performanceByMonth[monthKey] = { values: [], year, month };
      }
      if (typeof grade.percentage === "number") {
        performanceByMonth[monthKey].values.push(grade.percentage);
      }
    });

    const studentPerformance = Object.entries(performanceByMonth)
      .map(([, data]) => {
        let average = 0;
        if (data.values.length > 0) {
          const sum = data.values.reduce((a, b) => a + b, 0);
          const avg = sum / data.values.length;
          average = isNaN(avg) ? 0 : Math.round(avg * 10) / 10;
        }
        return {
          month: monthNames[data.month],
          year: data.year,
          monthNum: data.month,
          average,
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNum - b.monthNum;
      })
      .slice(-6) // Last 6 months
      .map(({ month, average }) => ({ month, average }));

    // Calculate attendance trends by month
    const attendanceByMonth: Record<
      string,
      { present: number; absent: number; late: number; year: number; month: number }
    > = {};

    attendance?.forEach((record) => {
      const date = new Date(record.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${month}`;
      if (!attendanceByMonth[monthKey]) {
        attendanceByMonth[monthKey] = { present: 0, absent: 0, late: 0, year, month };
      }
      if (record.status === "present") {
        attendanceByMonth[monthKey].present++;
      } else if (record.status === "absent") {
        attendanceByMonth[monthKey].absent++;
      } else if (record.status === "late") {
        attendanceByMonth[monthKey].late++;
      }
    });

    const attendanceTrends = Object.entries(attendanceByMonth)
      .map(([, data]) => ({
        month: monthNames[data.month],
        year: data.year,
        monthNum: data.month,
        present: data.present,
        absent: data.absent,
        late: data.late,
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNum - b.monthNum;
      })
      .slice(-6) // Last 6 months
      .map(({ month, present, absent, late }) => ({ month, present, absent, late }));

    // Calculate grade distribution
    const allGrades = grades?.map((g) => g.percentage).filter((p): p is number => typeof p === "number") || [];
    const distribution = {
      "90-100%": 0,
      "80-89%": 0,
      "70-79%": 0,
      "60-69%": 0,
      "Below 60%": 0,
    };

    allGrades.forEach((grade) => {
      if (grade >= 90) distribution["90-100%"]++;
      else if (grade >= 80) distribution["80-89%"]++;
      else if (grade >= 70) distribution["70-79%"]++;
      else if (grade >= 60) distribution["60-69%"]++;
      else distribution["Below 60%"]++;
    });

    const gradeDistribution = Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
    }));

    // Get subject performance
    const { data: gradesWithSubjects } = await supabase
      .from("grades")
      .select("percentage, subjects:subject_id(name, name_ar)")
      .eq("school_id", schoolId);

    type GradeWithSubject = {
      percentage: number | null;
      subjects: Array<{
        name: string;
        name_ar?: string | null;
      }> | null;
    };
    const subjectAverages: Record<string, number[]> = {};
    gradesWithSubjects?.forEach((grade) => {
      const subjectData = Array.isArray(grade.subjects) ? grade.subjects[0] : grade.subjects;
      const subjectName = subjectData?.name || "Unknown";
      if (!subjectAverages[subjectName]) {
        subjectAverages[subjectName] = [];
      }
      if (typeof grade.percentage === "number") {
        subjectAverages[subjectName].push(grade.percentage);
      }
    });

    const subjectPerformance = Object.entries(subjectAverages)
      .map(([subject, values]) => {
        let average = 0;
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          const avg = sum / values.length;
          average = isNaN(avg) ? 0 : Math.round(avg * 10) / 10;
        }
        return { subject, average };
      })
      .sort((a, b) => b.average - a.average);

    // Calculate student averages and get top performers
    const studentAverages: Record<string, { name: string; grades: number[] }> = {};
    grades?.forEach((grade) => {
      const student = students?.find((s) => s.id === grade.student_id);
      if (student) {
        if (!studentAverages[student.id]) {
          studentAverages[student.id] = { name: student.name, grades: [] };
        }
        if (typeof grade.percentage === "number") {
          studentAverages[student.id].grades.push(grade.percentage);
        }
      }
    });

    const studentsWithAverages = Object.entries(studentAverages)
      .map(([id, data]) => {
        let average = 0;
        if (data.grades.length > 0) {
          const sum = data.grades.reduce((a, b) => a + b, 0);
          const avg = sum / data.grades.length;
          average = isNaN(avg) ? 0 : avg;
        }
        return { id, name: data.name, average };
      })
      .filter((s) => s.average > 0);

    const topPerformers = studentsWithAverages
      .sort((a, b) => b.average - a.average)
      .slice(0, 5)
      .map((s) => {
        const grade = isNaN(s.average) ? 0 : Math.round(s.average * 10) / 10;
        return { name: s.name, grade };
      });

    // Calculate attendance rates for students
    const studentAttendanceRates: Record<string, { present: number; total: number }> = {};
    attendance?.forEach((record) => {
      if (!studentAttendanceRates[record.student_id]) {
        studentAttendanceRates[record.student_id] = { present: 0, total: 0 };
      }
      studentAttendanceRates[record.student_id].total++;
      if (record.status === "present") {
        studentAttendanceRates[record.student_id].present++;
      }
    });

    // Get students needing attention (low grades or low attendance)
    const needsAttention = studentsWithAverages
      .map((student) => {
        const attendance = studentAttendanceRates[student.id];
        let attendanceRate = 0;
        if (attendance && attendance.total > 0) {
          const rate = (attendance.present / attendance.total) * 100;
          attendanceRate = isNaN(rate) ? 0 : rate;
        }
        const grade = isNaN(student.average) ? 0 : Math.round(student.average * 10) / 10;
        const attendanceRounded = isNaN(attendanceRate) ? 0 : Math.round(attendanceRate * 10) / 10;
        return {
          id: student.id,
          name: student.name,
          grade,
          attendance: attendanceRounded,
        };
      })
      .filter(
        (s) => s.grade < 70 || s.attendance < 75
      )
      .sort((a, b) => a.grade - b.grade)
      .slice(0, 5)
      .map((s) => ({
        name: s.name,
        grade: s.grade,
        attendance: s.attendance,
      }));

    // Calculate overall class average
    let classAverage = 0;
    if (allGrades.length > 0) {
      const sum = allGrades.reduce((a, b) => a + b, 0);
      const avg = sum / allGrades.length;
      classAverage = isNaN(avg) ? 0 : Math.round(avg * 10) / 10;
    }

    // Calculate overall attendance rate
    const totalAttendance = attendance?.length || 0;
    const presentCount = attendance?.filter((a) => a.status === "present").length || 0;
    let attendanceRate = 0;
    if (totalAttendance > 0) {
      const rate = (presentCount / totalAttendance) * 100;
      attendanceRate = isNaN(rate) ? 0 : Math.round(rate * 10) / 10;
    }

    return {
      studentPerformance,
      attendanceTrends,
      gradeDistribution,
      subjectPerformance,
      topPerformers,
      needsAttention,
      stats: {
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        classAverage,
        attendanceRate,
      },
    };
  } catch (error) {
    console.error("Failed to get analytics data:", error);
    throw error;
  }
}

// =============================================
// USER MANAGEMENT (Teachers & Parents)
// =============================================

/**
 * Get all users by role
 */
export async function getUsersByRole(
  role: "teacher" | "parent" | "admin" | "hr",
  options?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50; // Default to 50 items per page
  const search = options?.search?.trim();
  const offset = (page - 1) * pageSize;

  // Use UUID to make label unique for concurrent requests
  const perfLabel = `getUsersByRole(${role})_${randomUUID().slice(0, 8)}`;
  console.time(perfLabel);
  try {
    const authStart = performance.now();
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();
    console.timeLog(perfLabel, `Auth: ${(performance.now() - authStart).toFixed(2)}ms`);

    const usersStart = performance.now();
    let query = supabase
      .from("users")
      .select("*", { count: "exact" })
      .eq("school_id", schoolId)
      .eq("role", role)
      .order("created_at", { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    console.timeLog(perfLabel, `[page=${page}, size=${pageSize}] Users query: ${(performance.now() - usersStart).toFixed(2)}ms (${data?.length || 0} users)`);

    let enrichedUsers = data;

    if (role === "teacher" && data && data.length > 0) {
      const teacherIds = data.map((teacher) => teacher.id);

      // Check cache first for all teachers
      const cacheCheckStart = performance.now();
      const cachedAssignments = new Map<string, TeacherAssignmentData>();
      const uncachedTeacherIds: string[] = [];

      for (const teacherId of teacherIds) {
        const cached = getCachedTeacherAssignments(teacherId);
        if (cached) {
          cachedAssignments.set(teacherId, cached);
        } else {
          uncachedTeacherIds.push(teacherId);
        }
      }
      const cacheHitCount = cachedAssignments.size;
      console.timeLog(perfLabel, `Cache check: ${(performance.now() - cacheCheckStart).toFixed(2)}ms (${cacheHitCount}/${teacherIds.length} cached)`);

      // Fetch data for uncached teachers only
      if (uncachedTeacherIds.length > 0) {
        const assignmentsStart = performance.now();
        
        // Parallelize assignments and grade levels queries
        const [assignmentsResult, gradeLevelsResult] = await Promise.all([
      // Try to fetch from junction table first
          supabase
        .from("teacher_subject_classes")
        .select(`
          teacher_id,
          subject_id,
          subjects:subject_id (id, name, name_ar, code, school_id)
        `)
            .in("teacher_id", uncachedTeacherIds)
            .eq("school_id", schoolId),
          // Grade levels query in parallel
          supabase
            .from("teacher_grade_levels")
            .select("teacher_id, grade_level")
            .in("teacher_id", uncachedTeacherIds)
            .eq("school_id", schoolId),
        ]);

        const { data: assignmentsData, error: assignmentsError } = assignmentsResult;
        const { data: gradeLevelsData } = gradeLevelsResult;
        
        console.timeLog(perfLabel, `Assignments + Grade levels queries (parallel): ${(performance.now() - assignmentsStart).toFixed(2)}ms`);

        // Process assignments data
      if (!assignmentsError && assignmentsData) {
          type AssignmentWithSubject = {
            teacher_id: string;
            subject_id: string;
            subjects: {
              id: string;
              name: string;
              name_ar?: string | null;
              code?: string | null;
              school_id: string | null;
            } | {
              id: string;
              name: string;
              name_ar?: string | null;
              code?: string | null;
              school_id: string | null;
            }[];
          };
          
          const subjectsByTeacher = (assignmentsData ?? []).reduce<
            Record<string, TeacherSubjectSummary[]>
          >(
            (acc, assignment: AssignmentWithSubject) => {
              if (!assignment.teacher_id || !assignment.subjects) return acc;
              if (!acc[assignment.teacher_id]) {
                acc[assignment.teacher_id] = [];
              }
              const subject = Array.isArray(assignment.subjects) 
                ? assignment.subjects[0] 
                : assignment.subjects;
              if (subject) {
                acc[assignment.teacher_id].push({
                  id: subject.id,
                  name: subject.name,
                  name_ar: subject.name_ar,
                  code: subject.code,
                  school_id: subject.school_id ?? null,
                });
              }
              return acc;
            },
            {}
          );

          // Process grade levels
          const gradeLevelsByTeacher = (gradeLevelsData ?? []).reduce<
            Record<string, string[]>
          >((acc, row) => {
            if (!row.teacher_id || !row.grade_level) return acc;
            if (!acc[row.teacher_id]) {
              acc[row.teacher_id] = [];
            }
            acc[row.teacher_id].push(row.grade_level);
            return acc;
          }, {});

          // Cache the results
          const newAssignments = new Map<string, TeacherAssignmentData>();
          for (const teacherId of uncachedTeacherIds) {
            const subjectsForTeacher = (subjectsByTeacher[teacherId] ?? []).map((s) => ({
              id: s.id,
              name: s.name,
              name_ar: s.name_ar,
              code: s.code,
              school_id: s.school_id ?? null,
            }));
            const assignmentData: TeacherAssignmentData = {
              subjects: subjectsForTeacher,
              grade_levels: gradeLevelsByTeacher[teacherId] ?? [],
            };
            cachedAssignments.set(teacherId, assignmentData);
            newAssignments.set(teacherId, assignmentData);
          }
          setCachedTeacherAssignmentsBatch(newAssignments);
        } else {
          // Fall back to legacy method using subjects.teacher_id
          const { data: subjectsData, error: subjectsError } = await supabase
            .from("subjects")
            .select("id, name, name_ar, code, teacher_id, school_id")
            .in("teacher_id", uncachedTeacherIds)
            .or(`school_id.is.null,school_id.eq.${schoolId}`);

          if (subjectsError) throw subjectsError;

          const subjectsByTeacher = (subjectsData ?? []).reduce<
            Record<string, TeacherSubjectSummary[]>
          >(
            (acc, subject) => {
              if (!subject.teacher_id) return acc;
              if (!acc[subject.teacher_id]) {
                acc[subject.teacher_id] = [];
              }
              acc[subject.teacher_id].push({
                id: subject.id,
                name: subject.name,
                name_ar: subject.name_ar,
                code: subject.code,
                school_id: subject.school_id,
              });
              return acc;
            },
            {}
          );

          // Process grade levels (already fetched)
          const gradeLevelsByTeacher = (gradeLevelsData ?? []).reduce<
            Record<string, string[]>
          >((acc, row) => {
            if (!row.teacher_id || !row.grade_level) return acc;
            if (!acc[row.teacher_id]) {
              acc[row.teacher_id] = [];
            }
            acc[row.teacher_id].push(row.grade_level);
            return acc;
          }, {});

          // Cache the results
          const newAssignments = new Map<string, TeacherAssignmentData>();
          for (const teacherId of uncachedTeacherIds) {
            const subjectsForTeacher = (subjectsByTeacher[teacherId] ?? []).map((s) => ({
              id: s.id,
              name: s.name,
              name_ar: s.name_ar,
              code: s.code,
              school_id: s.school_id ?? null,
            }));
            const assignmentData: TeacherAssignmentData = {
              subjects: subjectsForTeacher,
              grade_levels: gradeLevelsByTeacher[teacherId] ?? [],
            };
            cachedAssignments.set(teacherId, assignmentData);
            newAssignments.set(teacherId, assignmentData);
          }
          setCachedTeacherAssignmentsBatch(newAssignments);
        }
      }

      // Merge cached and fresh data
      enrichedUsers = data.map((teacher) => {
        const assignment = cachedAssignments.get(teacher.id);
        return {
          ...teacher,
          subjects: assignment?.subjects ?? [],
          grade_levels: assignment?.grade_levels ?? [],
        };
      });
    }

    console.timeEnd(perfLabel);
    const totalPages = count ? Math.ceil(count / pageSize) : 1;
    return {
      data: enrichedUsers,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      error: null,
    };
  } catch (error) {
    console.timeEnd(perfLabel);
    console.error(`Failed to get ${role}s:`, error);
    return { data: null, pagination: null, error: formatActionError(error) };
  }
}

/**
 * Create a new user (teacher or parent)
 */
export async function createUser(formData: UserFormData) {
  const perfLabel = `createUser(${formData.role})_${randomUUID().slice(0, 8)}`;
  console.time(perfLabel);
  try {
    const authStart = performance.now();
    const { schoolId, isSuperAdmin } = await getAuthenticatedAdmin();
    const supabase = await getAdminClient();
    
    // Super admin can create users for any school, regular admin only their school
    // For now, regular admin creates users in their own school
    const targetSchoolId = schoolId;
    console.timeLog(perfLabel, `Auth: ${(performance.now() - authStart).toFixed(2)}ms`);

    // Create auth user
    const authUserStart = performance.now();
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password || Math.random().toString(36).slice(-8),
        email_confirm: true,
      });

    if (authError) throw authError;
    console.timeLog(perfLabel, `Auth user creation: ${(performance.now() - authUserStart).toFixed(2)}ms`);

    // Create user profile
    const profileStart = performance.now();
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        school_id: targetSchoolId,
      })
      .select()
      .single();

    if (error) throw error;
    console.timeLog(perfLabel, `User profile creation: ${(performance.now() - profileStart).toFixed(2)}ms`);

    if (formData.role === "teacher") {
      const syncStart = performance.now();
      await syncTeacherSubjects(supabase, data.id, formData.subjectIds, targetSchoolId);
      // Cache will be populated on first fetch, no need to invalidate for new teacher
      console.timeLog(perfLabel, `Teacher subjects sync: ${(performance.now() - syncStart).toFixed(2)}ms`);
    }

    const auditStart = performance.now();
    await logAuditAction(
      "CREATE",
      "user",
      data.id,
      `Created ${formData.role}: ${formData.name}`
    );
    console.timeLog(perfLabel, `Audit log: ${(performance.now() - auditStart).toFixed(2)}ms`);

    const revalidateStart = performance.now();
    revalidatePath("/admin/teachers");
    revalidatePath("/admin/parents");
    console.timeLog(perfLabel, `Revalidation: ${(performance.now() - revalidateStart).toFixed(2)}ms`);

    console.timeEnd(perfLabel);
    return { data, error: null };
  } catch (error) {
    console.timeEnd(perfLabel);
    console.error("Failed to create user:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Update user information
 */
export async function updateUser(userId: string, formData: UserFormData) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .update({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache for this user since profile was updated
    invalidateUserSessions(userId);

    if (formData.role === "teacher") {
      await syncTeacherSubjects(supabase, userId, formData.subjectIds, schoolId);
      // Invalidate teacher assignments cache when subjects are updated
      invalidateTeacherAssignments(userId);
    }

    await logAuditAction(
      "UPDATE",
      "user",
      userId,
      `Updated ${formData.role}: ${formData.name}`
    );

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/parents");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to update user:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Delete user (soft delete - mark as inactive)
 */
export async function deleteUser(userId: string, userName: string) {
  try {
    await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "DELETE",
      "user",
      userId,
      `Deactivated user: ${userName}`
    );

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/parents");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { data: null, error: formatActionError(error) };
  }
}

// =============================================
// TEACHER CLASS ASSIGNMENTS
// =============================================

export interface TeacherAssignment {
  id?: string;
  class_id: string | null;
  subject_id: string;
  is_main_teacher?: boolean;
}

export interface TeacherAssignmentWithDetails extends TeacherAssignment {
  class?: {
    id: string;
    name: string;
    grade_level: string;
    section?: string | null;
  };
  subject?: {
    id: string;
    name: string;
    name_ar?: string | null;
  };
}

/**
 * Get all class assignments for a specific teacher
 */
export async function getTeacherAssignments(teacherId: string) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Verify teacher belongs to this school
    const { data: teacher, error: teacherError } = await supabase
      .from("users")
      .select("id, school_id")
      .eq("id", teacherId)
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .single();

    if (teacherError || !teacher) {
      throw new Error("Teacher not found or unauthorized");
    }

    // Get assignments from junction table
    const { data: assignments, error: assignmentsError } = await supabase
      .from("teacher_subject_classes")
      .select(`
        id,
        class_id,
        subject_id,
        classes:class_id (
          id,
          name,
          grade_level,
          section,
          main_teacher_id
        ),
        subjects:subject_id (
          id,
          name,
          name_ar
        )
      `)
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId);

    if (assignmentsError) {
      console.warn("Failed to load assignments from junction table:", assignmentsError);
      // Fallback to empty array if table doesn't exist
      return { data: [], error: null };
    }

    // Transform assignments to include class and subject details
    type AssignmentRow = {
      id: string;
      class_id: string | null;
      subject_id: string;
      classes: Array<{
        id: string;
        name: string;
        grade_level: string;
        section: string | null;
        main_teacher_id: string | null;
      }> | null;
      subjects: Array<{
        id: string;
        name: string;
        name_ar: string | null;
      }> | null;
    };
    const assignmentsWithDetails: TeacherAssignmentWithDetails[] = (assignments || []).map(
      (a) => {
        const classData = Array.isArray(a.classes) ? a.classes[0] : a.classes;
        const subjectData = Array.isArray(a.subjects) ? a.subjects[0] : a.subjects;
        return {
          id: a.id,
          class_id: a.class_id ?? null,
          subject_id: a.subject_id,
          is_main_teacher:
            a.class_id && classData?.main_teacher_id
              ? classData.main_teacher_id === teacherId
              : false,
          class:
            a.class_id && classData
              ? {
                  id: classData.id,
                  name: classData.name,
                  grade_level: classData.grade_level,
                  section: classData.section,
                }
              : undefined,
          subject: subjectData
            ? {
                id: subjectData.id,
                name: subjectData.name,
                name_ar: subjectData.name_ar,
              }
            : undefined,
        };
      }
    );

    return { data: assignmentsWithDetails, error: null };
  } catch (error) {
    console.error("Failed to get teacher assignments:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Get global subject skills for a teacher (subjects they can teach across the school)
 */
export async function getTeacherSubjectSkills(teacherId: string) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data: teacher, error: teacherError } = await supabase
      .from("users")
      .select("id")
      .eq("id", teacherId)
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .single();

    if (teacherError || !teacher) {
      throw new Error("Teacher not found or unauthorized");
    }

    const { data, error } = await supabase
      .from("teacher_subject_classes")
      .select(
        `
        id,
        subject_id,
        subjects:subject_id (
          id,
          name,
          name_ar
        )
      `
      )
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId)
      .is("class_id", null);

    if (error) throw error;

    const subjects =
      data?.map((entry) => {
        const subjectRecord = Array.isArray(entry.subjects)
          ? entry.subjects[0]
          : entry.subjects;

        return {
          subject_id: entry.subject_id,
          subject: subjectRecord
            ? {
                id: subjectRecord.id,
                name: subjectRecord.name,
                name_ar: subjectRecord.name_ar,
              }
            : undefined,
        };
      }) ?? [];

    return { data: subjects, error: null };
  } catch (error) {
    console.error("Failed to load teacher subject skills:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Update the set of subjects a teacher is allowed to teach across the school
 */
export async function updateTeacherSubjectSkills(
  teacherId: string,
  subjectIds: string[]
) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data: teacher, error: teacherError } = await supabase
      .from("users")
      .select("id")
      .eq("id", teacherId)
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .single();

    if (teacherError || !teacher) {
      throw new Error("Teacher not found or unauthorized");
    }

    await syncTeacherSubjects(supabase, teacherId, subjectIds, schoolId);

    await logAuditAction(
      "UPDATE",
      "teacher_subject_skills",
      teacherId,
      `Updated subject skills for teacher ${teacherId}`
    );

    revalidatePath("/admin/teachers");

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Failed to update teacher subject skills:", error);
    return { data: null, error: formatActionError(error) };
  }
}

export async function getTeacherGradeLevels(teacherId: string) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data: teacher, error: teacherError } = await supabase
      .from("users")
      .select("id")
      .eq("id", teacherId)
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .single();

    if (teacherError || !teacher) {
      throw new Error("Teacher not found or unauthorized");
    }

    const { data, error } = await supabase
      .from("teacher_grade_levels")
      .select("grade_level")
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId);

    if (error) throw error;

    return {
      data: data?.map((row) => row.grade_level).filter(Boolean) ?? [],
      error: null,
    };
  } catch (error) {
    console.error("Failed to load teacher grade levels:", error);
    return { data: null, error: formatActionError(error) };
  }
}

export async function getTeacherAllowedClasses(teacherId: string) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data: teacher, error: teacherError } = await supabase
      .from("users")
      .select("id")
      .eq("id", teacherId)
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .single();

    if (teacherError || !teacher) {
      throw new Error("Teacher not found or unauthorized");
    }

    const { data, error } = await supabase
      .from("teacher_class_assignments")
      .select(
        `
        id,
        class_id,
        classes:class_id (
          id,
          name,
          grade_level,
          section
        )
      `
      )
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId);

    if (error) throw error;

    return {
      data:
        data?.map((row) => {
          const classRecord = Array.isArray(row.classes)
            ? row.classes[0]
            : row.classes;
          return {
            id: row.id,
            class_id: row.class_id,
            class: classRecord
              ? {
                  id: classRecord.id,
                  name: classRecord.name,
                  grade_level: classRecord.grade_level,
                  section: classRecord.section,
                }
              : null,
          };
        }) ?? [],
      error: null,
    };
  } catch (error) {
    console.error("Failed to load teacher allowed classes:", error);
    return { data: null, error: formatActionError(error) };
  }
}

export async function updateTeacherGradeLevels(
  teacherId: string,
  gradeLevels: string[]
) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data: teacher, error: teacherError } = await supabase
      .from("users")
      .select("id")
      .eq("id", teacherId)
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .single();

    if (teacherError || !teacher) {
      throw new Error("Teacher not found or unauthorized");
    }

    const normalizedLevels = Array.from(
      new Set(gradeLevels.filter((level) => Boolean(level?.trim())))
    );

    const { data: existingLevels } = await supabase
      .from("teacher_grade_levels")
      .select("id, grade_level")
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId);

    const existingMap = new Map(
      (existingLevels || []).map((row) => [row.grade_level, row.id])
    );

    const toRemove = (existingLevels || [])
      .filter((row) => !normalizedLevels.includes(row.grade_level))
      .map((row) => row.id);

    if (toRemove.length > 0) {
      await supabase
        .from("teacher_grade_levels")
        .delete()
        .in("id", toRemove);
    }

    const toAdd = normalizedLevels.filter(
      (level) => !existingMap.has(level)
    );

    if (toAdd.length > 0) {
      await supabase.from("teacher_grade_levels").insert(
        toAdd.map((level) => ({
          teacher_id: teacherId,
          grade_level: level,
          school_id: schoolId,
        }))
      );
    }

    // Invalidate teacher assignments cache when grade levels are updated
    invalidateTeacherAssignments(teacherId);

    await logAuditAction(
      "UPDATE",
      "teacher_grade_levels",
      teacherId,
      `Updated grade levels (${normalizedLevels.join(", ")})`
    );

    revalidatePath("/admin/teachers");
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Failed to update teacher grade levels:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Batch update multiple teachers' assignments (subjects and grade levels)
 * This reduces API calls by batching all updates in a single request
 */
export async function batchUpdateTeacherAssignments(
  updates: Array<{
    teacherId: string;
    subjects: string[];
    gradeLevels: string[];
    classes?: Record<string, string[]>;
  }>
) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Verify all teachers belong to this school
    const teacherIds = updates.map((u) => u.teacherId);
    const { data: teachers, error: teachersError } = await supabase
      .from("users")
      .select("id")
      .in("id", teacherIds)
      .eq("school_id", schoolId)
      .eq("role", "teacher");

    if (teachersError || !teachers || teachers.length !== teacherIds.length) {
      throw new Error("One or more teachers not found or unauthorized");
    }

    // Process all updates in parallel
    const results = await Promise.all(
      updates.map(async (update) => {
        try {
          // Update subjects
          await syncTeacherSubjects(
            supabase,
            update.teacherId,
            update.subjects,
            schoolId
          );

          // Update grade levels
          const normalizedLevels = Array.from(
            new Set(update.gradeLevels.filter((level) => Boolean(level?.trim())))
          );

          const { data: existingLevels } = await supabase
            .from("teacher_grade_levels")
            .select("id, grade_level")
            .eq("teacher_id", update.teacherId)
            .eq("school_id", schoolId);

          const existingMap = new Map(
            (existingLevels || []).map((row) => [row.grade_level, row.id])
          );

          const toRemove = (existingLevels || [])
            .filter((row) => !normalizedLevels.includes(row.grade_level))
            .map((row) => row.id);

          if (toRemove.length > 0) {
            await supabase
              .from("teacher_grade_levels")
              .delete()
              .in("id", toRemove);
          }

          const toAdd = normalizedLevels.filter(
            (level) => !existingMap.has(level)
          );

          if (toAdd.length > 0) {
            await supabase.from("teacher_grade_levels").insert(
              toAdd.map((level) => ({
                teacher_id: update.teacherId,
                grade_level: level,
                school_id: schoolId,
              }))
            );
          }

          // Sync classes
          const classIds = Array.from(
            new Set(
              Object.values(update.classes ?? {})
                .flat()
                .filter((id) => Boolean(id?.trim()))
            )
          );
          await syncTeacherClasses(supabase, update.teacherId, classIds, schoolId);

          // Log audit action
          await logAuditAction(
            "UPDATE",
            "teacher_assignments",
            update.teacherId,
            `Batch updated: subjects (${update.subjects.length}), grade levels (${normalizedLevels.join(", ")}), classes (${classIds.length})`
          );

          // Invalidate cache for this teacher
          invalidateTeacherAssignments(update.teacherId);
          return { teacherId: update.teacherId, success: true, error: null };
        } catch (error) {
          console.error(
            `Failed to update teacher ${update.teacherId}:`,
            error
          );
          return {
            teacherId: update.teacherId,
            success: false,
            error: formatActionError(error),
          };
        }
      })
    );

    // Check if any updates failed
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      return {
        data: null,
        error: `Failed to update ${failures.length} teacher(s)`,
        results,
      };
    }

    revalidatePath("/admin/teachers");
    return { data: { success: true, count: updates.length }, error: null };
  } catch (error) {
    console.error("Failed to batch update teacher assignments:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Assign a teacher to teach a subject in a specific class
 */
export async function assignTeacherToClass(
  teacherId: string,
  classId: string,
  subjectId: string,
  isMainTeacher: boolean = false
) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Verify teacher belongs to this school
    const { data: teacher, error: teacherError } = await supabase
      .from("users")
      .select("id, school_id")
      .eq("id", teacherId)
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .single();

    if (teacherError || !teacher) {
      throw new Error("Teacher not found or unauthorized");
    }

    // Verify class belongs to this school
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, school_id, main_teacher_id")
      .eq("id", classId)
      .eq("school_id", schoolId)
      .single();

    if (classError || !classData) {
      throw new Error("Class not found or unauthorized");
    }

    // Verify subject is available for this school
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("id, school_id")
      .eq("id", subjectId)
      .or(`school_id.is.null,school_id.eq.${schoolId}`)
      .eq("is_active", true)
      .single();

    if (subjectError || !subject) {
      throw new Error("Subject not found or not available");
    }

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from("teacher_subject_classes")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .eq("school_id", schoolId)
      .single();

    if (existing) {
      // Assignment already exists, just update main teacher status if needed
      if (isMainTeacher && classData.main_teacher_id !== teacherId) {
        await supabase
          .from("classes")
          .update({ main_teacher_id: teacherId })
          .eq("id", classId);
      }
      return { data: existing, error: null };
    }

    // Create new assignment
    const { data: assignment, error: insertError } = await supabase
      .from("teacher_subject_classes")
      .insert({
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId,
        school_id: schoolId,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update main teacher if requested
    if (isMainTeacher && classData.main_teacher_id !== teacherId) {
      await supabase
        .from("classes")
        .update({ main_teacher_id: teacherId })
        .eq("id", classId);
    }

    await logAuditAction(
      "CREATE",
      "teacher_assignment",
      assignment.id,
      `Assigned teacher to class ${classId} for subject ${subjectId}`
    );

    // Invalidate teacher assignments cache when new assignment is added
    invalidateTeacherAssignments(teacherId);

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/classes");

    return { data: assignment, error: null };
  } catch (error) {
    console.error("Failed to assign teacher to class:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Remove a teacher assignment from a class
 */
export async function removeTeacherAssignment(
  teacherId: string,
  classId: string,
  subjectId: string
) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Delete the assignment
    const { error: deleteError } = await supabase
      .from("teacher_subject_classes")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .eq("school_id", schoolId);

    if (deleteError) throw deleteError;

    // Check if teacher was main teacher for this class
    const { data: classData } = await supabase
      .from("classes")
      .select("main_teacher_id")
      .eq("id", classId)
      .single();

    // If teacher was main teacher and has no more assignments, remove main teacher status
    if (classData?.main_teacher_id === teacherId) {
      const { data: remainingAssignments } = await supabase
        .from("teacher_subject_classes")
        .select("id")
        .eq("teacher_id", teacherId)
        .eq("class_id", classId)
        .eq("school_id", schoolId)
        .limit(1);

      if (!remainingAssignments || remainingAssignments.length === 0) {
        await supabase
          .from("classes")
          .update({ main_teacher_id: null })
          .eq("id", classId);
      }
    }

    // Invalidate teacher assignments cache when assignment is removed
    invalidateTeacherAssignments(teacherId);

    await logAuditAction(
      "DELETE",
      "teacher_assignment",
      classId,
      `Removed teacher assignment from class ${classId} for subject ${subjectId}`
    );

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/classes");

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Failed to remove teacher assignment:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Bulk update teacher assignments (replace all assignments)
 */
export async function updateTeacherAssignments(
  teacherId: string,
  assignments: TeacherAssignment[]
) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Verify teacher belongs to this school
    const { data: teacher, error: teacherError } = await supabase
      .from("users")
      .select("id, school_id")
      .eq("id", teacherId)
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .single();

    if (teacherError || !teacher) {
      throw new Error("Teacher not found or unauthorized");
    }

    // Get current assignments
    const { data: currentAssignments } = await supabase
      .from("teacher_subject_classes")
      .select("id, class_id, subject_id")
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId);

    type CurrentAssignment = {
      id: string;
      class_id: string | null;
      subject_id: string;
    };
    const currentSet = new Set(
      (currentAssignments || []).map(
        (a: CurrentAssignment) => `${a.class_id}:${a.subject_id}`
      )
    );
    const classAssignments = assignments.filter(
      (assignment): assignment is TeacherAssignment & { class_id: string } =>
        typeof assignment.class_id === "string" && assignment.class_id.length > 0
    );

    if (classAssignments.length !== assignments.length) {
      throw new Error("Every class assignment must include a class_id");
    }

    const newSet = new Set(
      classAssignments.map((a) => `${a.class_id}:${a.subject_id}`)
    );

    // Find assignments to remove
    const toRemove = (currentAssignments || []).filter(
      (a: CurrentAssignment) => !newSet.has(`${a.class_id}:${a.subject_id}`)
    );

    // Find assignments to add
    const toAdd = classAssignments.filter(
      (a) => !currentSet.has(`${a.class_id}:${a.subject_id}`)
    );

    // Remove old assignments
    if (toRemove.length > 0) {
      const idsToRemove = toRemove.map((a: CurrentAssignment) => a.id);
      await supabase
        .from("teacher_subject_classes")
        .delete()
        .in("id", idsToRemove);
    }

    // Add new assignments
    if (toAdd.length > 0) {
      const newAssignments = toAdd.map((a) => ({
        teacher_id: teacherId,
        class_id: a.class_id,
        subject_id: a.subject_id,
        school_id: schoolId,
      }));

      await supabase.from("teacher_subject_classes").insert(newAssignments);
    }

    // Update main teacher status for classes
    const classMainTeacherMap = new Map<string, string>();
    classAssignments.forEach((a) => {
      if (a.is_main_teacher) {
        classMainTeacherMap.set(a.class_id, teacherId);
      }
    });

    // Get all affected classes
    const affectedClassIds = Array.from(
      new Set(classAssignments.map((a) => a.class_id))
    );
    if (affectedClassIds.length > 0) {
      const { data: classes } = await supabase
        .from("classes")
        .select("id, main_teacher_id")
        .in("id", affectedClassIds)
        .eq("school_id", schoolId);

      // Update main teacher for classes where this teacher should be main teacher
      for (const classItem of classes || []) {
        const shouldBeMain = classMainTeacherMap.get(classItem.id) === teacherId;
        const isCurrentlyMain = classItem.main_teacher_id === teacherId;

        if (shouldBeMain && !isCurrentlyMain) {
          await supabase
            .from("classes")
            .update({ main_teacher_id: teacherId })
            .eq("id", classItem.id);
        } else if (!shouldBeMain && isCurrentlyMain) {
          // Check if teacher has any other assignments for this class
          const { data: otherAssignments } = await supabase
            .from("teacher_subject_classes")
            .select("id")
            .eq("teacher_id", teacherId)
            .eq("class_id", classItem.id)
            .eq("school_id", schoolId)
            .limit(1);

          if (!otherAssignments || otherAssignments.length === 0) {
            await supabase
              .from("classes")
              .update({ main_teacher_id: null })
              .eq("id", classItem.id);
          }
        }
      }
    }

    // Invalidate teacher assignments cache when assignments are updated
    invalidateTeacherAssignments(teacherId);

    await logAuditAction(
      "UPDATE",
      "teacher_assignment",
      teacherId,
      `Updated assignments for teacher`
    );

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/classes");

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Failed to update teacher assignments:", error);
    return { data: null, error: formatActionError(error) };
  }
}

// =============================================
// CLASS SCHEDULE MANAGEMENT
// =============================================

export interface ClassPeriod {
  id?: string;
  period_number: number;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  name?: string;
  is_break?: boolean;
  academic_year?: string;
}

export interface ClassSchedule {
  id?: string;
  class_id: string;
  teacher_id: string;
  subject_id: string;
  period_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  room_number?: string;
  academic_year: string;
  is_active?: boolean;
}

export interface ClassScheduleWithDetails extends ClassSchedule {
  class?: {
    id: string;
    name: string;
    grade_level: string;
    section?: string | null;
  };
  teacher?: {
    id: string;
    name: string;
  };
  subject?: {
    id: string;
    name: string;
    name_ar?: string | null;
  };
  period?: {
    id: string;
    period_number: number;
    start_time: string;
    end_time: string;
    name?: string;
  };
}

/**
 * Get all periods for a school
 */
export async function getClassPeriods(academicYear?: string) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Use current year as default if not provided
    const year = academicYear || new Date().getFullYear().toString();

    const query = supabase
      .from("class_periods")
      .select("*")
      .eq("school_id", schoolId)
      .eq("academic_year", year)
      .order("period_number", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    const existingPeriods = data || [];
    const existingPeriodNumbers = new Set(existingPeriods.map((p) => p.period_number));

    // Ensure we have exactly 6 periods (periods 1-6)
    const requiredPeriodNumbers = [1, 2, 3, 4, 5, 6];
    const missingPeriodNumbers = requiredPeriodNumbers.filter(
      (num) => !existingPeriodNumbers.has(num)
    );

    // If periods are missing, create them
    if (missingPeriodNumbers.length > 0) {
      const newPeriods = missingPeriodNumbers.map((periodNum) => {
        const startHour = 7 + periodNum; // 08:00, 09:00, 10:00, 11:00, 12:00, 13:00
        const endHour = startHour + 1;
        return {
          school_id: schoolId,
          period_number: periodNum,
          start_time: `${String(startHour).padStart(2, "0")}:00`,
          end_time: `${String(endHour).padStart(2, "0")}:00`,
          name: `Period ${periodNum}`,
          is_break: false,
          academic_year: year,
        };
      });

      const { data: insertedData, error: insertError } = await supabase
        .from("class_periods")
        .insert(newPeriods)
        .select();

      if (insertError) throw insertError;

      await logAuditAction(
        "CREATE",
        "class_periods",
        schoolId,
        `Created ${missingPeriodNumbers.length} missing periods for academic year ${year}`
      );

      // Return all periods (existing + newly created)
      const allPeriods = [...existingPeriods, ...(insertedData || [])].sort(
        (a, b) => a.period_number - b.period_number
      );
      return { data: allPeriods, error: null };
    }

    // If we have 6 periods, return them
    return { data: existingPeriods, error: null };
  } catch (error) {
    console.error("Failed to get class periods:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Create or update class periods
 */
export async function upsertClassPeriods(periods: ClassPeriod[]) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Separate new periods from existing ones
    type PeriodRecord = Omit<ClassPeriod, "id"> & {
      school_id: string;
      id?: string;
    };
    const newPeriods: Omit<PeriodRecord, "id">[] = [];
    const existingPeriods: PeriodRecord[] = [];

    periods.forEach((period) => {
      const { id, ...rest } = period;
      const basePeriod: Omit<PeriodRecord, "id"> = {
        ...rest,
        school_id: schoolId,
      };

      if (id) {
        existingPeriods.push({ ...basePeriod, id });
      } else {
        // Explicitly exclude id for new periods
        newPeriods.push(basePeriod);
      }
    });

    // Get academic year from periods (all should have the same)
    const academicYear = periods[0]?.academic_year || new Date().getFullYear().toString();
    const allInsertedIds: string[] = [];
    const allUpdatedIds: string[] = [];

    // Insert new periods first
    if (newPeriods.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from("class_periods")
        .insert(newPeriods)
        .select();

      if (insertError) throw insertError;
      if (insertedData) {
        allInsertedIds.push(...insertedData.map((p) => p.id));
      }
    }

    // Update existing periods
    if (existingPeriods.length > 0) {
      const { data: updatedData, error: updateError } = await supabase
        .from("class_periods")
        .upsert(existingPeriods, {
          onConflict: "id",
        })
        .select();

      if (updateError) throw updateError;
      if (updatedData) {
        allUpdatedIds.push(...updatedData.map((p) => p.id));
      }
    }

    // Fetch periods for this academic year to return
    const { data, error } = await supabase
      .from("class_periods")
      .select("*")
      .eq("school_id", schoolId)
      .eq("academic_year", academicYear)
      .order("period_number", { ascending: true });

    if (error) throw error;

    await logAuditAction(
      "UPDATE",
      "class_periods",
      schoolId,
      `Updated class periods`
    );

    revalidatePath("/admin/schedules");
    return { data, error: null };
  } catch (error) {
    console.error("Failed to upsert class periods:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Get schedule for a specific class
 */
export async function getClassSchedule(
  classId: string,
  academicYear?: string
) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Verify class belongs to school
    const { data: classData } = await supabase
      .from("classes")
      .select("id, school_id")
      .eq("id", classId)
      .eq("school_id", schoolId)
      .single();

    if (!classData) {
      throw new Error("Class not found or unauthorized");
    }

    let query = supabase
      .from("class_schedules")
      .select(`
        id,
        class_id,
        teacher_id,
        subject_id,
        period_id,
        day_of_week,
        room_number,
        academic_year,
        is_active,
        classes:class_id (
          id,
          name,
          grade_level,
          section
        ),
        teachers:teacher_id (
          id,
          name
        ),
        subjects:subject_id (
          id,
          name,
          name_ar
        ),
        periods:period_id (
          id,
          period_number,
          start_time,
          end_time,
          name
        )
      `)
      .eq("class_id", classId)
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("period_id", { ascending: true });

    if (academicYear) {
      query = query.eq("academic_year", academicYear);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform to include details
    type ScheduleRow = {
      id: string;
      class_id: string;
      teacher_id: string;
      subject_id: string;
      period_id: string;
      day_of_week: number;
      room_number: string | null;
      academic_year: string;
      is_active: boolean;
      classes: Array<{
        id: string;
        name: string;
        grade_level: string;
        section: string | null;
      }> | null;
      teachers: Array<{
        id: string;
        name: string;
      }> | null;
      subjects: Array<{
        id: string;
        name: string;
        name_ar: string | null;
      }> | null;
      periods: Array<{
        id: string;
        period_number: number;
        start_time: string;
        end_time: string;
        name: string | null;
      }> | null;
    };
    const schedulesWithDetails: ClassScheduleWithDetails[] = (data || []).map(
      (s) => {
        const classData = Array.isArray(s.classes) ? s.classes[0] : s.classes;
        const teacherData = Array.isArray(s.teachers) ? s.teachers[0] : s.teachers;
        const subjectData = Array.isArray(s.subjects) ? s.subjects[0] : s.subjects;
        const periodData = Array.isArray(s.periods) ? s.periods[0] : s.periods;
        
        return {
          id: s.id,
          class_id: s.class_id,
          teacher_id: s.teacher_id,
          subject_id: s.subject_id,
          period_id: s.period_id,
          day_of_week: s.day_of_week,
          room_number: s.room_number,
          academic_year: s.academic_year,
          is_active: s.is_active,
          class: classData
            ? {
                id: classData.id,
                name: classData.name,
                grade_level: classData.grade_level,
                section: classData.section,
              }
            : undefined,
          teacher: teacherData
            ? {
                id: teacherData.id,
                name: teacherData.name,
              }
            : undefined,
          subject: subjectData
            ? {
                id: subjectData.id,
                name: subjectData.name,
                name_ar: subjectData.name_ar,
              }
            : undefined,
          period: periodData
            ? {
                id: periodData.id,
                period_number: periodData.period_number,
                start_time: periodData.start_time,
                end_time: periodData.end_time,
                name: periodData.name ?? undefined,
              }
            : undefined,
        };
      }
    );

    return { data: schedulesWithDetails, error: null };
  } catch (error) {
    console.error("Failed to get class schedule:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Create or update class schedule entries
 */
export async function upsertClassSchedules(schedules: ClassSchedule[]) {
  const perfLabel = `upsertClassSchedules_${randomUUID().slice(0, 8)}`;
  console.time(perfLabel);
  console.timeLog(perfLabel, `[${schedules.length} schedules] Starting`);
  try {
    const authStart = performance.now();
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();
    const tSchedules = await getTranslations("admin.schedules.errors");
    console.timeLog(perfLabel, `Auth: ${(performance.now() - authStart).toFixed(2)}ms`);

    // Validate all classes, teachers, subjects belong to school
    const validationStart = performance.now();
    const classIds = Array.from(
      new Set(schedules.map((s) => s.class_id).filter(Boolean))
    );
    const teacherIds = Array.from(
      new Set(schedules.map((s) => s.teacher_id).filter(Boolean))
    );
    const subjectIds = Array.from(
      new Set(schedules.map((s) => s.subject_id).filter(Boolean))
    );

    const [classesResult, teachersResult, subjectsResult] = await Promise.all([
      supabase
        .from("classes")
        .select("id, grade_level, name")
        .in("id", classIds)
        .eq("school_id", schoolId),
      supabase
        .from("users")
        .select("id")
        .in("id", teacherIds)
        .eq("school_id", schoolId)
        .eq("role", "teacher"),
      supabase
        .from("subjects")
        .select("id")
        .in("id", subjectIds)
        .or(`school_id.is.null,school_id.eq.${schoolId}`),
    ]);
    console.timeLog(perfLabel, `Validation queries: ${(performance.now() - validationStart).toFixed(2)}ms`);

    if (
      classesResult.data?.length !== classIds.length ||
      teachersResult.data?.length !== teacherIds.length ||
      subjectsResult.data?.length !== subjectIds.length
    ) {
      throw new Error("Invalid class, teacher, or subject IDs");
    }

    const classGradeMap = new Map(
      (classesResult.data || []).map((cls) => [cls.id, cls.grade_level])
    );
    const classNameMap = new Map(
      (classesResult.data || []).map((cls) => [cls.id, cls.name])
    );

    let teacherGradeMap: Record<string, string[]> = {};

    if (teacherIds.length > 0) {
      const { data: teacherGradeRows } = await supabase
        .from("teacher_grade_levels")
        .select("teacher_id, grade_level")
        .in("teacher_id", teacherIds)
        .eq("school_id", schoolId);

      teacherGradeMap = (teacherGradeRows || []).reduce<
        Record<string, string[]>
      >((acc, row) => {
        if (!row.teacher_id || !row.grade_level) return acc;
        if (!acc[row.teacher_id]) {
          acc[row.teacher_id] = [];
        }
        acc[row.teacher_id].push(row.grade_level);
        return acc;
      }, {});
    }

    type ScheduleRecord = {
      id: string;
      class_id: string;
      teacher_id: string;
      subject_id: string;
      period_id: string;
      day_of_week: number;
      academic_year: string;
      school_id: string;
      is_active: boolean;
      room_number?: string;
    };

    const schedulesWithSchoolId: ScheduleRecord[] = schedules.map((schedule) => {
      const baseSchedule: ScheduleRecord = {
        id: schedule.id && typeof schedule.id === "string" && schedule.id.length > 0
          ? schedule.id
          : randomUUID(),
        class_id: schedule.class_id,
        teacher_id: schedule.teacher_id,
        subject_id: schedule.subject_id,
        period_id: schedule.period_id,
        day_of_week: schedule.day_of_week,
        academic_year: schedule.academic_year,
        school_id: schoolId,
        is_active: schedule.is_active ?? true,
      };

      if (schedule.room_number) {
        baseSchedule.room_number = schedule.room_number;
      }

      return baseSchedule;
    });

    const activeSchedules = schedulesWithSchoolId.filter(
      (schedule) => schedule.is_active
    );

    // Prepare teacher-subject assignments cache to avoid per-row queries.
    const teacherSubjectSchedules = activeSchedules.filter(
      (schedule) => schedule.teacher_id && schedule.subject_id
    );
    let teacherSubjectSet: Set<string> | undefined;

    if (teacherSubjectSchedules.length > 0) {
      const { data: teacherSubjectRows, error: teacherSubjectError } =
        await supabase
          .from("teacher_subject_classes")
          .select("teacher_id, subject_id")
          .eq("school_id", schoolId)
          .is("class_id", null)
          .in(
            "teacher_id",
            Array.from(
              new Set(teacherSubjectSchedules.map((s) => s.teacher_id))
            )
          )
          .in(
            "subject_id",
            Array.from(
              new Set(teacherSubjectSchedules.map((s) => s.subject_id))
            )
          );

      if (teacherSubjectError) throw teacherSubjectError;

      teacherSubjectSet = new Set(
        (teacherSubjectRows || []).map((row) =>
          buildTeacherSubjectKey(row.teacher_id, row.subject_id)
        )
      );
    }

    const buildSlotKey = (schedule: {
      teacher_id: string;
      day_of_week: number;
      period_id: string;
      academic_year: string;
    }) =>
      [
        schedule.teacher_id,
        schedule.day_of_week,
        schedule.period_id,
        schedule.academic_year,
      ].join("|");

    // Prevent duplicate submissions within the same payload before hitting the database.
    const pendingSlotMap = new Map<string, (typeof schedulesWithSchoolId)[number]>();

    for (const schedule of activeSchedules) {
      await assertTeacherHasSubjectSkill(
        supabase,
        schoolId,
        schedule.teacher_id,
        schedule.subject_id,
        teacherSubjectSet
      );

      const classGradeLevel = classGradeMap.get(schedule.class_id);
      if (classGradeLevel) {
        const allowedGrades = teacherGradeMap[schedule.teacher_id] ?? [];
        if (
          allowedGrades.length > 0 &&
          !allowedGrades.includes(classGradeLevel)
        ) {
          throw new Error(
            "This teacher is not assigned to the selected grade level."
          );
        }
      }

      const slotKey = buildSlotKey(schedule);
      if (pendingSlotMap.has(slotKey)) {
        const existing = pendingSlotMap.get(slotKey);
        const conflictClassName =
          classNameMap.get(existing?.class_id || "") ||
          classNameMap.get(schedule.class_id || "");
        throw new Error(
          conflictClassName
            ? tSchedules("teacherConflictWithClass", {
                className: conflictClassName,
              })
            : tSchedules("teacherConflictGeneric")
        );
      }
      pendingSlotMap.set(slotKey, schedule);
    }

    // Check conflicts for each schedule individually (optimized for index usage)
    // Each query checks the exact slot (teacher/day/period/year) which uses the index efficiently
    // We still get the class name in the response for the error message
    type ConflictRow = {
      id: string;
      teacher_id: string;
      day_of_week: number;
      period_id: string;
      academic_year: string;
      classes?: { name?: string } | { name?: string }[];
    };

    if (activeSchedules.length > 0) {
      // Check each schedule's exact slot in parallel - much more efficient than scanning all combinations
      const conflictStart = performance.now();
      const conflictChecks = await Promise.all(
        activeSchedules.map(async (schedule) => {
          const { data: conflictRows, error: conflictError } = await supabase
        .from("class_schedules")
            .select(
              "id, teacher_id, day_of_week, period_id, academic_year, classes:class_id(name)"
            )
            .eq("school_id", schoolId)
            .eq("is_active", true)
        .eq("teacher_id", schedule.teacher_id)
        .eq("day_of_week", schedule.day_of_week)
        .eq("period_id", schedule.period_id)
            .eq("academic_year", schedule.academic_year);

      if (conflictError) throw conflictError;

          // Find conflicts (excluding the current schedule if it's an update)
          const conflictingEntry = (conflictRows || []).find(
            (conflict) => conflict.id !== schedule.id
          );

          return { schedule, conflictingEntry };
        })
      );
      console.timeLog(perfLabel, `Conflict checks: ${(performance.now() - conflictStart).toFixed(2)}ms (${activeSchedules.length} schedules)`);

      // Check for conflicts and throw with helpful error message
      for (const { schedule, conflictingEntry } of conflictChecks) {
      if (conflictingEntry) {
        const classRecord = Array.isArray(conflictingEntry.classes)
          ? conflictingEntry.classes[0]
          : conflictingEntry.classes;
          const conflictClassName =
            classRecord?.name || classNameMap.get(schedule.class_id || "");
        throw new Error(
          conflictClassName
              ? tSchedules("teacherConflictWithClass", {
                  className: conflictClassName,
                })
            : tSchedules("teacherConflictGeneric")
        );
        }
      }
    }

    // Validate that no entry has id: null or id: undefined
    const upsertStart = performance.now();
    const { data, error } = await supabase
      .from("class_schedules")
      .upsert(schedulesWithSchoolId, {
        onConflict: "class_id,period_id,day_of_week,academic_year",
      })
      .select();

    if (error) throw error;
    console.timeLog(perfLabel, `Upsert: ${(performance.now() - upsertStart).toFixed(2)}ms`);

    const assignmentsStart = performance.now();
    const uniqueAssignments = new Map<string, (typeof schedulesWithSchoolId)[number]>();
    for (const schedule of schedulesWithSchoolId.filter(
      (schedule) => schedule.is_active
    )) {
      const key = [
        schedule.teacher_id,
        schedule.class_id,
        schedule.subject_id,
      ].join("|");
      if (!uniqueAssignments.has(key)) {
        uniqueAssignments.set(key, schedule);
      }
    }

    await Promise.all(
      Array.from(uniqueAssignments.values()).map((schedule) =>
          ensureTeacherClassAssignment(
            supabase,
            schoolId,
            schedule.teacher_id,
            schedule.class_id,
            schedule.subject_id
          )
        )
    );
    console.timeLog(perfLabel, `Teacher assignments: ${(performance.now() - assignmentsStart).toFixed(2)}ms`);

    await logAuditAction(
      "UPDATE",
      "class_schedules",
      schoolId,
      `Updated class schedules`
    );

    revalidatePath("/admin/schedules");
    console.timeEnd(perfLabel);
    return { data, error: null };
  } catch (error) {
    console.timeEnd(perfLabel);
    console.error("Failed to upsert class schedules:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Delete a class schedule entry
 */
export async function deleteClassSchedule(scheduleId: string) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("class_schedules")
      .delete()
      .eq("id", scheduleId)
      .eq("school_id", schoolId);

    if (error) throw error;

    await logAuditAction(
      "DELETE",
      "class_schedules",
      scheduleId,
      `Deleted class schedule entry`
    );

    revalidatePath("/admin/schedules");
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Failed to delete class schedule:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Get teacher's schedule
 */
export async function getTeacherSchedule(
  teacherId: string,
  academicYear?: string
) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Verify teacher belongs to school
    const { data: teacher } = await supabase
      .from("users")
      .select("id, school_id")
      .eq("id", teacherId)
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .single();

    if (!teacher) {
      throw new Error("Teacher not found or unauthorized");
    }

    let query = supabase
      .from("class_schedules")
      .select(`
        id,
        class_id,
        teacher_id,
        subject_id,
        period_id,
        day_of_week,
        room_number,
        academic_year,
        is_active,
        classes:class_id (
          id,
          name,
          grade_level,
          section
        ),
        subjects:subject_id (
          id,
          name,
          name_ar
        ),
        periods:period_id (
          id,
          period_number,
          start_time,
          end_time,
          name
        )
      `)
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("period_id", { ascending: true });

    if (academicYear) {
      query = query.eq("academic_year", academicYear);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Failed to get teacher schedule:", error);
    return { data: null, error: formatActionError(error) };
  }
}

// =============================================
// STUDENT MANAGEMENT
// =============================================

/**
 * Get all students
 */
export async function getStudents(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50; // Default to 50 items per page
  const search = options?.search?.trim();
  const offset = (page - 1) * pageSize;

  const perfLabel = `getStudents_${randomUUID().slice(0, 8)}`;
  console.time(perfLabel);
  console.timeLog(perfLabel, `[page=${page}, size=${pageSize}] Starting`);
  try {
    const authStart = performance.now();
    const { schoolId, isSuperAdmin } = await getAuthenticatedAdmin();
    const supabase = await getAdminClient();
    console.timeLog(perfLabel, `Auth: ${(performance.now() - authStart).toFixed(2)}ms`);

    const studentsStart = performance.now();
    let query = supabase
      .from("students")
      .select(
        `
        *,
        class:classes(id, name, grade_level),
        parent:users(id, name, email, phone)
      `,
        { count: "exact" }
      );
    
    // Super admin can see all students, regular admin sees their school's
    if (!isSuperAdmin && schoolId) {
      query = query.eq("school_id", schoolId);
    }
    
    query = query.order("created_at", { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,student_id_number.ilike.%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;
    console.timeLog(perfLabel, `Students query: ${(performance.now() - studentsStart).toFixed(2)}ms (${data?.length || 0} students)`);

    if (error) throw error;
    
    const totalPages = count ? Math.ceil(count / pageSize) : 1;
    console.timeEnd(perfLabel);
    return {
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      error: null,
    };
  } catch (error) {
    console.timeEnd(perfLabel);
    console.error("Failed to get students:", error);
    return { data: null, pagination: null, error: formatActionError(error) };
  }
}

/**
 * Create a new student
 */
export async function createStudent(formData: StudentFormData) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("students")
      .insert({
        ...formData,
        school_id: schoolId,
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "CREATE",
      "student",
      data.id,
      `Created student: ${formData.name}`
    );

    revalidatePath("/admin/students");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to create student:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Update student information
 */
export async function updateStudent(studentId: string, formData: StudentFormData) {
  try {
    await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("students")
      .update(formData)
      .eq("id", studentId)
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "UPDATE",
      "student",
      studentId,
      `Updated student: ${formData.name}`
    );

    revalidatePath("/admin/students");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to update student:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Delete student (soft delete)
 */
export async function deleteStudent(studentId: string, studentName: string) {
  try {
    await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("students")
      .update({ is_active: false })
      .eq("id", studentId)
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "DELETE",
      "student",
      studentId,
      `Deactivated student: ${studentName}`
    );

    revalidatePath("/admin/students");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to delete student:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Bulk import students from CSV data
 */
export async function bulkImportStudents(students: StudentFormData[]) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const studentsWithSchool = students.map((student) => ({
      ...student,
      school_id: schoolId,
    }));

    const { data, error } = await supabase
      .from("students")
      .insert(studentsWithSchool)
      .select();

    if (error) throw error;

    await logAuditAction(
      "BULK_IMPORT",
      "student",
      schoolId,
      `Imported ${students.length} students`
    );

    revalidatePath("/admin/students");

    return { data, error: null, count: data?.length || 0 };
  } catch (error) {
    console.error("Failed to bulk import students:", error);
    return { data: null, error: formatActionError(error), count: 0 };
  }
}

// =============================================
// CLASS MANAGEMENT
// =============================================

/**
 * Get all classes
 */
export async function getClasses() {
  try {
    const { schoolId, isSuperAdmin } = await getAuthenticatedAdmin();
    const supabase = await getAdminClient();

    // Fetch classes with main teacher info
    // Super admin can see all classes, regular admin sees their school's
    let query = supabase
      .from("classes")
      .select(
        `
        *,
        main_teacher:users!main_teacher_id(id, name)
      `
      );
    
    if (!isSuperAdmin && schoolId) {
      query = query.eq("school_id", schoolId);
    }
    
    const { data: classes, error: classesError } = await query
      .order("grade_level", { ascending: true });

    if (classesError) {
      console.error("Supabase error in getClasses:", {
        message: classesError.message,
        code: classesError.code,
        details: classesError.details,
        hint: classesError.hint,
      });
      throw classesError;
    }

    // If no classes found, return empty array (not an error)
    if (!classes) {
      return { data: [], error: null };
    }

    // Optionally fetch student counts separately (if needed)
    // For now, return classes without student counts to keep it simple
    return { data: classes, error: null };
  } catch (error) {
    // Handle network errors gracefully
    const errorMessage = formatActionError(error);
    console.error("Failed to get classes:", {
      errorMessage,
      errorType: typeof error,
      originalError: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
      } : String(error),
    });
    
    // Return empty array on error instead of null to prevent crashes
    // This allows the page to still render even if classes fail to load
    return { data: [], error: errorMessage };
  }
}

/**
 * Create a new class
 */
export async function createClass(formData: ClassFormData) {
  try {
    const { schoolId, isSuperAdmin } = await getAuthenticatedAdmin();
    const supabase = await getAdminClient();

    const { data, error } = await supabase
      .from("classes")
      .insert({
        ...formData,
        school_id: schoolId,
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "CREATE",
      "class",
      data.id,
      `Created class: ${formData.name}`
    );

    revalidatePath("/admin/classes");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to create class:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Update class information
 */
export async function updateClass(classId: string, formData: ClassFormData) {
  try {
    await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("classes")
      .update(formData)
      .eq("id", classId)
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "UPDATE",
      "class",
      classId,
      `Updated class: ${formData.name}`
    );

    revalidatePath("/admin/classes");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to update class:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Delete class (soft delete)
 */
export async function deleteClass(classId: string, className: string) {
  try {
    await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("classes")
      .update({ is_active: false })
      .eq("id", classId)
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "DELETE",
      "class",
      classId,
      `Deactivated class: ${className}`
    );

    revalidatePath("/admin/classes");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to delete class:", error);
    return { data: null, error: formatActionError(error) };
  }
}

// =============================================
// SUBJECT MANAGEMENT
// =============================================

/**
 * Get all subjects
 */
export async function getSubjects() {
  try {
    const { schoolId, isSuperAdmin } = await getAuthenticatedAdmin();
    const supabase = await getAdminClient();

    // Get both global subjects (school_id IS NULL) and school-specific subjects
    // Super admin can see all subjects, regular admin sees their school's + global
    let query = supabase
      .from("subjects")
      .select(
        `
        *,
        class:classes(id, name, grade_level),
        teacher:users(id, name)
      `
      );
    
    if (isSuperAdmin) {
      // Super admin sees all subjects
      query = query.order("school_id", { ascending: true, nullsFirst: false });
    } else {
      // Regular admin sees global + their school's subjects
      query = query.or(`school_id.is.null,school_id.eq.${schoolId}`);
    }
    
    const { data, error } = await query
      .order("school_id", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Failed to get subjects:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Create a new subject
 */
export async function createSubject(formData: SubjectFormData) {
  try {
    const { schoolId: adminSchoolId, isSuperAdmin } = await getAuthenticatedAdmin();
    const supabase = await getAdminClient();

    // If school_id is explicitly set to null, create global subject
    // Super admins can create subjects for any school or global subjects
    // Regular admins can only create subjects for their own school
    const isGlobalSubject = formData.school_id === null;
    
    let targetSchoolId: string | null;
    if (isGlobalSubject) {
      targetSchoolId = null;
    } else if (isSuperAdmin && formData.school_id) {
      // Super admin selected a specific school
      targetSchoolId = formData.school_id;
    } else {
      // Regular admin: must use their own school
      if (!adminSchoolId) {
        throw new Error("Cannot create school-specific subject: No school assigned");
      }
      targetSchoolId = adminSchoolId;
    }
    
    type SubjectInsertData = {
      name: string;
      name_ar: string;
      max_grade: number;
      class_id: null;
      teacher_id: null;
      school_id: string | null;
      is_active: boolean;
      code?: string;
    };
    const insertData: SubjectInsertData = {
      name: formData.name,
      name_ar: formData.name_ar,
      max_grade: formData.max_grade || 100,
      class_id: null, // Subjects are school-wide, no class assignment
      teacher_id: null, // Teachers assigned via teacher_subject_classes table
      school_id: targetSchoolId,
      is_active: true,
    };

    // Add optional code field if provided
    if (formData.code && formData.code.trim()) {
      insertData.code = formData.code.trim();
    }

    const { data, error } = await supabase
      .from("subjects")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating subject:", error);
      throw error;
    }

    await logAuditAction(
      "CREATE",
      "subject",
      data.id,
      `Created subject: ${formData.name} ${data.school_id ? '(school-specific)' : '(global)'}`
    );

    revalidatePath("/admin/subjects");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to create subject:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Update subject information
 */
export async function updateSubject(
  subjectId: string,
  formData: SubjectFormData
) {
  try {
    await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subjects")
      .update(formData)
      .eq("id", subjectId)
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "UPDATE",
      "subject",
      subjectId,
      `Updated subject: ${formData.name}`
    );

    revalidatePath("/admin/subjects");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to update subject:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Delete subject (soft delete)
 */
export async function deleteSubject(subjectId: string, subjectName: string) {
  try {
    await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subjects")
      .update({ is_active: false })
      .eq("id", subjectId)
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "DELETE",
      "subject",
      subjectId,
      `Deactivated subject: ${subjectName}`
    );

    revalidatePath("/admin/subjects");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to delete subject:", error);
    return { data: null, error: formatActionError(error) };
  }
}

// =============================================
// ANNOUNCEMENT MANAGEMENT
// =============================================

/**
 * Get all announcements
 */
export async function getAnnouncements() {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("announcements")
      .select(
        `
        *,
        created_by_user:users!author_id(id, name),
        target_class:classes!target_class_id(id, name)
      `
      )
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Failed to get announcements:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Create a new announcement
 */
export async function createAnnouncement(formData: AnnouncementFormData) {
  try {
    const { userId, schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        ...formData,
        school_id: schoolId,
        author_id: userId,
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "CREATE",
      "announcement",
      data.id,
      `Created announcement: ${formData.title}`
    );

    revalidatePath("/admin/announcements");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to create announcement:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Update announcement
 */
export async function updateAnnouncement(
  announcementId: string,
  formData: AnnouncementFormData
) {
  try {
    await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("announcements")
      .update(formData)
      .eq("id", announcementId)
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "UPDATE",
      "announcement",
      announcementId,
      `Updated announcement: ${formData.title}`
    );

    revalidatePath("/admin/announcements");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to update announcement:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Delete announcement
 */
export async function deleteAnnouncement(
  announcementId: string,
  title: string
) {
  try {
    await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId)
      .select()
      .single();

    if (error) throw error;

    await logAuditAction(
      "DELETE",
      "announcement",
      announcementId,
      `Deleted announcement: ${title}`
    );

    revalidatePath("/admin/announcements");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to delete announcement:", error);
    return { data: null, error: formatActionError(error) };
  }
}

// =============================================
// SCHOOL SETTINGS
// =============================================

/**
 * Get all schools (for super admin) or single school (for regular admin)
 */
export async function getAllSchools() {
  try {
    const { schoolId, isSuperAdmin } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Super admins can see all schools, regular admins only see their own school
    if (isSuperAdmin) {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, name_ar")
        .order("name", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } else {
      // Regular admin: return only their school
      if (!schoolId) {
        return { data: [], error: null };
      }

      const school = await getSchoolWithCache(supabase, schoolId);
      return { data: [school], error: null };
    }
  } catch (error) {
    console.error("Failed to get schools:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Get school settings
 */
export async function getSchoolSettings() {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();
    const school = await getSchoolWithCache(supabase, schoolId);
    return { data: school, error: null };
  } catch (error) {
    console.error("Failed to get school settings:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Update school settings
 */
export async function updateSchoolSettings(formData: SchoolSettingsFormData) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("schools")
      .update(formData)
      .eq("id", schoolId)
      .select()
      .single();

    if (error) throw error;

    if (schoolId) {
      if (data) {
        setCachedSchool(schoolId, data);
      } else {
        invalidateSchoolCache(schoolId);
      }
    }

    await logAuditAction(
      "UPDATE",
      "school",
      schoolId,
      `Updated school settings`
    );

    revalidatePath("/admin/settings");

    return { data, error: null };
  } catch (error) {
    console.error("Failed to update school settings:", error);
    return { data: null, error: formatActionError(error) };
  }
}

// =============================================
// AUDIT LOGS
// =============================================

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters?: {
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  try {
    const { schoolId, isSuperAdmin } = await getAuthenticatedAdmin();
    const supabase = await getAdminClient();

    let query = supabase
      .from("audit_logs")
      .select(
        `
        *,
        user:users(id, name, role)
      `
      );
    
    // Super admin sees all audit logs, regular admin sees only their school's
    if (!isSuperAdmin && schoolId) {
      query = query.eq("school_id", schoolId);
    }
    
    query = query.order("created_at", { ascending: false });

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
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Failed to get audit logs:", error);
    return { data: null, error: formatActionError(error) };
  }
}

// =============================================
// REPORTS
// =============================================

/**
 * Generate comprehensive school report
 */
export async function generateSchoolReport(filters?: {
  startDate?: string;
  endDate?: string;
  classId?: string;
}) {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // This is a comprehensive report that could be exported
    const report = {
      schoolInfo: null as any,
      statistics: null as any,
      classes: null as any,
      students: null as any,
      attendance: null as any,
      grades: null as any,
    };

    // Get school info
    report.schoolInfo = await getSchoolWithCache(supabase, schoolId);

    // Get statistics
    report.statistics = await getDashboardStats();

    // Get classes
    const { data: classes } = await getClasses();
    report.classes = classes;

    // Get students with filters
    let studentsQuery = supabase
      .from("students")
      .select(
        `
        *,
        class:classes(name, grade_level),
        parent:users(name, email, phone)
      `
      )
      .eq("school_id", schoolId);

    if (filters?.classId) {
      studentsQuery = studentsQuery.eq("class_id", filters.classId);
    }

    const { data: students } = await studentsQuery;
    report.students = students;

    // Get attendance data
    let attendanceQuery = supabase
      .from("attendance")
      .select(
        `
        *,
        student:students(name, student_id_number),
        class:classes(name)
      `
      )
      .eq("school_id", schoolId);

    if (filters?.startDate) {
      attendanceQuery = attendanceQuery.gte("date", filters.startDate);
    }

    if (filters?.endDate) {
      attendanceQuery = attendanceQuery.lte("date", filters.endDate);
    }

    if (filters?.classId) {
      attendanceQuery = attendanceQuery.eq("class_id", filters.classId);
    }

    const { data: attendance } = await attendanceQuery;
    report.attendance = attendance;

    // Get grades data
    let gradesQuery = supabase
      .from("grades")
      .select(
        `
        *,
        student:students(name, student_id_number),
        subject:subjects(name, name_ar)
      `
      )
      .eq("school_id", schoolId);

    if (filters?.classId) {
      gradesQuery = gradesQuery.eq("class_id", filters.classId);
    }

    const { data: grades } = await gradesQuery;
    report.grades = grades;

    await logAuditAction(
      "GENERATE_REPORT",
      "school",
      schoolId,
      `Generated school report`
    );

    return { data: report, error: null };
  } catch (error) {
    console.error("Failed to generate report:", error);
    return { data: null, error: formatActionError(error) };
  }
}

/**
 * Get PDF Report Data
 * Returns formatted data for PDF generation
 */
export async function getPDFReportData() {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Get total counts
    const [studentsResult, teachersResult, classesResult] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "teacher"),
      supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    ]);

    // Get attendance statistics and grades data in parallel (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const [
      { data: attendanceData },
      { data: gradesData },
      { data: topStudents }
    ] = await Promise.all([
      // Attendance statistics
      supabase
        .from("attendance")
        .select("status")
        .eq("school_id", schoolId)
        .gte("date", dateStr),
      // Average grades (use computed percentage field for better performance)
      supabase
        .from("grades")
        .select("percentage")
        .eq("school_id", schoolId)
        .not("percentage", "is", null),
      // Top performers (students with highest average grades)
      supabase
        .from("grades")
        .select(`
          student_id,
          percentage,
          student:students(id, name, class:classes(name))
        `)
        .eq("school_id", schoolId)
        .not("percentage", "is", null)
        .limit(500) // Increased limit to get better averages
    ]);

    const totalAttendance = attendanceData?.length || 0;
    const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
    const averageAttendance = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    let averageGrade = 0;
    if (gradesData && gradesData.length > 0) {
      const totalPercentage = gradesData.reduce((sum, grade) => {
        return sum + (Number(grade.percentage) || 0);
      }, 0);
      averageGrade = totalPercentage / gradesData.length;
    }

    // Calculate average grade per student
    type TopStudentGrade = {
      student_id: string;
      percentage: number | null;
      student: Array<{
        id: string;
        name: string;
        class?: Array<{
          name: string;
        }> | null;
      }> | null;
    };
    const studentGrades = new Map<string, { name: string; class: string; grades: number[]; }>();
    
    topStudents?.forEach((grade) => {
      const studentData = Array.isArray(grade.student) ? grade.student[0] : grade.student;
      if (studentData && grade.percentage != null) {
        const studentId = studentData.id;
        const percentage = Number(grade.percentage) || 0;
        const classData = Array.isArray(studentData.class) ? studentData.class[0] : studentData.class;
        
        if (!studentGrades.has(studentId)) {
          studentGrades.set(studentId, {
            name: studentData.name,
            class: classData?.name || 'N/A',
            grades: []
          });
        }
        studentGrades.get(studentId)!.grades.push(percentage);
      }
    });

    const topPerformers = Array.from(studentGrades.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        class: data.class,
        averageGrade: data.grades.reduce((a, b) => a + b, 0) / data.grades.length
      }))
      .sort((a, b) => b.averageGrade - a.averageGrade)
      .slice(0, 5);

    // Get students needing attention (low attendance or grades)
    // Batch fetch all student data and attendance in parallel
    const [studentsResult2, allAttendanceData] = await Promise.all([
      supabase
        .from("students")
        .select(`
          id,
          name,
          class:classes(name)
        `)
        .eq("school_id", schoolId)
        .limit(100),
      supabase
        .from("attendance")
        .select("student_id, status")
        .eq("school_id", schoolId)
        .gte("date", dateStr)
    ]);

    const studentsWithStats = studentsResult2.data || [];
    type NeedsAttentionItem = {
      id: string;
      name: string;
      class: string;
      attendanceRate: number;
      averageGrade: number;
    };
    const needsAttention: NeedsAttentionItem[] = [];
    
    // Group attendance by student_id for efficient lookup
    const attendanceByStudent = new Map<string, { present: number; total: number }>();
    allAttendanceData.data?.forEach((record) => {
      const studentId = record.student_id;
      if (!attendanceByStudent.has(studentId)) {
        attendanceByStudent.set(studentId, { present: 0, total: 0 });
      }
      const stats = attendanceByStudent.get(studentId)!;
      stats.total++;
      if (record.status === 'present') {
        stats.present++;
      }
    });
    
    // Process students in memory (no more N+1 queries!)
    for (const student of studentsWithStats) {
      const attendance = attendanceByStudent.get(student.id) || { present: 0, total: 0 };
      const attendanceRate = attendance.total > 0 
        ? (attendance.present / attendance.total) * 100 
        : 100;

      // Get average grade from already-fetched data
      const studentData = studentGrades.get(student.id);
      const avgGrade = studentData ? 
        studentData.grades.reduce((a, b) => a + b, 0) / studentData.grades.length : 0;

      // Flag if attendance < 80% or grade < 60%
      if ((attendanceRate < 80 && attendance.total > 5) || (avgGrade < 60 && avgGrade > 0)) {
        // Handle array response from Supabase join
        const classData = Array.isArray(student.class) 
          ? (student.class[0] || null)
          : (student.class || null);
        needsAttention.push({
          id: student.id,
          name: student.name,
          class: classData?.name || 'N/A',
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          averageGrade: Math.round(avgGrade * 10) / 10
        });
      }

      // Limit to 5 students
      if (needsAttention.length >= 5) break;
    }

    const reportData = {
      totalStudents: studentsResult.count ?? 0,
      totalTeachers: teachersResult.count ?? 0,
      totalClasses: classesResult.count ?? 0,
      averageAttendance: Math.round(averageAttendance * 10) / 10,
      averageGrade: Math.round(averageGrade * 10) / 10,
      topPerformers: topPerformers.map(s => ({
        ...s,
        averageGrade: Math.round(s.averageGrade * 10) / 10
      })),
      needsAttention
    };

    return { data: reportData, error: null };
  } catch (error) {
    console.error("Failed to get PDF report data:", error);
    return { data: null, error: formatActionError(error) };
  }
}

// =============================================
// MANAGEMENT PAGE STATS
// =============================================

export interface StudentsPageStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  recentAdditions: number; // last 30 days
  studentsWithParents: number;
  studentsWithoutParents: number;
}

export interface TeachersPageStats {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  recentAdditions: number; // last 30 days
  teachersWithClasses: number;
  teachersWithoutClasses: number;
}

export interface ParentsPageStats {
  totalParents: number;
  activeParents: number;
  inactiveParents: number;
  recentRegistrations: number; // last 30 days
  parentsWithChildren: number;
  parentsWithoutChildren: number;
}

export interface ClassesPageStats {
  totalClasses: number;
  activeClasses: number;
  inactiveClasses: number;
  totalStudentsInClasses: number;
  averageStudentsPerClass: number;
  classesWithTeachers: number;
  classesWithoutTeachers: number;
}

export interface SubjectsPageStats {
  totalSubjects: number;
  activeSubjects: number;
  inactiveSubjects: number;
  subjectsWithTeachers: number;
  subjectsWithoutTeachers: number;
  averageGradesPerSubject: number;
}

/**
 * Get statistics for Students Management page
 */
export async function getStudentsPageStats(): Promise<StudentsPageStats> {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      { count: totalStudents },
      { count: activeStudents },
      { count: inactiveStudents },
      { count: recentAdditions },
      { data: allStudents },
    ] = await Promise.all([
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId),
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("is_active", true),
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("is_active", false),
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("students")
        .select("parent_id")
        .eq("school_id", schoolId),
    ]);

    const studentsWithParents =
      allStudents?.filter((s) => s.parent_id).length || 0;
    const studentsWithoutParents = (totalStudents || 0) - studentsWithParents;

    return {
      totalStudents: totalStudents || 0,
      activeStudents: activeStudents || 0,
      inactiveStudents: inactiveStudents || 0,
      recentAdditions: recentAdditions || 0,
      studentsWithParents,
      studentsWithoutParents,
    };
  } catch (error) {
    console.error("Failed to get students page stats:", error);
    throw error;
  }
}

/**
 * Get statistics for Teachers Management page
 */
export async function getTeachersPageStats(): Promise<TeachersPageStats> {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      { count: totalTeachers },
      { count: activeTeachers },
      { count: inactiveTeachers },
      { count: recentAdditions },
      { data: allTeachers },
      { data: classes },
    ] = await Promise.all([
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "teacher"),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "teacher")
        .eq("is_active", true),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "teacher")
        .eq("is_active", false),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "teacher")
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("users")
        .select("id")
        .eq("school_id", schoolId)
        .eq("role", "teacher"),
      supabase
        .from("classes")
        .select("main_teacher_id")
        .eq("school_id", schoolId)
        .eq("is_active", true),
    ]);

    const teacherIds = new Set(allTeachers?.map((t) => t.id) || []);
    const teachersWithClasses =
      classes?.filter((c) => c.main_teacher_id && teacherIds.has(c.main_teacher_id))
        .length || 0;
    const teachersWithoutClasses = (totalTeachers ?? 0) - teachersWithClasses;

    return {
      totalTeachers: totalTeachers ?? 0,
      activeTeachers: activeTeachers ?? 0,
      inactiveTeachers: inactiveTeachers ?? 0,
      recentAdditions: recentAdditions ?? 0,
      teachersWithClasses,
      teachersWithoutClasses,
    };
  } catch (error) {
    console.error("Failed to get teachers page stats:", error);
    throw error;
  }
}

/**
 * Get statistics for Parents Management page
 */
export async function getParentsPageStats(): Promise<ParentsPageStats> {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      { count: totalParents },
      { count: activeParents },
      { count: inactiveParents },
      { count: recentRegistrations },
      { data: allParents },
      { data: students },
    ] = await Promise.all([
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "parent"),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "parent")
        .eq("is_active", true),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "parent")
        .eq("is_active", false),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "parent")
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("users")
        .select("id")
        .eq("school_id", schoolId)
        .eq("role", "parent"),
      supabase
        .from("students")
        .select("parent_id")
        .eq("school_id", schoolId)
        .eq("is_active", true),
    ]);

    const parentIds = new Set(allParents?.map((p) => p.id) || []);
    const uniqueParentsWithChildren = new Set(
      students?.filter((s) => s.parent_id && parentIds.has(s.parent_id)).map((s) => s.parent_id) || []
    ).size;
    const parentsWithoutChildren = (totalParents ?? 0) - uniqueParentsWithChildren;

    return {
      totalParents: totalParents ?? 0,
      activeParents: activeParents ?? 0,
      inactiveParents: inactiveParents ?? 0,
      recentRegistrations: recentRegistrations ?? 0,
      parentsWithChildren: uniqueParentsWithChildren,
      parentsWithoutChildren,
    };
  } catch (error) {
    console.error("Failed to get parents page stats:", error);
    throw error;
  }
}

/**
 * Get statistics for Classes Management page
 */
export async function getClassesPageStats(): Promise<ClassesPageStats> {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const [
      { count: totalClasses },
      { count: activeClasses },
      { count: inactiveClasses },
      { data: allClasses },
      { data: students },
    ] = await Promise.all([
      supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId),
      supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("is_active", true),
      supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("is_active", false),
      supabase
        .from("classes")
        .select("id, main_teacher_id")
        .eq("school_id", schoolId),
      supabase
        .from("students")
        .select("class_id")
        .eq("school_id", schoolId)
        .eq("is_active", true),
    ]);

    const totalStudentsInClasses = students?.length || 0;
    const activeClassesCount = activeClasses || 0;
    const averageStudentsPerClass =
      activeClassesCount > 0 ? Math.round((totalStudentsInClasses / activeClassesCount) * 10) / 10 : 0;

    const classesWithTeachers =
      allClasses?.filter((c) => c.main_teacher_id).length || 0;
    const classesWithoutTeachers = (totalClasses || 0) - classesWithTeachers;

    return {
      totalClasses: totalClasses || 0,
      activeClasses: activeClasses || 0,
      inactiveClasses: inactiveClasses || 0,
      totalStudentsInClasses,
      averageStudentsPerClass,
      classesWithTeachers,
      classesWithoutTeachers,
    };
  } catch (error) {
    console.error("Failed to get classes page stats:", error);
    throw error;
  }
}

/**
 * Get statistics for Subjects Management page
 */
export async function getSubjectsPageStats(): Promise<SubjectsPageStats> {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    const [
      { count: totalSubjects },
      { count: activeSubjects },
      { count: inactiveSubjects },
      { data: allSubjects },
      { data: grades },
    ] = await Promise.all([
      supabase
        .from("subjects")
        .select("*", { count: "exact", head: true })
        .or(`school_id.is.null,school_id.eq.${schoolId}`),
      supabase
        .from("subjects")
        .select("*", { count: "exact", head: true })
        .or(`school_id.is.null,school_id.eq.${schoolId}`)
        .eq("is_active", true),
      supabase
        .from("subjects")
        .select("*", { count: "exact", head: true })
        .or(`school_id.is.null,school_id.eq.${schoolId}`)
        .eq("is_active", false),
      supabase
        .from("subjects")
        .select("id, teacher_id")
        .or(`school_id.is.null,school_id.eq.${schoolId}`),
      supabase
        .from("grades")
        .select("percentage, subject_id")
        .eq("school_id", schoolId)
        .not("percentage", "is", null),
    ]);

    const subjectsWithTeachers =
      allSubjects?.filter((s) => s.teacher_id).length || 0;
    const subjectsWithoutTeachers = (totalSubjects || 0) - subjectsWithTeachers;

    const totalGrades = grades?.length || 0;
    const totalSubjectsCount = totalSubjects || 0;
    const averageGradesPerSubject =
      totalSubjectsCount > 0 ? Math.round((totalGrades / totalSubjectsCount) * 10) / 10 : 0;

    return {
      totalSubjects: totalSubjects || 0,
      activeSubjects: activeSubjects || 0,
      inactiveSubjects: inactiveSubjects || 0,
      subjectsWithTeachers,
      subjectsWithoutTeachers,
      averageGradesPerSubject,
    };
  } catch (error) {
    console.error("Failed to get subjects page stats:", error);
    throw error;
  }
}

// =============================================
// QUICK VIEW STATS (Individual Entity Stats)
// =============================================

export interface StudentQuickViewStats {
  // Personal Information
  name: string;
  student_id_number?: string;
  date_of_birth?: string;
  gender?: string;
  enrollment_date?: string;
  is_active: boolean;
  profile_picture_url?: string;
  
  // Class Information
  class?: { 
    id: string;
    name: string; 
    grade_level: string;
    section?: string;
    academic_year?: string;
    room_number?: string;
    main_teacher?: string;
  };
  
  // Parent Information
  parent?: { 
    id: string;
    name: string; 
    email: string;
    phone?: string;
  };
  
  // Emergency Contact
  emergency_contact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  
  // Medical Information
  medical_info?: string;
  
  // Attendance Details (no percentages)
  attendance: {
    total_days: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    last_30_days: {
      total: number;
      present: number;
      absent: number;
      late: number;
    };
  };
  
  // Grades Information
  grades: {
    total: number;
    by_subject: Array<{
      subject: string;
      subject_id: string;
      count: number;
      average_grade: number;
      highest_grade: number;
      lowest_grade: number;
    }>;
    recent: Array<{
      exam_name: string;
      grade: number;
      max_grade: number;
      subject: string;
      date: string;
      teacher?: string;
    }>;
  };
  
  // Homework Information
  homework: {
    pending: number;
    completed: number;
    overdue: number;
    pending_list: Array<{
      id: string;
      title: string;
      subject: string;
      due_date: string;
      assigned_date: string;
    }>;
  };
  
  // Notes
  notes_count: number;
  recent_notes: Array<{
    id: string;
    content: string;
    teacher: string;
    date: string;
  }>;
}

export interface TeacherQuickViewStats {
  // Personal Information
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  
  // Classes Information
  classes: Array<{
    id: string;
    name: string;
    grade_level: string;
    section?: string;
    student_count: number;
    academic_year: string;
  }>;
  totalClasses: number;
  totalStudents: number;
  
  // Subjects Information
  subjects: Array<{
    id: string;
    name: string;
    name_ar?: string;
    code?: string;
    classes_count: number;
  }>;
  totalSubjects: number;
  
  // Activity Summary
  activity: {
    grades_entered: number;
    homework_assigned: number;
    attendance_taken: number;
    notes_written: number;
  };
  
  // Recent Activity
  recentActivity: Array<{
    type: string;
    description: string;
    date: string;
    entity_id?: string;
  }>;
}

export interface ClassQuickViewStats {
  // Class Information
  name: string;
  grade_level: string;
  section?: string;
  academic_year: string;
  room_number?: string;
  max_capacity: number;
  is_active: boolean;
  created_at?: string;
  
  // Main Teacher
  mainTeacher?: { 
    id: string;
    name: string; 
    email: string;
    phone?: string;
  };
  
  // Students
  totalStudents: number;
  activeStudents: number;
  students: Array<{
    id: string;
    name: string;
    student_id_number?: string;
  }>;
  
  // Subjects
  subjects: Array<{ 
    id: string;
    name: string; 
    name_ar?: string;
    teacher?: {
      id: string;
      name: string;
    };
    student_count: number;
  }>;
  
  // Attendance (no percentages)
  attendance: {
    total_days: number;
    present: number;
    absent: number;
    late: number;
    last_30_days: {
      total: number;
      present: number;
      absent: number;
      late: number;
    };
  };
  
  // Grades Summary
  grades: {
    total: number;
    average: number;
    by_subject: Array<{
      subject: string;
      subject_id: string;
      count: number;
      average: number;
    }>;
  };
}

export interface ParentQuickViewStats {
  // Personal Information
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  
  // Children Information
  totalChildren: number;
  children: Array<{
    id: string;
    name: string;
    student_id_number?: string;
    date_of_birth?: string;
    gender?: string;
    enrollment_date?: string;
    is_active: boolean;
    class?: {
      id: string;
      name: string;
      grade_level: string;
      section?: string;
      academic_year?: string;
      main_teacher?: string;
    };
    attendance: {
      total_days: number;
      present: number;
      absent: number;
      late: number;
      last_30_days: {
        total: number;
        present: number;
        absent: number;
      };
    };
    grades: {
      total: number;
      average?: number;
      by_subject: Array<{
        subject: string;
        count: number;
        average: number;
      }>;
    };
    homework: {
      pending: number;
      completed: number;
      overdue: number;
    };
  }>;
  
  // Summary Statistics
  summary: {
    totalAttendanceDays: number;
    totalPresentDays: number;
    totalAbsentDays: number;
    totalGrades: number;
    averageGrade?: number;
    totalPendingHomework: number;
    totalCompletedHomework: number;
    totalOverdueHomework: number;
  };
}

/**
 * Get quick view stats for a specific student
 */
export async function getStudentQuickViewStats(studentId: string): Promise<StudentQuickViewStats> {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Get comprehensive student info
    const { data: student } = await supabase
      .from("students")
      .select(`
        id,
        name,
        student_id_number,
        date_of_birth,
        gender,
        enrollment_date,
        is_active,
        profile_picture_url,
        emergency_contact,
        medical_info,
        classes:class_id (
          id,
          name,
          grade_level,
          section,
          academic_year,
          room_number,
          main_teacher_id,
          users:main_teacher_id (name)
        ),
        users:parent_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq("id", studentId)
      .eq("school_id", schoolId)
      .single();

    if (!student) throw new Error("Student not found");

    const classData = Array.isArray(student.classes) 
      ? student.classes[0] 
      : student.classes;
    const parentData = Array.isArray(student.users)
      ? student.users[0]
      : student.users;

    // Get all attendance records
    const { data: allAttendance } = await supabase
      .from("attendance")
      .select("status, date")
      .eq("student_id", studentId)
      .eq("school_id", schoolId);

    // Get last 30 days attendance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentAttendance } = await supabase
      .from("attendance")
      .select("status")
      .eq("student_id", studentId)
      .eq("school_id", schoolId)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

    type AttendanceRecord = {
      status: string;
      date?: string;
    };
    const attendanceStats = {
      total_days: allAttendance?.length || 0,
      present: allAttendance?.filter((a: AttendanceRecord) => a.status === "present").length || 0,
      absent: allAttendance?.filter((a: AttendanceRecord) => a.status === "absent").length || 0,
      late: allAttendance?.filter((a: AttendanceRecord) => a.status === "late").length || 0,
      excused: allAttendance?.filter((a: AttendanceRecord) => a.status === "excused").length || 0,
      last_30_days: {
        total: recentAttendance?.length || 0,
        present: recentAttendance?.filter((a: AttendanceRecord) => a.status === "present").length || 0,
        absent: recentAttendance?.filter((a: AttendanceRecord) => a.status === "absent").length || 0,
        late: recentAttendance?.filter((a: AttendanceRecord) => a.status === "late").length || 0,
      }
    };

    // Get all grades with subject grouping
    const { data: allGrades } = await supabase
      .from("grades")
      .select(`
        exam_name,
        grade,
        max_grade,
        date,
        subjects:subject_id (id, name),
        users:teacher_id (name)
      `)
      .eq("student_id", studentId)
      .eq("school_id", schoolId)
      .order("date", { ascending: false });

    // Group grades by subject
    type GradeWithSubject = {
      exam_name: string;
      grade: number;
      max_grade: number;
      date: string;
      subjects: Array<{
        id: string;
        name: string;
      }> | null;
      users: Array<{
        name: string;
      }> | null;
    };
    const gradesBySubjectMap = new Map<string, {
      subject: string;
      subject_id: string;
      grades: number[];
      max_grades: number[];
    }>();

    allGrades?.forEach((g) => {
      const subjectData = Array.isArray(g.subjects) ? g.subjects[0] : g.subjects;
      const subjectId = subjectData?.id || "unknown";
      const subjectName = subjectData?.name || "Unknown";
      
      if (!gradesBySubjectMap.has(subjectId)) {
        gradesBySubjectMap.set(subjectId, {
          subject: subjectName,
          subject_id: subjectId,
          grades: [],
          max_grades: []
        });
      }
      
      const subjectEntry = gradesBySubjectMap.get(subjectId)!;
      subjectEntry.grades.push(g.grade);
      subjectEntry.max_grades.push(g.max_grade);
    });

    const gradesBySubject = Array.from(gradesBySubjectMap.values()).map(subjectEntry => {
      const count = subjectEntry.grades.length;
      const totalGrade = subjectEntry.grades.reduce((sum, g, i) => sum + (g / subjectEntry.max_grades[i] * 100), 0);
      return {
        subject: subjectEntry.subject,
        subject_id: subjectEntry.subject_id,
        count,
        average_grade: count > 0 ? Math.round((totalGrade / count) * 10) / 10 : 0,
        highest_grade: Math.max(...subjectEntry.grades.map((g, i) => (g / subjectEntry.max_grades[i] * 100))),
        lowest_grade: Math.min(...subjectEntry.grades.map((g, i) => (g / subjectEntry.max_grades[i] * 100)))
      };
    });

    // Get recent grades (last 10)
    const recentGrades = (allGrades?.slice(0, 10) || []).map((g) => {
      const subjectData = Array.isArray(g.subjects) ? g.subjects[0] : g.subjects;
      const userData = Array.isArray(g.users) ? g.users[0] : g.users;
      return {
        exam_name: g.exam_name || "Assessment",
        grade: g.grade,
        max_grade: g.max_grade,
        subject: subjectData?.name || "Unknown",
        date: g.date,
        teacher: userData?.name || "Unknown"
      };
    });

    // Get homework details
    const { data: pendingHomework } = await supabase
      .from("homework_submissions")
      .select(`
        id,
        homework:homework_id (
          id,
          title,
          due_date,
          created_at,
          subjects:subject_id (name)
        )
      `)
      .eq("student_id", studentId)
      .is("submitted_at", null)
      .eq("is_active", true);

    type HomeworkSubmissionRow = {
      id: string;
      homework: Array<{
        id: string;
        title: string;
        due_date: string;
        created_at: string;
        subjects: Array<{
          name: string;
        }> | null;
      }> | null;
    };
    const today = new Date();
    const overdueHomework = pendingHomework?.filter((hw) => {
      const homeworkData = Array.isArray(hw.homework) ? hw.homework[0] : hw.homework;
      const dueDate = new Date(homeworkData?.due_date || "");
      return dueDate < today;
    }) || [];

    const pendingHomeworkList = (pendingHomework || []).map((hw) => {
      const homeworkData = Array.isArray(hw.homework) ? hw.homework[0] : hw.homework;
      const subjectData = homeworkData?.subjects ? (Array.isArray(homeworkData.subjects) ? homeworkData.subjects[0] : homeworkData.subjects) : null;
      return {
        id: homeworkData?.id || "",
        title: homeworkData?.title || "Unknown",
        subject: subjectData?.name || "Unknown",
        due_date: homeworkData?.due_date || "",
        assigned_date: homeworkData?.created_at || ""
      };
    });

    const { count: completedHomework } = await supabase
      .from("homework_submissions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .not("submitted_at", "is", null)
      .eq("is_active", true);

    // Get notes
    const { data: notes } = await supabase
      .from("teacher_notes")
      .select(`
        id,
        content,
        created_at,
        users:teacher_id (name)
      `)
      .eq("student_id", studentId)
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(5);

    const recentNotes = (notes || []).map(note => ({
      id: note.id,
      content: note.content,
      teacher: Array.isArray(note.users) ? (note.users[0] as any)?.name : (note.users as any)?.name || "Unknown",
      date: note.created_at
    }));

    const { count: totalNotes } = await supabase
      .from("teacher_notes")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("school_id", schoolId);

    return {
      // Personal Information
      name: student.name,
      student_id_number: student.student_id_number || undefined,
      date_of_birth: student.date_of_birth || undefined,
      gender: student.gender || undefined,
      enrollment_date: student.enrollment_date || undefined,
      is_active: student.is_active,
      profile_picture_url: student.profile_picture_url || undefined,
      
      // Class Information
      class: classData ? {
        id: (classData as any).id,
        name: (classData as any).name,
        grade_level: (classData as any).grade_level,
        section: (classData as any).section || undefined,
        academic_year: (classData as any).academic_year || undefined,
        room_number: (classData as any).room_number || undefined,
        main_teacher: Array.isArray((classData as any).users) 
          ? ((classData as any).users[0] as any)?.name 
          : ((classData as any).users as any)?.name || undefined,
      } : undefined,
      
      // Parent Information
      parent: parentData ? {
        id: (parentData as any).id,
        name: (parentData as any).name,
        email: (parentData as any).email,
        phone: (parentData as any).phone || undefined,
      } : undefined,
      
      // Emergency Contact
      emergency_contact: student.emergency_contact ? {
        name: (student.emergency_contact as any).name,
        phone: (student.emergency_contact as any).phone,
        relation: (student.emergency_contact as any).relation,
      } : undefined,
      
      // Medical Information
      medical_info: student.medical_info || undefined,
      
      // Attendance (no percentages)
      attendance: attendanceStats,
      
      // Grades Information
      grades: {
        total: allGrades?.length || 0,
        by_subject: gradesBySubject,
        recent: recentGrades,
      },
      
      // Homework Information
      homework: {
        pending: pendingHomework?.length || 0,
        completed: completedHomework || 0,
        overdue: overdueHomework.length,
        pending_list: pendingHomeworkList,
      },
      
      // Notes
      notes_count: totalNotes ?? 0,
      recent_notes: recentNotes,
    };
  } catch (error) {
    console.error("Failed to get student quick view stats:", error);
    throw error;
  }
}

/**
 * Get quick view stats for a specific teacher
 */
export async function getTeacherQuickViewStats(teacherId: string): Promise<TeacherQuickViewStats> {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Get comprehensive teacher info
    const { data: teacher } = await supabase
      .from("users")
      .select("id, name, email, phone, is_active, last_login, created_at")
      .eq("id", teacherId)
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .single();

    if (!teacher) throw new Error("Teacher not found");

    // Get classes with student counts
    const { data: classesData } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        grade_level,
        section,
        academic_year
      `)
      .eq("main_teacher_id", teacherId)
      .eq("school_id", schoolId)
      .eq("is_active", true);

    // Get student counts for each class
    const classesWithCounts = await Promise.all(
      (classesData || []).map(async (cls) => {
        const { count, error } = await supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("class_id", cls.id)
          .eq("is_active", true);
        
        if (error) {
          console.error(`Error counting students for class ${cls.id}:`, error);
        }
        
        return {
          id: cls.id,
          name: cls.name,
          grade_level: cls.grade_level,
          section: cls.section || undefined,
          student_count: count ?? 0,
          academic_year: cls.academic_year,
        };
      })
    );

    const totalStudentsCount = classesWithCounts.reduce((sum, c) => sum + c.student_count, 0);

    // Get subjects from junction table (new method) or fallback to legacy method
    type SubjectMapValue = {
      id: string;
      name: string;
      name_ar?: string;
      code?: string;
      classes: Set<string>;
    };
    const subjectsMap = new Map<string, SubjectMapValue>();

    // Try to get subjects from teacher_subject_classes junction table
    const { data: junctionData, error: junctionError } = await supabase
      .from("teacher_subject_classes")
      .select(`
        subject_id,
        class_id,
        subjects:subject_id (
          id,
          name,
          name_ar,
          code
        )
      `)
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId);

    if (!junctionError && junctionData && junctionData.length > 0) {
      // Use junction table data
      type JunctionItem = {
        subject_id: string;
        class_id: string | null;
        subjects: Array<{
          id: string;
          name: string;
          name_ar?: string | null;
          code?: string | null;
        }> | null;
      };
      junctionData.forEach((item) => {
        const subject = Array.isArray(item.subjects) ? item.subjects[0] : item.subjects;
        if (!subject) return;
        
        const key = subject.id;
        if (!subjectsMap.has(key)) {
          subjectsMap.set(key, {
            id: subject.id,
            name: subject.name,
            name_ar: subject.name_ar || undefined,
            code: subject.code || undefined,
            classes: new Set(),
          });
        }
        if (item.class_id) {
          subjectsMap.get(key)!.classes.add(item.class_id);
        }
      });
    } else {
      // Fallback to legacy method: query subjects directly
      const { data: legacySubjectsData, error: legacyError } = await supabase
        .from("subjects")
        .select(`
          id,
          name,
          name_ar,
          code,
          class_id
        `)
        .eq("teacher_id", teacherId)
        .or(`school_id.is.null,school_id.eq.${schoolId}`)
        .eq("is_active", true);

      if (legacyError) {
        console.error("Error fetching subjects (legacy):", legacyError);
      } else if (legacySubjectsData) {
        type LegacySubject = {
          id: string;
          name: string;
          name_ar?: string | null;
          code?: string | null;
          class_id?: string | null;
        };
        legacySubjectsData.forEach((subj: LegacySubject) => {
          const key = subj.id;
          if (!subjectsMap.has(key)) {
            subjectsMap.set(key, {
              id: subj.id,
              name: subj.name,
              name_ar: subj.name_ar || undefined,
              code: subj.code || undefined,
              classes: new Set(),
            });
          }
          if (subj.class_id) {
            subjectsMap.get(key)!.classes.add(subj.class_id);
          }
        });
      }
    }

    const subjectsWithCounts = Array.from(subjectsMap.values()).map(subj => ({
      id: subj.id,
      name: subj.name,
      name_ar: subj.name_ar,
      code: subj.code,
      classes_count: subj.classes.size || 1, // If no classes, assume 1 (all classes)
    }));

    // Get activity counts
    const [gradesResult, homeworkResult, attendanceResult, notesResult] = await Promise.all([
      supabase.from("grades").select("id", { count: "exact", head: true })
        .eq("teacher_id", teacherId).eq("school_id", schoolId),
      supabase.from("homework").select("id", { count: "exact", head: true })
        .eq("teacher_id", teacherId).eq("school_id", schoolId),
      supabase.from("attendance").select("id", { count: "exact", head: true })
        .eq("marked_by", teacherId).eq("school_id", schoolId),
      supabase.from("teacher_notes").select("id", { count: "exact", head: true })
        .eq("teacher_id", teacherId).eq("school_id", schoolId),
    ]);

    // Check for errors and log them, extract counts properly
    if (gradesResult.error) {
      console.error("Error fetching grades count:", gradesResult.error);
    }
    if (homeworkResult.error) {
      console.error("Error fetching homework count:", homeworkResult.error);
    }
    if (attendanceResult.error) {
      console.error("Error fetching attendance count:", attendanceResult.error);
    }
    if (notesResult.error) {
      console.error("Error fetching notes count:", notesResult.error);
    }

    // Get recent activity
    const recentActivity: Array<{
      type: string;
      description: string;
      date: string;
      entity_id?: string;
    }> = [];

    // Recent homework
    const { data: recentHomework } = await supabase
      .from("homework")
      .select("id, title, created_at")
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(5);

    recentHomework?.forEach(hw => {
      recentActivity.push({
        type: "homework",
        description: `Created homework: ${hw.title}`,
        date: hw.created_at,
        entity_id: hw.id,
      });
    });

    // Recent grades
    type RecentGrade = {
      id: string;
      exam_name: string;
      date: string;
      subjects: Array<{
        name: string;
      }> | null;
    };
    const { data: recentGrades } = await supabase
      .from("grades")
      .select("id, exam_name, date, subjects:subject_id(name)")
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId)
      .order("date", { ascending: false })
      .limit(5);

    recentGrades?.forEach((grade) => {
      const subjectData = Array.isArray(grade.subjects) ? grade.subjects[0] : grade.subjects;
      recentActivity.push({
        type: "grade",
        description: `Entered grade for ${subjectData?.name || "subject"}`,
        date: grade.date,
        entity_id: grade.id,
      });
    });

    // Sort by date and limit to 10
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    recentActivity.splice(10);

    return {
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || undefined,
      is_active: teacher.is_active,
      last_login: teacher.last_login || undefined,
      created_at: teacher.created_at || undefined,
      classes: classesWithCounts,
      totalClasses: classesWithCounts.length,
      totalStudents: totalStudentsCount,
      subjects: subjectsWithCounts,
      totalSubjects: subjectsWithCounts.length,
      activity: {
        grades_entered: gradesResult.count ?? 0,
        homework_assigned: homeworkResult.count ?? 0,
        attendance_taken: attendanceResult.count ?? 0,
        notes_written: notesResult.count ?? 0,
      },
      recentActivity,
    };
  } catch (error) {
    console.error("Failed to get teacher quick view stats:", error);
    throw error;
  }
}

/**
 * Get quick view stats for a specific class
 */
export async function getClassQuickViewStats(classId: string): Promise<ClassQuickViewStats> {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Get comprehensive class info
    const { data: classData } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        grade_level,
        section,
        academic_year,
        room_number,
        max_capacity,
        is_active,
        created_at,
        users:main_teacher_id (id, name, email, phone)
      `)
      .eq("id", classId)
      .eq("school_id", schoolId)
      .single();

    if (!classData) throw new Error("Class not found");

    // Get students
    const { data: students } = await supabase
      .from("students")
      .select("id, name, student_id_number, is_active")
      .eq("class_id", classId)
      .eq("school_id", schoolId);

    const activeStudents = students?.filter(s => s.is_active).length || 0;
    const studentsList = (students || []).slice(0, 10).map(s => ({
      id: s.id,
      name: s.name,
      student_id_number: s.student_id_number || undefined,
    }));

    const studentIds = students?.map(s => s.id) || [];

    // Get all attendance records for this class
    const { data: allAttendance } = await supabase
      .from("attendance")
      .select("status, date")
      .eq("class_id", classId)
      .eq("school_id", schoolId);

    // Get last 30 days attendance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentAttendance } = await supabase
      .from("attendance")
      .select("status")
      .eq("class_id", classId)
      .eq("school_id", schoolId)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

    const attendanceStats = {
      total_days: allAttendance?.length || 0,
      present: allAttendance?.filter(a => a.status === "present").length || 0,
      absent: allAttendance?.filter(a => a.status === "absent").length || 0,
      late: allAttendance?.filter(a => a.status === "late").length || 0,
      last_30_days: {
        total: recentAttendance?.length || 0,
        present: recentAttendance?.filter(a => a.status === "present").length || 0,
        absent: recentAttendance?.filter(a => a.status === "absent").length || 0,
        late: recentAttendance?.filter(a => a.status === "late").length || 0,
      }
    };

    // Get grades grouped by subject
    // Grades are linked to students, not directly to classes, so we need to filter by student_id
    const { data: allGrades } = studentIds.length > 0
      ? await supabase
          .from("grades")
          .select(`
            percentage,
            subjects:subject_id (id, name)
          `)
          .in("student_id", studentIds)
          .eq("school_id", schoolId)
          .not("percentage", "is", null)
      : { data: null };

    type GradeWithSubjectForClass = {
      percentage: number;
      subjects: Array<{
        id: string;
        name: string;
      }> | null;
    };
    const gradesBySubjectMap = new Map<string, {
      subject: string;
      subject_id: string;
      grades: number[];
    }>();

    allGrades?.forEach((g) => {
      const subjectData = Array.isArray(g.subjects) ? g.subjects[0] : g.subjects;
      const subjectId = subjectData?.id || "unknown";
      const subjectName = subjectData?.name || "Unknown";
      
      if (!gradesBySubjectMap.has(subjectId)) {
        gradesBySubjectMap.set(subjectId, {
          subject: subjectName,
          subject_id: subjectId,
          grades: [],
        });
      }
      
      gradesBySubjectMap.get(subjectId)!.grades.push(Number(g.percentage || 0));
    });

    const gradesBySubject = Array.from(gradesBySubjectMap.values()).map(subjData => {
      const count = subjData.grades.length;
      const average = count > 0
        ? Math.round((subjData.grades.reduce((sum, g) => sum + g, 0) / count) * 10) / 10
        : 0;
      return {
        subject: subjData.subject,
        subject_id: subjData.subject_id,
        count,
        average,
      };
    });

    const totalGrades = allGrades?.length || 0;
    const averageGrade = totalGrades > 0
      ? Math.round((allGrades!.reduce((sum, g) => sum + Number(g.percentage || 0), 0) / totalGrades) * 10) / 10
      : 0;

    // Get subjects with teachers
    const { data: subjects } = await supabase
      .from("subjects")
      .select(`
        id,
        name,
        name_ar,
        users:teacher_id (id, name)
      `)
      .eq("class_id", classId)
      .or(`school_id.is.null,school_id.eq.${schoolId}`)
      .eq("is_active", true);

    // Count students per subject (students who have grades in that subject)
    // Since grades are linked to students, we filter by student_id in this class
    type SubjectWithTeacher = {
      id: string;
      name: string;
      name_ar?: string | null;
      users: {
        id: string;
        name: string;
      } | {
        id: string;
        name: string;
      }[] | null;
    };
    const subjectsWithCounts = await Promise.all(
      (subjects || []).map(async (subj: SubjectWithTeacher) => {
        const result = studentIds.length > 0
          ? await supabase
              .from("grades")
              .select("student_id", { count: "exact", head: true })
              .eq("subject_id", subj.id)
              .in("student_id", studentIds)
              .eq("school_id", schoolId)
          : { count: 0, error: null };
        
        if (result.error) {
          console.error(`Error counting students for subject ${subj.id}:`, result.error);
        }
        
        const count = result.count ?? 0;
        
        const teacherData = Array.isArray(subj.users) ? subj.users[0] : subj.users;
        
        return {
          id: subj.id,
          name: subj.name,
          name_ar: subj.name_ar || undefined,
          teacher: teacherData ? {
            id: teacherData.id,
            name: teacherData.name,
          } : undefined,
          student_count: count,
        };
      })
    );

    type ClassDataWithTeacher = {
      id: string;
      name: string;
      grade_level: string;
      section: string | null;
      academic_year: string | null;
      room_number: string | null;
      max_capacity: number | null;
      is_active: boolean;
      created_at: string | null;
      users: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
      } | {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
      }[] | null;
    };
    const typedClassData = classData as ClassDataWithTeacher;
    const teacherData = Array.isArray(typedClassData.users) 
      ? typedClassData.users[0] 
      : typedClassData.users;

    return {
      name: typedClassData.name,
      grade_level: typedClassData.grade_level,
      section: typedClassData.section || undefined,
      academic_year: typedClassData.academic_year || "",
      room_number: typedClassData.room_number || undefined,
      max_capacity: typedClassData.max_capacity ?? 0,
      is_active: typedClassData.is_active,
      created_at: typedClassData.created_at || undefined,
      mainTeacher: teacherData ? {
        id: teacherData.id,
        name: teacherData.name,
        email: teacherData.email || "",
        phone: teacherData.phone || undefined,
      } : undefined,
      totalStudents: students?.length || 0,
      activeStudents,
      students: studentsList,
      subjects: subjectsWithCounts,
      attendance: attendanceStats,
      grades: {
        total: totalGrades,
        average: averageGrade,
        by_subject: gradesBySubject,
      },
    };
  } catch (error) {
    console.error("Failed to get class quick view stats:", error);
    throw error;
  }
}

/**
 * Get quick view stats for a specific parent
 */
export async function getParentQuickViewStats(parentId: string): Promise<ParentQuickViewStats> {
  try {
    const { schoolId } = await getAuthenticatedAdmin();
    const supabase = await createClient();

    // Get comprehensive parent info
    const { data: parent } = await supabase
      .from("users")
      .select("id, name, email, phone, is_active, last_login, created_at")
      .eq("id", parentId)
      .eq("school_id", schoolId)
      .eq("role", "parent")
      .single();

    if (!parent) throw new Error("Parent not found");

    // Get all children
    const { data: children } = await supabase
      .from("students")
      .select(`
        id,
        name,
        student_id_number,
        date_of_birth,
        gender,
        enrollment_date,
        is_active,
        class_id,
        classes:class_id (
          id,
          name,
          grade_level,
          section,
          academic_year,
          main_teacher_id,
          users:main_teacher_id (name)
        )
      `)
      .eq("parent_id", parentId)
      .eq("school_id", schoolId)
      .order("name");

    const childrenIds = (children || []).map(child => child.id);

    // Get attendance for all children
    const { data: allAttendance } = childrenIds.length > 0 ? await supabase
      .from("attendance")
      .select("student_id, status, date")
      .in("student_id", childrenIds)
      .eq("school_id", schoolId) : { data: [] };

    // Get last 30 days attendance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentAttendance } = childrenIds.length > 0 ? await supabase
      .from("attendance")
      .select("student_id, status")
      .in("student_id", childrenIds)
      .eq("school_id", schoolId)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]) : { data: [] };

    // Get grades for all children
    const { data: allGrades } = childrenIds.length > 0 ? await supabase
      .from("grades")
      .select("student_id, grade, max_grade, percentage, subject_id, subjects:subject_id (name)")
      .in("student_id", childrenIds)
      .eq("school_id", schoolId)
      .eq("is_active", true) : { data: [] };

    // Get homework for all children
    const { data: allHomework } = childrenIds.length > 0 ? await supabase
      .from("homework_submissions")
      .select("student_id, submitted_at, homework:homework_id (due_date)")
      .in("student_id", childrenIds)
      .eq("school_id", schoolId)
      .eq("is_active", true) : { data: [] };

    // Process children with their stats
    type AttendanceRecordForParent = {
      student_id: string;
      status: string;
    };
    type GradeRecordForParent = {
      student_id: string;
      grade: number;
      max_grade: number;
      percentage: number | null;
      subject_id: string;
      subjects: {
        name: string;
      } | {
        name: string;
      }[] | null;
    };
    type HomeworkSubmissionForParent = {
      student_id: string;
      submitted_at: string | null;
      homework: {
        due_date: string;
      } | {
        due_date: string;
      }[] | null;
    };
    type ChildWithClass = {
      id: string;
      name: string;
      student_id_number: string | null;
      date_of_birth: string;
      gender: string;
      enrollment_date: string | null;
      is_active: boolean;
      classes: {
        id: string;
        name: string;
        grade_level: string;
        section: string | null;
        academic_year: string | null;
        users: {
          name: string;
        } | {
          name: string;
        }[] | null;
      } | {
        id: string;
        name: string;
        grade_level: string;
        section: string | null;
        academic_year: string | null;
        users: {
          name: string;
        } | {
          name: string;
        }[] | null;
      }[] | null;
    };
    const childrenWithStats = await Promise.all(
      (children || []).map(async (child: ChildWithClass) => {
        const childAttendance = allAttendance?.filter((a: AttendanceRecordForParent) => a.student_id === child.id) || [];
        const childRecentAttendance = recentAttendance?.filter((a: AttendanceRecordForParent) => a.student_id === child.id) || [];
        
        const attendanceStats = {
          total_days: childAttendance.length,
          present: childAttendance.filter((a: AttendanceRecordForParent) => a.status === "present").length,
          absent: childAttendance.filter((a: AttendanceRecordForParent) => a.status === "absent").length,
          late: childAttendance.filter((a: AttendanceRecordForParent) => a.status === "late").length,
          last_30_days: {
            total: childRecentAttendance.length,
            present: childRecentAttendance.filter((a: AttendanceRecordForParent) => a.status === "present").length,
            absent: childRecentAttendance.filter((a: AttendanceRecordForParent) => a.status === "absent").length,
          },
        };

        const childGrades = allGrades?.filter((g: GradeRecordForParent) => g.student_id === child.id) || [];
        const gradesBySubjectMap = new Map<string, { count: number; total: number }>();
        
        childGrades.forEach((grade: GradeRecordForParent) => {
          const subjectName = Array.isArray(grade.subjects) 
            ? grade.subjects[0]?.name 
            : grade.subjects?.name || "Unknown";
          
          if (!gradesBySubjectMap.has(subjectName)) {
            gradesBySubjectMap.set(subjectName, { count: 0, total: 0 });
          }
          
          const subjectData = gradesBySubjectMap.get(subjectName)!;
          subjectData.count++;
          
          if (typeof grade.percentage === "number") {
            subjectData.total += grade.percentage;
          } else if (
            typeof grade.grade === "number" &&
            typeof grade.max_grade === "number" &&
            grade.max_grade > 0
          ) {
            subjectData.total += (grade.grade / grade.max_grade) * 100;
          }
        });

        const gradesBySubject = Array.from(gradesBySubjectMap.entries()).map(([subject, data]) => ({
          subject,
          count: data.count,
          average: data.count > 0 ? Math.round(data.total / data.count) : 0,
        }));

        const totalGradeValue = childGrades.reduce((sum: number, grade: GradeRecordForParent) => {
          if (typeof grade.percentage === "number") {
            return sum + grade.percentage;
          }
          if (
            typeof grade.grade === "number" &&
            typeof grade.max_grade === "number" &&
            grade.max_grade > 0
          ) {
            return sum + (grade.grade / grade.max_grade) * 100;
          }
          return sum;
        }, 0);
        const averageGrade = childGrades.length > 0 ? Math.round(totalGradeValue / childGrades.length) : undefined;

        const childHomework = allHomework?.filter((h: HomeworkSubmissionForParent) => h.student_id === child.id) || [];
        const now = new Date();
        const pendingHomework = childHomework.filter((h: HomeworkSubmissionForParent) => !h.submitted_at).length;
        const completedHomework = childHomework.filter((h: HomeworkSubmissionForParent) => h.submitted_at).length;
        const overdueHomework = childHomework.filter((h: HomeworkSubmissionForParent) => {
          if (h.submitted_at) return false;
          const homework = Array.isArray(h.homework) ? h.homework[0] : h.homework;
          const dueDate = homework?.due_date ? new Date(homework.due_date) : null;
          return dueDate && dueDate < now;
        }).length;

        const classData = Array.isArray(child.classes) 
          ? child.classes[0] 
          : child.classes;

        return {
          id: child.id,
          name: child.name,
          student_id_number: child.student_id_number || undefined,
          date_of_birth: child.date_of_birth || undefined,
          gender: child.gender || undefined,
          enrollment_date: child.enrollment_date || undefined,
          is_active: child.is_active,
          class: classData ? {
            id: classData.id,
            name: classData.name,
            grade_level: classData.grade_level,
            section: classData.section || undefined,
            academic_year: classData.academic_year || undefined,
            main_teacher: Array.isArray(classData.users)
              ? classData.users[0]?.name
              : classData.users?.name || undefined,
          } : undefined,
          attendance: attendanceStats,
          grades: {
            total: childGrades.length,
            average: averageGrade,
            by_subject: gradesBySubject,
          },
          homework: {
            pending: pendingHomework,
            completed: completedHomework,
            overdue: overdueHomework,
          },
        };
      })
    );

    // Calculate summary statistics
    const summary = {
      totalAttendanceDays: allAttendance?.length || 0,
      totalPresentDays: allAttendance?.filter((a: AttendanceRecordForParent) => a.status === "present").length || 0,
      totalAbsentDays: allAttendance?.filter((a: AttendanceRecordForParent) => a.status === "absent").length || 0,
      totalGrades: allGrades?.length || 0,
      averageGrade: allGrades && allGrades.length > 0
        ? Math.round(
            allGrades.reduce((sum: number, grade: GradeRecordForParent) => {
              if (typeof grade.percentage === "number") {
                return sum + grade.percentage;
              }
              if (
                typeof grade.grade === "number" &&
                typeof grade.max_grade === "number" &&
                grade.max_grade > 0
              ) {
                return sum + (grade.grade / grade.max_grade) * 100;
              }
              return sum;
            }, 0) / allGrades.length
          )
        : undefined,
      totalPendingHomework: allHomework?.filter((h: HomeworkSubmissionForParent) => !h.submitted_at).length || 0,
      totalCompletedHomework: allHomework?.filter((h: HomeworkSubmissionForParent) => h.submitted_at).length || 0,
      totalOverdueHomework: allHomework?.filter((h: HomeworkSubmissionForParent) => {
        if (h.submitted_at) return false;
        const homework = Array.isArray(h.homework) ? h.homework[0] : h.homework;
        const dueDate = homework?.due_date ? new Date(homework.due_date) : null;
        return dueDate && dueDate < new Date();
      }).length || 0,
    };

    return {
      name: parent.name,
      email: parent.email,
      phone: parent.phone || undefined,
      is_active: parent.is_active,
      last_login: parent.last_login || undefined,
      created_at: parent.created_at || undefined,
      totalChildren: childrenWithStats.length,
      children: childrenWithStats,
      summary,
    };
  } catch (error) {
    console.error("Failed to get parent quick view stats:", error);
    throw error;
  }
}

