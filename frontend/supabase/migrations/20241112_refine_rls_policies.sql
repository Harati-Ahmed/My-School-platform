-- =============================================
-- Refine RLS policies to reduce initplan overhead
-- Consolidates redundant policies per role/action
-- =============================================

/*
  This migration does the following:
  1. Rewrites auth helper functions to wrap auth.* calls in scalar subqueries.
  2. Introduces auth.current_context() to reuse the computed auth context.
  3. Drops legacy permissive policies that triggered Supabase linter warnings.
  4. Re-creates consolidated policies with explicit role scoping and guard clauses.
*/

-- =============================================
-- AUTH HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM users
  WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.auth_user_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT school_id
  FROM users
  WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = (SELECT auth.uid())
      AND role = 'teacher'
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_is_parent()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = (SELECT auth.uid())
      AND role = 'parent'
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_current_context()
RETURNS TABLE (
  uid UUID,
  school_id UUID,
  is_admin BOOLEAN,
  is_teacher BOOLEAN,
  is_parent BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    (SELECT auth.uid()) AS uid,
    (SELECT public.auth_user_school_id()) AS school_id,
    (SELECT public.auth_is_admin()) AS is_admin,
    (SELECT public.auth_is_teacher()) AS is_teacher,
    (SELECT public.auth_is_parent()) AS is_parent;
$$;

ALTER FUNCTION public.auth_user_role() OWNER TO postgres;
ALTER FUNCTION public.auth_user_school_id() OWNER TO postgres;
ALTER FUNCTION public.auth_is_admin() OWNER TO postgres;
ALTER FUNCTION public.auth_is_teacher() OWNER TO postgres;
ALTER FUNCTION public.auth_is_parent() OWNER TO postgres;
ALTER FUNCTION public.auth_current_context() OWNER TO postgres;

-- =============================================
-- DROP LEGACY POLICIES (idempotent)
-- =============================================

-- users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all school users" ON users;
DROP POLICY IF EXISTS "Admins can create users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Teachers can view users in their school" ON users;
DROP POLICY IF EXISTS "Teachers can update users" ON users;
DROP POLICY IF EXISTS "Teachers can delete users" ON users;

-- classes
DROP POLICY IF EXISTS "Users can view school classes" ON classes;
DROP POLICY IF EXISTS "Parents can view their children's classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;

-- students
DROP POLICY IF EXISTS "Parents can view their children" ON students;
DROP POLICY IF EXISTS "Parents can update their children" ON students;
DROP POLICY IF EXISTS "Teachers can view their students" ON students;
DROP POLICY IF EXISTS "Teachers can update students" ON students;
DROP POLICY IF EXISTS "Admins can manage students" ON students;

-- subjects
DROP POLICY IF EXISTS "Users can view subjects" ON subjects;
DROP POLICY IF EXISTS "Parents can view their children's subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers can view their subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers can manage their subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;

-- homework
DROP POLICY IF EXISTS "Parents can view their children homework" ON homework;
DROP POLICY IF EXISTS "Teachers can view their homework" ON homework;
DROP POLICY IF EXISTS "Teachers can create homework" ON homework;
DROP POLICY IF EXISTS "Teachers can update their homework" ON homework;
DROP POLICY IF EXISTS "Teachers can delete their homework" ON homework;
DROP POLICY IF EXISTS "Parents can view their children's homework" ON homework;
DROP POLICY IF EXISTS "Admins can manage homework" ON homework;

-- grades
DROP POLICY IF EXISTS "Parents can view their children grades" ON grades;
DROP POLICY IF EXISTS "Teachers can view grades" ON grades;
DROP POLICY IF EXISTS "Teachers can create grades" ON grades;
DROP POLICY IF EXISTS "Teachers can update grades" ON grades;
DROP POLICY IF EXISTS "Teachers can delete grades" ON grades;
DROP POLICY IF EXISTS "Admins can manage grades" ON grades;

-- attendance
DROP POLICY IF EXISTS "Parents can view their children attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can view attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can mark attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can update attendance" ON attendance;
DROP POLICY IF EXISTS "Parents can view their children's attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can manage attendance" ON attendance;

-- teacher_notes
DROP POLICY IF EXISTS "Parents can view their children notes" ON teacher_notes;
DROP POLICY IF EXISTS "Parents can mark notes as read" ON teacher_notes;
DROP POLICY IF EXISTS "Teachers can view their notes" ON teacher_notes;
DROP POLICY IF EXISTS "Teachers can create notes" ON teacher_notes;
DROP POLICY IF EXISTS "Teachers can update their notes" ON teacher_notes;
DROP POLICY IF EXISTS "Teachers can delete their notes" ON teacher_notes;
DROP POLICY IF EXISTS "Admins can manage notes" ON teacher_notes;

-- announcements
DROP POLICY IF EXISTS "Users can view published announcements" ON announcements;
DROP POLICY IF EXISTS "Parents can view published announcements" ON announcements;
DROP POLICY IF EXISTS "Teachers can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Admins and teachers can create announcements" ON announcements;
DROP POLICY IF EXISTS "Authors can update announcements" ON announcements;
DROP POLICY IF EXISTS "Authors can delete announcements" ON announcements;

-- notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can mark notifications as read" ON notifications;
DROP POLICY IF EXISTS "Users can delete their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- =============================================
-- RE-CREATE CONSOLIDATED POLICIES
-- =============================================

-- Drop new policies if they already exist (idempotent)
-- users
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
DROP POLICY IF EXISTS "users_update_authenticated" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;

-- classes
DROP POLICY IF EXISTS "classes_select_authenticated" ON classes;
DROP POLICY IF EXISTS "classes_insert_admin" ON classes;
DROP POLICY IF EXISTS "classes_update_admin" ON classes;
DROP POLICY IF EXISTS "classes_delete_admin" ON classes;

-- students
DROP POLICY IF EXISTS "students_select_authenticated" ON students;
DROP POLICY IF EXISTS "students_insert_admin" ON students;
DROP POLICY IF EXISTS "students_update_authenticated" ON students;
DROP POLICY IF EXISTS "students_delete_admin" ON students;

-- subjects
DROP POLICY IF EXISTS "subjects_select_authenticated" ON subjects;
DROP POLICY IF EXISTS "subjects_insert_authorized" ON subjects;
DROP POLICY IF EXISTS "subjects_update_authorized" ON subjects;
DROP POLICY IF EXISTS "subjects_delete_authorized" ON subjects;

-- homework
DROP POLICY IF EXISTS "homework_select_authenticated" ON homework;
DROP POLICY IF EXISTS "homework_insert_authorized" ON homework;
DROP POLICY IF EXISTS "homework_update_authorized" ON homework;
DROP POLICY IF EXISTS "homework_delete_authorized" ON homework;

-- grades
DROP POLICY IF EXISTS "grades_select_authenticated" ON grades;
DROP POLICY IF EXISTS "grades_insert_authorized" ON grades;
DROP POLICY IF EXISTS "grades_update_authorized" ON grades;
DROP POLICY IF EXISTS "grades_delete_authorized" ON grades;

-- attendance
DROP POLICY IF EXISTS "attendance_select_authenticated" ON attendance;
DROP POLICY IF EXISTS "attendance_insert_authorized" ON attendance;
DROP POLICY IF EXISTS "attendance_update_authorized" ON attendance;
DROP POLICY IF EXISTS "attendance_delete_admin" ON attendance;

-- teacher_notes
DROP POLICY IF EXISTS "teacher_notes_select_authenticated" ON teacher_notes;
DROP POLICY IF EXISTS "teacher_notes_insert_authorized" ON teacher_notes;
DROP POLICY IF EXISTS "teacher_notes_update_authorized" ON teacher_notes;
DROP POLICY IF EXISTS "teacher_notes_delete_authorized" ON teacher_notes;

-- announcements
DROP POLICY IF EXISTS "announcements_select_authenticated" ON announcements;
DROP POLICY IF EXISTS "announcements_insert_authorized" ON announcements;
DROP POLICY IF EXISTS "announcements_update_authorized" ON announcements;
DROP POLICY IF EXISTS "announcements_delete_authorized" ON announcements;

-- notifications
DROP POLICY IF EXISTS "notifications_select_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_update_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_service_role" ON notifications;

-- =============================================
-- CREATE CONSOLIDATED POLICIES
-- =============================================

-- users
CREATE POLICY "users_select_authenticated"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        id = auth_ctx.uid
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
        OR (auth_ctx.is_teacher AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "users_update_authenticated"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        id = auth_ctx.uid
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        id = auth_ctx.uid
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "users_insert_admin"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE auth_ctx.is_admin AND school_id = auth_ctx.school_id
    )
  );

CREATE POLICY "users_delete_admin"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE auth_ctx.is_admin AND school_id = auth_ctx.school_id
    )
  );

-- classes
CREATE POLICY "classes_select_authenticated"
  ON classes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        school_id = auth_ctx.school_id
        OR (
          auth_ctx.is_teacher AND (
            main_teacher_id = auth_ctx.uid
            OR EXISTS (
              SELECT 1
              FROM subjects s
              WHERE s.teacher_id = auth_ctx.uid
                AND s.class_id = classes.id
            )
          )
        )
        OR (
          auth_ctx.is_parent AND EXISTS (
            SELECT 1
            FROM students st
            WHERE st.parent_id = auth_ctx.uid
              AND st.class_id = classes.id
          )
        )
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "classes_insert_admin"
  ON classes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE auth_ctx.is_admin AND school_id = auth_ctx.school_id
    )
  );

CREATE POLICY "classes_update_admin"
  ON classes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE auth_ctx.is_admin AND school_id = auth_ctx.school_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE auth_ctx.is_admin AND school_id = auth_ctx.school_id
    )
  );

CREATE POLICY "classes_delete_admin"
  ON classes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE auth_ctx.is_admin AND school_id = auth_ctx.school_id
    )
  );

-- students
CREATE POLICY "students_select_authenticated"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_parent AND parent_id = auth_ctx.uid)
        OR (
          auth_ctx.is_teacher AND EXISTS (
            SELECT 1
            FROM classes c
            WHERE c.id = students.class_id
              AND c.school_id = auth_ctx.school_id
              AND (
                c.main_teacher_id = auth_ctx.uid
                OR EXISTS (
                  SELECT 1
                  FROM subjects sub
                  WHERE sub.teacher_id = auth_ctx.uid
                    AND sub.class_id = c.id
                )
              )
          )
        )
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "students_insert_admin"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE auth_ctx.is_admin AND school_id = auth_ctx.school_id
    )
  );

CREATE POLICY "students_update_authenticated"
  ON students
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_parent AND parent_id = auth_ctx.uid)
        OR (
          auth_ctx.is_teacher AND EXISTS (
            SELECT 1
            FROM classes c
            WHERE c.id = students.class_id
              AND c.school_id = auth_ctx.school_id
              AND (
                c.main_teacher_id = auth_ctx.uid
                OR EXISTS (
                  SELECT 1
                  FROM subjects sub
                  WHERE sub.teacher_id = auth_ctx.uid
                    AND sub.class_id = c.id
                )
              )
          )
        )
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_parent AND parent_id = auth_ctx.uid)
        OR (
          auth_ctx.is_teacher AND EXISTS (
            SELECT 1
            FROM classes c
            WHERE c.id = students.class_id
              AND c.school_id = auth_ctx.school_id
              AND (
                c.main_teacher_id = auth_ctx.uid
                OR EXISTS (
                  SELECT 1
                  FROM subjects sub
                  WHERE sub.teacher_id = auth_ctx.uid
                    AND sub.class_id = c.id
                )
              )
          )
        )
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "students_delete_admin"
  ON students
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE auth_ctx.is_admin AND school_id = auth_ctx.school_id
    )
  );

-- subjects
CREATE POLICY "subjects_select_authenticated"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
        OR (auth_ctx.is_teacher AND (teacher_id = auth_ctx.uid OR school_id = auth_ctx.school_id))
        OR (
          auth_ctx.is_parent AND EXISTS (
            SELECT 1
            FROM students st
            WHERE st.parent_id = auth_ctx.uid
              AND st.class_id = subjects.class_id
          )
        )
    )
  );

CREATE POLICY "subjects_insert_authorized"
  ON subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
        OR (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "subjects_update_authorized"
  ON subjects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
        OR (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
        OR (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
    )
  );

CREATE POLICY "subjects_delete_authorized"
  ON subjects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
        OR (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
    )
  );

-- homework
CREATE POLICY "homework_select_authenticated"
  ON homework
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (
          auth_ctx.is_parent AND EXISTS (
            SELECT 1
            FROM students st
            WHERE st.parent_id = auth_ctx.uid
              AND st.class_id = homework.class_id
          )
        )
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "homework_insert_authorized"
  ON homework
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid AND EXISTS (
          SELECT 1
          FROM classes c
          WHERE c.id = homework.class_id
            AND c.school_id = auth_ctx.school_id
            AND (
              c.main_teacher_id = auth_ctx.uid
              OR EXISTS (
                SELECT 1
                FROM subjects sub
                WHERE sub.teacher_id = auth_ctx.uid
                  AND sub.class_id = c.id
              )
            )
        ))
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "homework_update_authorized"
  ON homework
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "homework_delete_authorized"
  ON homework
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

-- grades
CREATE POLICY "grades_select_authenticated"
  ON grades
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (
          auth_ctx.is_parent AND EXISTS (
            SELECT 1
            FROM students st
            WHERE st.parent_id = auth_ctx.uid
              AND st.id = grades.student_id
          )
        )
        OR (
          auth_ctx.is_teacher AND (
            teacher_id = auth_ctx.uid
            OR EXISTS (
              SELECT 1
              FROM students st
              WHERE st.id = grades.student_id
                AND EXISTS (
                  SELECT 1
                  FROM classes c
                  WHERE c.id = st.class_id
                    AND c.school_id = auth_ctx.school_id
                    AND (
                      c.main_teacher_id = auth_ctx.uid
                      OR EXISTS (
                        SELECT 1
                        FROM subjects sub
                        WHERE sub.teacher_id = auth_ctx.uid
                          AND sub.class_id = c.id
                      )
                    )
                )
            )
          )
        )
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "grades_insert_authorized"
  ON grades
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "grades_update_authorized"
  ON grades
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "grades_delete_authorized"
  ON grades
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

-- attendance
CREATE POLICY "attendance_select_authenticated"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (
          auth_ctx.is_parent AND EXISTS (
            SELECT 1
            FROM students st
            WHERE st.parent_id = auth_ctx.uid
              AND st.id = attendance.student_id
          )
        )
        OR (
          auth_ctx.is_teacher AND EXISTS (
            SELECT 1
            FROM classes c
            WHERE c.id = attendance.class_id
              AND c.school_id = auth_ctx.school_id
              AND (
                c.main_teacher_id = auth_ctx.uid
                OR EXISTS (
                  SELECT 1
                  FROM subjects sub
                  WHERE sub.teacher_id = auth_ctx.uid
                    AND sub.class_id = c.id
                )
              )
          )
        )
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "attendance_insert_authorized"
  ON attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND marked_by = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "attendance_update_authorized"
  ON attendance
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND marked_by = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND marked_by = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "attendance_delete_admin"
  ON attendance
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE auth_ctx.is_admin AND school_id = auth_ctx.school_id
    )
  );

-- teacher_notes
CREATE POLICY "teacher_notes_select_authenticated"
  ON teacher_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (
          auth_ctx.is_parent AND EXISTS (
            SELECT 1
            FROM students st
            WHERE st.parent_id = auth_ctx.uid
              AND st.id = teacher_notes.student_id
          )
        )
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "teacher_notes_insert_authorized"
  ON teacher_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "teacher_notes_update_authorized"
  ON teacher_notes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (
          auth_ctx.is_parent AND EXISTS (
            SELECT 1
            FROM students st
            WHERE st.parent_id = auth_ctx.uid
              AND st.id = teacher_notes.student_id
          )
        )
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (
          auth_ctx.is_parent AND EXISTS (
            SELECT 1
            FROM students st
            WHERE st.parent_id = auth_ctx.uid
              AND st.id = teacher_notes.student_id
          )
        )
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "teacher_notes_delete_authorized"
  ON teacher_notes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        (auth_ctx.is_teacher AND teacher_id = auth_ctx.uid)
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

-- announcements
CREATE POLICY "announcements_select_authenticated"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        is_published = true
        AND school_id = auth_ctx.school_id
        AND (
          target_audience = 'all'
          OR (target_audience = 'parents' AND auth_ctx.is_parent)
          OR (target_audience = 'teachers' AND auth_ctx.is_teacher)
          OR (
            target_audience = 'class' AND EXISTS (
              SELECT 1
              FROM students st
              WHERE st.parent_id = auth_ctx.uid
                AND st.class_id = announcements.target_class_id
            )
          )
        )
    )
  );

CREATE POLICY "announcements_insert_authorized"
  ON announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        school_id = auth_ctx.school_id
        AND (
          auth_ctx.is_admin
          OR auth_ctx.is_teacher
        )
        AND author_id = auth_ctx.uid
    )
  );

CREATE POLICY "announcements_update_authorized"
  ON announcements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        author_id = auth_ctx.uid
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        author_id = auth_ctx.uid
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

CREATE POLICY "announcements_delete_authorized"
  ON announcements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE
        author_id = auth_ctx.uid
        OR (auth_ctx.is_admin AND school_id = auth_ctx.school_id)
    )
  );

-- notifications
CREATE POLICY "notifications_select_authenticated"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE user_id = auth_ctx.uid
    )
  );

CREATE POLICY "notifications_update_authenticated"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE user_id = auth_ctx.uid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE user_id = auth_ctx.uid
    )
  );

CREATE POLICY "notifications_delete_authenticated"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.auth_current_context() auth_ctx
      WHERE user_id = auth_ctx.uid
    )
  );

CREATE POLICY "notifications_insert_service_role"
  ON notifications
  FOR INSERT
  TO service_role
  WITH CHECK (TRUE);
