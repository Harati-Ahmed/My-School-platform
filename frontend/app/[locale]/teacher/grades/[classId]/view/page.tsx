"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Eye, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  params: Promise<{ classId: string; locale: string }>;
  searchParams: Promise<{ subject?: string; student?: string; exam_type?: string }>;
}

export default function ViewGradesPage({ params, searchParams }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  const supabase = createClient();
  const [classId, setClassId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedExamType, setSelectedExamType] = useState<string>("all");
  const [classInfo, setClassInfo] = useState<any>(null);
  const [locale, setLocale] = useState<string>("ar");

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      const resolvedSearchParams = await searchParams;
      setClassId(resolvedParams.classId);
      setLocale(resolvedParams.locale);
      if (resolvedSearchParams.subject) setSelectedSubject(resolvedSearchParams.subject);
      if (resolvedSearchParams.student) setSelectedStudent(resolvedSearchParams.student);
      if (resolvedSearchParams.exam_type) setSelectedExamType(resolvedSearchParams.exam_type);
    };
    loadParams();
  }, [params, searchParams]);

  useEffect(() => {
    if (classId) {
      loadData();
    }
  }, [classId, selectedSubject, selectedStudent, selectedExamType]);

  const loadData = async () => {
    if (!classId) return;
    
    setLoading(true);

    // Get class info
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, grade_level, section")
      .eq("id", classId)
      .single();
    
    setClassInfo(classData);

    // Get teacher's school_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userProfile } = await supabase
      .from("users")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (!userProfile) return;

    // Fetch students in the class
    const { data: studentsData } = await supabase
      .from("students")
      .select("id, name, student_id_number")
      .eq("class_id", classId)
      .eq("is_active", true)
      .order("name");

    setStudents(studentsData || []);

    // Fetch subjects (global and school-specific)
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("id, name, name_ar")
      .or(`school_id.is.null,school_id.eq.${userProfile.school_id}`)
      .eq("is_active", true)
      .order("name_ar");

    setSubjects(subjectsData || []);

    // Build query for grades
    // Get student IDs first
    const studentIds = studentsData?.map(s => s.id) || [];
    if (studentIds.length === 0) {
      setGrades([]);
      setLoading(false);
      return;
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
        student_id,
        subject_id,
        students:student_id(id, name, student_id_number),
        subjects:subject_id(id, name, name_ar)
      `)
      .in("student_id", studentIds);

    // Filter by subject if selected
    if (selectedSubject && selectedSubject !== "all") {
      query = query.eq("subject_id", selectedSubject);
    }

    // Filter by student if selected
    if (selectedStudent && selectedStudent !== "all") {
      query = query.eq("student_id", selectedStudent);
    }

    // Filter by exam type if selected
    if (selectedExamType && selectedExamType !== "all") {
      query = query.eq("exam_type", selectedExamType);
    }

    const { data: gradesData } = await query
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);

    setGrades(gradesData || []);
    setLoading(false);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (percentage >= 75) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (percentage >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const getExamTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quiz: t("teacher.grades.quiz"),
      midterm: t("teacher.grades.midterm"),
      final: t("teacher.grades.final"),
      assignment: t("teacher.grades.assignment"),
      participation: t("teacher.grades.participation"),
    };
    return labels[type] || type;
  };

  // Group grades by date
  const gradesByDate: Record<string, any[]> = {};
  grades.forEach((grade) => {
    const dateKey = grade.date;
    if (!gradesByDate[dateKey]) {
      gradesByDate[dateKey] = [];
    }
    gradesByDate[dateKey].push(grade);
  });

  const sortedDates = Object.keys(gradesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher/grades">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t("teacher.grades.viewGrades")}</h1>
            <p className="text-muted-foreground mt-1">
              {classInfo && `${classInfo.name} - ${t("teacher.grades.viewDescription")}`}
            </p>
          </div>
        </div>
        <Link href={`/teacher/grades/${classId}${selectedSubject !== "all" ? `?subject=${selectedSubject}` : ""}`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("teacher.grades.addGrades")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("teacher.grades.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("teacher.grades.subject")}</Label>
              <Select
                value={selectedSubject}
                onValueChange={(value) => {
                  setSelectedSubject(value);
                  const params = new URLSearchParams(searchParamsObj.toString());
                  params.set("subject", value);
                  params.set("student", selectedStudent);
                  params.set("exam_type", selectedExamType);
                  router.push(`/${locale}/teacher/grades/${classId}/view?${params.toString()}`);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name_ar || subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("teacher.grades.student")}</Label>
              <Select
                value={selectedStudent}
                onValueChange={(value) => {
                  setSelectedStudent(value);
                  const params = new URLSearchParams(searchParamsObj.toString());
                  params.set("subject", selectedSubject);
                  params.set("student", value);
                  params.set("exam_type", selectedExamType);
                  router.push(`/${locale}/teacher/grades/${classId}/view?${params.toString()}`);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("teacher.grades.examType")}</Label>
              <Select
                value={selectedExamType}
                onValueChange={(value) => {
                  setSelectedExamType(value);
                  const params = new URLSearchParams(searchParamsObj.toString());
                  params.set("subject", selectedSubject);
                  params.set("student", selectedStudent);
                  params.set("exam_type", value);
                  router.push(`/${locale}/teacher/grades/${classId}/view?${params.toString()}`);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="quiz">{t("teacher.grades.quiz")}</SelectItem>
                  <SelectItem value="midterm">{t("teacher.grades.midterm")}</SelectItem>
                  <SelectItem value="final">{t("teacher.grades.final")}</SelectItem>
                  <SelectItem value="assignment">{t("teacher.grades.assignment")}</SelectItem>
                  <SelectItem value="participation">{t("teacher.grades.participation")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("teacher.grades.gradesList")} ({grades.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("common.loading")}...
            </div>
          ) : grades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("teacher.grades.noGradesFound")}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => (
                <div key={dateKey} className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    {format(new Date(dateKey), "EEEE, MMMM dd, yyyy")}
                  </h3>
                  <div className="space-y-2">
                    {gradesByDate[dateKey].map((grade: any) => (
                      <div
                        key={grade.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium text-lg">
                              {grade.students?.name || "Unknown Student"}
                            </p>
                            {grade.students?.student_id_number && (
                              <span className="text-sm text-muted-foreground">
                                ({grade.students.student_id_number})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-medium">
                              {grade.subjects?.name_ar || grade.subjects?.name || "Unknown Subject"}
                            </span>
                            <span>•</span>
                            <span>{grade.exam_name}</span>
                            <span>•</span>
                            <span>{getExamTypeLabel(grade.exam_type)}</span>
                          </div>
                          {grade.feedback && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              {grade.feedback}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getGradeColor(grade.percentage)} px-3 py-1 rounded`}>
                              {grade.grade}/{grade.max_grade}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {grade.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

