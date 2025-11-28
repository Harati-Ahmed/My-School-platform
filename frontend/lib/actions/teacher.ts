"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type TeacherSubjectOption = {
  id: string;
  name: string;
  name_ar?: string | null;
  class_id: string;
  classes?: {
    id: string;
    name?: string | null;
    grade_level?: string | null;
    section?: string | null;
  } | null;
};

interface TeacherAssignmentContext {
  classSubjectsMap: Map<string, TeacherSubjectOption[]>;
  subjectOptions: TeacherSubjectOption[];
  classIds: Set<string>;
  mainClassIds: Set<string>;
}

async function loadTeacherAssignmentContext(
  supabase: SupabaseServerClient,
  teacherId: string,
  schoolId: string
): Promise<TeacherAssignmentContext> {
  const classSubjectsMap = new Map<string, TeacherSubjectOption[]>();
  const subjectOptions: TeacherSubjectOption[] = [];
  const seenPairs = new Set<string>();

  const addSubject = (
    classId: string | null | undefined,
    subject: TeacherSubjectOption
  ) => {
    if (!classId) {
      return;
    }

    const pairKey = `${subject.id}:${classId}`;
    if (seenPairs.has(pairKey)) {
      return;
    }
    seenPairs.add(pairKey);

    const normalizedSubject: TeacherSubjectOption = {
      ...subject,
      class_id: classId,
    };

    subjectOptions.push(normalizedSubject);
    const existing = classSubjectsMap.get(classId) ?? [];
    classSubjectsMap.set(classId, [...existing, normalizedSubject]);
  };

  const { data: assignmentRows, error: assignmentsError } = await supabase
    .from("teacher_subject_classes")
    .select(`
      id,
      subject_id,
      class_id,
      subjects:subject_id (
        id,
        name,
        name_ar,
        class_id
      ),
      classes:class_id (
        id,
        name,
        grade_level,
        section
      )
    `)
    .eq("teacher_id", teacherId)
    .eq("school_id", schoolId);

  if (assignmentsError) {
    console.warn(
      "Failed to load teacher_subject_classes assignments:",
      assignmentsError.message
    );
  } else {
    assignmentRows?.forEach((assignment) => {
      const subjectRecord = Array.isArray(assignment.subjects) ? assignment.subjects[0] : assignment.subjects;
      if (!subjectRecord) {
        return;
      }

      const resolvedClassId = assignment.class_id || subjectRecord.class_id;
      if (!resolvedClassId) {
        return;
      }

      const classData = Array.isArray(assignment.classes) ? assignment.classes[0] : assignment.classes;
      addSubject(resolvedClassId, {
        id: subjectRecord.id,
        name: subjectRecord.name,
        name_ar: subjectRecord.name_ar,
        class_id: resolvedClassId,
        classes: classData ?? null,
      });
    });
  }

  const { data: legacySubjects, error: legacySubjectsError } = await supabase
    .from("subjects")
    .select(`
      id,
      name,
      name_ar,
      class_id,
      classes:class_id (
        id,
        name,
        grade_level,
        section
      )
    `)
    .eq("teacher_id", teacherId)
    .or(`school_id.is.null,school_id.eq.${schoolId}`)
    .eq("is_active", true);

  if (legacySubjectsError) {
    console.warn(
      "Failed to load legacy subject assignments:",
      legacySubjectsError.message
    );
  } else {
    legacySubjects?.forEach((subject) => {
      if (!subject.class_id) {
        return;
      }

      const classData = Array.isArray(subject.classes) ? subject.classes[0] : subject.classes;
      addSubject(subject.class_id, {
        id: subject.id,
        name: subject.name,
        name_ar: subject.name_ar,
        class_id: subject.class_id,
        classes: classData ?? null,
      });
    });
  }

  const { data: mainClasses, error: mainClassesError } = await supabase
    .from("classes")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .eq("main_teacher_id", teacherId);

  if (mainClassesError) {
    console.warn(
      "Failed to load main teacher classes:",
      mainClassesError.message
    );
  }

  const classIds = new Set<string>();
  subjectOptions.forEach((subject) => {
    if (subject.class_id) {
      classIds.add(subject.class_id);
    }
  });

  const mainClassIds = new Set<string>(
    (mainClasses ?? []).map((cls) => cls.id)
  );
  mainClassIds.forEach((id) => classIds.add(id));

  subjectOptions.sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, {
      sensitivity: "base",
    })
  );

  classSubjectsMap.forEach((subjects, classId) => {
    classSubjectsMap.set(
      classId,
      [...subjects].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        })
      )
    );
  });

  return {
    classSubjectsMap,
    subjectOptions,
    classIds,
    mainClassIds,
  };
}

/**
 * Get teacher dashboard statistics
 */
export async function getTeacherDashboardStats() {
  const perfLabel = `getTeacherDashboardStats_${randomUUID().slice(0, 8)}`;
  console.time(perfLabel);
  const supabase = await createClient();
  
  const authStart = performance.now();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();
  console.timeLog(perfLabel, `Auth: ${(performance.now() - authStart).toFixed(2)}ms`);

  if (!userProfile) throw new Error("User profile not found");

  // Fetch classes and junction mappings in parallel to reduce latency
  const classesStart = performance.now();
  const [mainClassesResult, junctionResult] = await Promise.all([
    supabase
    .from("classes")
    .select("id")
    .eq("main_teacher_id", user.id)
      .eq("is_active", true),
    supabase
    .from("teacher_subject_classes")
    .select("class_id")
    .eq("teacher_id", user.id)
      .eq("school_id", userProfile.school_id),
  ]);

  const mainClasses = mainClassesResult.data;
  const { data: junctionData, error: junctionError } = junctionResult;

  let subjectClassIds: string[] = [];
  
  if (!junctionError && junctionData && junctionData.length > 0) {
    subjectClassIds = junctionData
      .map((item: any) => item.class_id)
      .filter((id: string | null) => id !== null);
  } else {
    const { data: subjectClasses } = await supabase
      .from("subjects")
      .select("class_id")
      .eq("teacher_id", user.id);
    
    subjectClassIds = subjectClasses?.map((s) => s.class_id).filter(Boolean) || [];
  }

  const classIds = [...(mainClasses?.map((c) => c.id) || []), ...subjectClassIds];
  const uniqueClassIds = [...new Set(classIds)];
  console.timeLog(perfLabel, `Classes query: ${(performance.now() - classesStart).toFixed(2)}ms (${uniqueClassIds.length} classes)`);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const studentsPromise =
    uniqueClassIds.length > 0
      ? supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("school_id", userProfile.school_id)
        .eq("is_active", true)
        .in("class_id", uniqueClassIds)
      : Promise.resolve({ count: 0 });
  
  const pendingHomeworkPromise = supabase
    .from("homework")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", user.id)
    .eq("is_published", true)
    .gte("due_date", new Date().toISOString())
    .lte("due_date", nextWeek.toISOString());

  const recentGradesPromise = supabase
    .from("grades")
    .select("percentage")
    .eq("teacher_id", user.id)
    .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const statsStart = performance.now();
  const [{ count: totalStudents = 0 }, { count: pendingHomework = 0 }, { data: recentGrades }] =
    await Promise.all([studentsPromise, pendingHomeworkPromise, recentGradesPromise]);
  console.timeLog(perfLabel, `Stats queries: ${(performance.now() - statsStart).toFixed(2)}ms`);

  const averagePerformance =
    recentGrades && recentGrades.length > 0
    ? Math.round(recentGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / recentGrades.length)
    : 0;

  console.timeEnd(perfLabel);
  return {
    totalStudents,
    activeClasses: uniqueClassIds.length,
    pendingHomework,
    averagePerformance,
  };
}

/**
 * Get teacher's classes with student counts
 */
export async function getTeacherClasses() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  const {
    classIds,
    classSubjectsMap,
    mainClassIds,
  } = await loadTeacherAssignmentContext(supabase, user.id, userProfile.school_id);

  if (classIds.size === 0) {
    return [];
  }

  const classIdsArray = Array.from(classIds);

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select(`
      id,
      name,
      grade_level,
      section,
      academic_year,
      room_number,
      main_teacher_id
    `)
    .in("id", classIdsArray)
    .eq("school_id", userProfile.school_id)
    .eq("is_active", true)
    .order("name");

  if (classesError) throw classesError;
  if (!classes || classes.length === 0) {
    return [];
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, class_id")
    .in("class_id", classIdsArray)
    .eq("is_active", true);

  const studentCountMap = new Map<string, number>();
  students?.forEach((student) => {
    const count = studentCountMap.get(student.class_id) || 0;
    studentCountMap.set(student.class_id, count + 1);
  });

  return classes.map((cls) => ({
    ...cls,
    studentCount: studentCountMap.get(cls.id) || 0,
    role: mainClassIds.has(cls.id) ? "main_teacher" : "subject_teacher",
    subjects: classSubjectsMap.get(cls.id) ?? [],
  }));
}

/**
 * Get students in a specific class
 */
export async function getClassStudents(classId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  const { classIds } = await loadTeacherAssignmentContext(
    supabase,
    user.id,
    userProfile.school_id
  );

  if (!classIds.has(classId)) {
    throw new Error("Unauthorized access to class");
  }

  const { data: students, error } = await supabase
    .from("students")
    .select(`
      id,
      name,
      student_id_number,
      gender,
      date_of_birth,
      profile_picture_url,
      users:parent_id(name, email, phone)
    `)
    .eq("class_id", classId)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return students;
}

/**
 * Get recent activities for teacher dashboard
 */
export async function getTeacherRecentActivity() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const [recentHomeworkResult, recentGradesResult] = await Promise.all([
    supabase
    .from("homework")
    .select(`
      id,
      title,
      due_date,
      completion_count,
      subjects:subject_id(name),
      classes:class_id(name)
    `)
    .eq("teacher_id", user.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
      .limit(5),
    supabase
    .from("grades")
    .select(`
      id,
      exam_name,
      grade,
      max_grade,
      date,
      students:student_id(name),
      subjects:subject_id(name)
    `)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const recentHomework = recentHomeworkResult.data;
  const recentGrades = recentGradesResult.data;

  return {
    recentHomework: recentHomework || [],
    recentGrades: recentGrades || [],
  };
}

/**
 * Get all homework assigned by teacher
 */
export async function getTeacherHomework() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: homework, error } = await supabase
    .from("homework")
    .select(`
      id,
      title,
      description,
      due_date,
      completion_count,
      view_count,
      is_published,
      created_at,
      subjects:subject_id(name, name_ar),
      classes:class_id(name, grade_level)
    `)
    .eq("teacher_id", user.id)
    .order("due_date", { ascending: false });

  if (error) throw error;

  return homework || [];
}

/**
 * Get teacher's subjects for homework creation
 * Returns global subjects (shared by all schools) and school-specific subjects
 */
export async function getTeacherSubjects(classId?: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  const { subjectOptions } = await loadTeacherAssignmentContext(
    supabase,
    user.id,
    userProfile.school_id
  );

  if (classId) {
    return subjectOptions.filter((subject) => subject.class_id === classId);
  }

  return subjectOptions;
}

/**
 * Create homework
 */
export async function createHomework(formData: {
  title: string;
  description: string;
  subject_id: string;
  class_id: string;
  due_date: string;
  is_published: boolean;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  const { data, error } = await supabase
    .from("homework")
    .insert({
      title: formData.title,
      description: formData.description,
      subject_id: formData.subject_id,
      class_id: formData.class_id,
      teacher_id: user.id,
      school_id: userProfile.school_id,
      due_date: formData.due_date,
      is_published: formData.is_published,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/teacher/homework");
  return data;
}

/**
 * Update homework
 */
export async function updateHomework(
  homeworkId: string,
  formData: {
    title: string;
    description: string;
    subject_id: string;
    class_id: string;
    due_date: string;
    is_published: boolean;
  }
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("homework")
    .update({
      title: formData.title,
      description: formData.description,
      subject_id: formData.subject_id,
      class_id: formData.class_id,
      due_date: formData.due_date,
      is_published: formData.is_published,
    })
    .eq("id", homeworkId)
    .eq("teacher_id", user.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/teacher/homework");
  return data;
}

/**
 * Delete homework
 */
export async function deleteHomework(homeworkId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("homework")
    .delete()
    .eq("id", homeworkId)
    .eq("teacher_id", user.id);

  if (error) throw error;

  revalidatePath("/teacher/homework");
  return { success: true };
}

/**
 * Get single homework details
 */
export async function getHomeworkById(homeworkId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("homework")
    .select(`
      id,
      title,
      description,
      due_date,
      is_published,
      subject_id,
      class_id,
      subjects:subject_id(name, name_ar),
      classes:class_id(name, grade_level)
    `)
    .eq("id", homeworkId)
    .eq("teacher_id", user.id)
    .single();

  if (error) throw error;

  return data;
}

/**
 * Get grades for a class and subject
 */
export async function getGradesByClassAndSubject(classId: string, subjectId?: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  const { classIds, classSubjectsMap } = await loadTeacherAssignmentContext(
    supabase,
    user.id,
    userProfile.school_id
  );

  if (!classIds.has(classId)) {
    throw new Error("Unauthorized access to class");
  }

  if (subjectId) {
    const classSubjects = classSubjectsMap.get(classId) ?? [];
    const canGradeSubject = classSubjects.some(
      (subject) => subject.id === subjectId
    );

    if (!canGradeSubject) {
      throw new Error(
        "You are not assigned to this subject for the selected class."
      );
    }
  }

  let query = supabase
    .from("grades")
    .select(`
      id,
      grade,
      max_grade,
      percentage,
      exam_type,
      exam_name,
      feedback,
      date,
      students:student_id(id, name, student_id_number),
      subjects:subject_id(id, name, name_ar)
    `)
    .eq("teacher_id", user.id);

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  }

  // Get students in the class and join with their grades
  const { data: students } = await supabase
    .from("students")
    .select("id, name, student_id_number")
    .eq("class_id", classId)
    .eq("is_active", true)
    .order("name");

  const { data: grades, error } = await query.order("date", { ascending: false });

  if (error) throw error;

  return {
    students: students || [],
    grades: grades || [],
  };
}

/**
 * Add grades in bulk
 */
export async function addGradesBulk(grades: Array<{
  student_id: string;
  subject_id: string;
  grade: number;
  max_grade: number;
  exam_type: string;
  exam_name: string;
  feedback?: string;
  date: string;
}>) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (grades.length === 0) {
    return [];
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  const subjectIds = Array.from(new Set(grades.map((grade) => grade.subject_id)));
  const studentIds = Array.from(new Set(grades.map((grade) => grade.student_id)));

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, class_id, school_id, teacher_id")
    .in("id", subjectIds);

  if (subjectsError) throw subjectsError;

  if (!subjects || subjects.length === 0) {
    throw new Error("Assigned subjects not found.");
  }

  const subjectsById = new Map(subjects.map((subject: any) => [subject.id, subject]));

  const { data: subjectAssignments, error: assignmentsError } = await supabase
    .from("teacher_subject_classes")
    .select("subject_id, class_id")
    .eq("teacher_id", user.id)
    .eq("school_id", userProfile.school_id)
    .in("subject_id", subjectIds);

  if (assignmentsError) {
    console.warn(
      "Failed to load subject assignments for validation:",
      assignmentsError.message
    );
  }

  const assignmentMap = new Map<string, Set<string | null>>();
  subjectAssignments?.forEach((assignment) => {
    const existing = assignmentMap.get(assignment.subject_id) ?? new Set<string | null>();
    existing.add(assignment.class_id ?? null);
    assignmentMap.set(assignment.subject_id, existing);
  });

  for (const subjectId of subjectIds) {
    const subject = subjectsById.get(subjectId);
    if (!subject) {
      throw new Error("You are not assigned to one of the selected subjects.");
    }

    const allowedClasses = assignmentMap.get(subjectId);
    const hasAssignmentAccess =
      allowedClasses && allowedClasses.size > 0
        ? true
        : subject.teacher_id === user.id;

    if (!hasAssignmentAccess) {
      throw new Error("You are not authorized to add grades for this subject.");
    }

    subject.school_id = subject.school_id ?? userProfile.school_id;

    if (!subject.school_id) {
      throw new Error("Subject is missing school assignment. Contact administration.");
    }
  }

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, class_id, school_id")
    .in("id", studentIds);

  if (studentsError) throw studentsError;

  if (!students || students.length === 0) {
    throw new Error("No students found for the provided identifiers.");
  }

  const studentsById = new Map(students.map((student: any) => [student.id, student]));

  const gradesWithMetadata = grades.map((grade) => {
    const subject = subjectsById.get(grade.subject_id);
    const student = studentsById.get(grade.student_id);

    if (!student) {
      throw new Error("One or more students could not be found.");
    }

    if (!subject) {
      throw new Error("Subject metadata missing for grade submission.");
    }

    const allowedClasses = assignmentMap.get(grade.subject_id);
    if (allowedClasses && allowedClasses.size > 0) {
      const hasWildcard = allowedClasses.has(null);
      if (!hasWildcard && !allowedClasses.has(student.class_id)) {
        throw new Error(
          "You are not assigned to this subject for the student's class."
        );
      }
    } else if (subject.class_id && student.class_id !== subject.class_id) {
      throw new Error("Student does not belong to the class for this subject.");
    }

    if (student.school_id && student.school_id !== subject.school_id) {
      throw new Error("Student and subject belong to different schools.");
    }

    return {
      ...grade,
      teacher_id: user.id,
      school_id: subject.school_id,
    };
  });

  const { data, error } = await supabase
    .from("grades")
    .insert(gradesWithMetadata)
    .select();

  if (error) throw error;

  revalidatePath("/teacher/grades");
  return data;
}

/**
 * Update a single grade
 */
export async function updateGrade(
  gradeId: string,
  formData: {
    grade: number;
    max_grade: number;
    exam_type: string;
    exam_name: string;
    feedback?: string;
    date: string;
  }
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("grades")
    .update(formData)
    .eq("id", gradeId)
    .eq("teacher_id", user.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/teacher/grades");
  return data;
}

/**
 * Delete a grade
 */
export async function deleteGrade(gradeId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("grades")
    .delete()
    .eq("id", gradeId)
    .eq("teacher_id", user.id);

  if (error) throw error;

  revalidatePath("/teacher/grades");
  return { success: true };
}

/**
 * Get attendance for a class on a specific date
 */
export async function getClassAttendance(classId: string, date: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get students in the class
  const { data: students } = await supabase
    .from("students")
    .select("id, name, student_id_number")
    .eq("class_id", classId)
    .eq("is_active", true)
    .order("name");

  // Get attendance records for this date
  const { data: attendance, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("class_id", classId)
    .eq("date", date);

  if (error) throw error;

  return {
    students: students || [],
    attendance: attendance || [],
  };
}

/**
 * Mark attendance in bulk
 */
export async function markAttendanceBulk(attendanceRecords: Array<{
  student_id: string;
  class_id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  note?: string;
}>) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  // Check if attendance already exists for this date
  const { data: existingAttendance } = await supabase
    .from("attendance")
    .select("id, student_id")
    .eq("class_id", attendanceRecords[0].class_id)
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

  revalidatePath("/teacher/attendance");
  return { success: true };
}

/**
 * Get attendance statistics for a class
 */
export async function getClassAttendanceStats(classId: string, startDate: string, endDate: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: attendance, error } = await supabase
    .from("attendance")
    .select("student_id, status, date")
    .eq("class_id", classId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw error;

  return attendance || [];
}

/**
 * Get recent attendance records for a class
 */
export async function getRecentAttendanceRecords(classId: string, limit: number = 30) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: attendance, error } = await supabase
    .from("attendance")
    .select(`
      id,
      date,
      status,
      note,
      class_id,
      students:student_id(id, name, student_id_number),
      classes:class_id(id, name, grade_level, section)
    `)
    .eq("class_id", classId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return attendance || [];
}

/**
 * Get all teacher notes
 */
export async function getTeacherNotes(studentId?: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let query = supabase
    .from("teacher_notes")
    .select(`
      id,
      content,
      note_type,
      is_read,
      created_at,
      students:student_id(id, name, student_id_number, class_id, classes:class_id(name))
    `)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Create a teacher note
 */
export async function createTeacherNote(formData: {
  student_id: string;
  content: string;
  note_type: "positive" | "concern" | "general" | "behavioral";
  subject_id?: string;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  const { data, error } = await supabase
    .from("teacher_notes")
    .insert({
      student_id: formData.student_id,
      teacher_id: user.id,
      school_id: userProfile.school_id,
      content: formData.content,
      note_type: formData.note_type,
      subject_id: formData.subject_id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/teacher/notes");
  return data;
}

/**
 * Update a teacher note
 */
export async function updateTeacherNote(
  noteId: string,
  formData: {
    content: string;
    note_type: "positive" | "concern" | "general" | "behavioral";
  }
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("role, school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  // Check if user is teacher (can only update their own notes) or admin (can update any note in their school)
  const { data: note } = await supabase
    .from("teacher_notes")
    .select("teacher_id, school_id")
    .eq("id", noteId)
    .single();

  if (!note) throw new Error("Note not found");

  if (userProfile.role !== "admin" && note.teacher_id !== user.id) {
    throw new Error("Unauthorized: You can only update your own notes");
  }

  if (userProfile.role === "admin" && note.school_id !== userProfile.school_id) {
    throw new Error("Unauthorized: Note belongs to a different school");
  }

  const { error } = await supabase
    .from("teacher_notes")
    .update({
      content: formData.content,
      note_type: formData.note_type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId);

  if (error) throw error;

  revalidatePath("/teacher/notes");
  return { success: true };
}

/**
 * Get a single teacher note by ID
 */
export async function getTeacherNoteById(noteId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("role, school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  const { data: note, error } = await supabase
    .from("teacher_notes")
    .select(`
      id,
      content,
      note_type,
      student_id,
      teacher_id,
      school_id,
      created_at,
      updated_at
    `)
    .eq("id", noteId)
    .single();

  if (error) throw error;
  if (!note) throw new Error("Note not found");

  // Check authorization
  if (userProfile.role !== "admin" && note.teacher_id !== user.id) {
    throw new Error("Unauthorized: You can only view your own notes");
  }

  if (userProfile.role === "admin" && note.school_id !== userProfile.school_id) {
    throw new Error("Unauthorized: Note belongs to a different school");
  }

  return note;
}

/**
 * Delete a teacher note
 */
export async function deleteTeacherNote(noteId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("role, school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  // Check if user is teacher (can only delete their own notes) or admin (can delete any note in their school)
  const { data: note } = await supabase
    .from("teacher_notes")
    .select("teacher_id, school_id")
    .eq("id", noteId)
    .single();

  if (!note) throw new Error("Note not found");

  if (userProfile.role !== "admin" && note.teacher_id !== user.id) {
    throw new Error("Unauthorized: You can only delete your own notes");
  }

  if (userProfile.role === "admin" && note.school_id !== userProfile.school_id) {
    throw new Error("Unauthorized: Note belongs to a different school");
  }

  const { error } = await supabase
    .from("teacher_notes")
    .delete()
    .eq("id", noteId);

  if (error) throw error;

  revalidatePath("/teacher/notes");
  return { success: true };
}

/**
 * Get students for note creation
 */
export async function getTeacherStudents() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

  const { classIds } = await loadTeacherAssignmentContext(
    supabase,
    user.id,
    userProfile.school_id
  );

  if (classIds.size === 0) {
    return [];
  }

  const classIdsArray = Array.from(classIds);

  const { data: students, error } = await supabase
    .from("students")
    .select(`
      id,
      name,
      student_id_number,
      class_id,
      classes:class_id(name, grade_level)
    `)
    .in("class_id", classIdsArray)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return students || [];
}

/**
 * Get teacher's schedule
 */
export async function getTeacherSchedule(academicYear?: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!userProfile) throw new Error("User profile not found");

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
    .eq("teacher_id", user.id)
    .eq("school_id", userProfile.school_id)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("period_id", { ascending: true });

  if (academicYear) {
    query = query.eq("academic_year", academicYear);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

