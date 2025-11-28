import { getTranslations } from "next-intl/server";
import { getTeacherStudents } from "@/lib/actions/teacher";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { TeacherNoteForm } from "@/components/teacher/teacher-note-form";

interface Props {
  searchParams: Promise<{ student?: string }>;
}

export default async function CreateTeacherNotePage({ searchParams }: Props) {
  const t = await getTranslations();
  const students = await getTeacherStudents();
  const params = await searchParams;
  const initialStudentId = params.student || "";
  
  // If a student ID is provided, ensure it's in the students list
  let allStudents = students;
  if (initialStudentId) {
    const studentExists = students.find((s: any) => s.id === initialStudentId);
    if (!studentExists) {
      // Fetch the student separately if not in the list
      const supabase = await createClient();
      const { data: student } = await supabase
        .from("students")
        .select(`
          id,
          name,
          student_id_number,
          class_id,
          classes:class_id(name, grade_level)
        `)
        .eq("id", initialStudentId)
        .eq("is_active", true)
        .single();
      
      if (student) {
        allStudents = [student, ...students];
      }
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/notes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("teacher.notes.addNote")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("teacher.notes.createDescription")}
          </p>
        </div>
      </div>

      <TeacherNoteForm students={allStudents} initialStudentId={initialStudentId} />
    </div>
  );
}

