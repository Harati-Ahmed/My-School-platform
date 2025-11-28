"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Shared attendance actions for Admin, HR, and Teachers
 */

/**
 * Get class attendance for a specific date
 */
export async function getClassAttendance(classId: string, date: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get user role to verify permissions
  const { data: userProfile } = await supabase
    .from("users")
    .select("role, school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  // Verify user has permission (admin, hr, or teacher)
  if (!["admin", "hr", "teacher"].includes(userProfile.role)) {
    throw new Error("Unauthorized");
  }

  // Get students in the class
  const { data: students } = await supabase
    .from("students")
    .select("id, name, student_id_number")
    .eq("class_id", classId)
    .eq("school_id", userProfile.school_id)
    .eq("is_active", true)
    .order("name");

  // Get attendance records for this date
  const { data: attendance, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("class_id", classId)
    .eq("school_id", userProfile.school_id)
    .eq("date", date);

  if (error) throw error;

  return {
    students: students || [],
    attendance: attendance || [],
  };
}

/**
 * Mark attendance in bulk
 * Works for admin, HR, and teachers
 */
export async function markAttendanceBulk(attendanceRecords: Array<{
  student_id: string;
  class_id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  note?: string;
}>, revalidatePaths?: string[]) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("role, school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  // Verify user has permission (admin, hr, or teacher)
  if (!["admin", "hr", "teacher"].includes(userProfile.role)) {
    throw new Error("Unauthorized");
  }

  // Check if attendance already exists for this date
  const { data: existingAttendance } = await supabase
    .from("attendance")
    .select("id, student_id")
    .eq("class_id", attendanceRecords[0].class_id)
    .eq("school_id", userProfile.school_id)
    .eq("date", attendanceRecords[0].date);

  const existingMap = new Map(existingAttendance?.map(a => [a.student_id, a.id]) || []);

  const toInsert: any[] = [];
  const toUpdate: any[] = [];

  attendanceRecords.forEach((record) => {
    const recordWithMetadata = {
      ...record,
      marked_by: user.id,
      school_id: userProfile.school_id,
    };

    if (existingMap.has(record.student_id)) {
      toUpdate.push({
        id: existingMap.get(record.student_id),
        ...recordWithMetadata,
      });
    } else {
      toInsert.push(recordWithMetadata);
    }
  });

  // Insert new records
  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("attendance")
      .insert(toInsert);

    if (insertError) throw insertError;
  }

  // Update existing records
  for (const record of toUpdate) {
    const { error: updateError } = await supabase
      .from("attendance")
      .update({
        status: record.status,
        note: record.note,
        marked_by: record.marked_by,
      })
      .eq("id", record.id);

    if (updateError) throw updateError;
  }

  // Revalidate paths
  const pathsToRevalidate = revalidatePaths || ["/admin/attendance", "/hr/attendance", "/teacher/attendance"];
  pathsToRevalidate.forEach(path => revalidatePath(path));

  return { success: true };
}

/**
 * Get attendance statistics for a class
 */
export async function getClassAttendanceStats(classId: string, startDate: string, endDate: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  const { data: attendance, error } = await supabase
    .from("attendance")
    .select("student_id, status, date")
    .eq("class_id", classId)
    .eq("school_id", userProfile.school_id)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw error;

  return attendance || [];
}

/**
 * Get all classes for attendance marking
 * Returns classes that the user has permission to mark attendance for
 */
export async function getClassesForAttendance() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("role, school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  // Admin and HR can see all classes
  if (userProfile.role === "admin" || userProfile.role === "hr") {
    const { data: classes, error } = await supabase
      .from("classes")
      .select("id, name, grade_level, section, academic_year")
      .eq("school_id", userProfile.school_id)
      .eq("is_active", true)
      .order("grade_level", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return classes || [];
  }

  // Teachers can only see their own classes
  if (userProfile.role === "teacher") {
    const { data: classes, error } = await supabase
      .from("classes")
      .select("id, name, grade_level, section, academic_year")
      .eq("school_id", userProfile.school_id)
      .eq("main_teacher_id", user.id)
      .eq("is_active", true)
      .order("grade_level", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return classes || [];
  }

  return [];
}

