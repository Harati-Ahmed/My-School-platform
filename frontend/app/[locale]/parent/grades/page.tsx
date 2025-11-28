"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Award, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useSearchParams } from "next/navigation";

/**
 * Parent Grades Page with Charts
 * Shows grades with beautiful visualizations using Recharts
 */
type RawGradeRecord = {
  id: string;
  grade: number | null;
  max_grade: number | null;
  percentage: number | null;
  exam_type: string | null;
  exam_name: string | null;
  feedback: string | null;
  date: string | null;
  subject: { name?: string | null; name_ar?: string | null } | null;
  student: { id: string; name: string } | null;
};

type TransformedGrade = RawGradeRecord & {
  normalizedGrade: number;
};

export default function GradesPage() {
  const supabase = createClient();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const selectedStudentId = searchParams?.get("student");

  const [children, setChildren] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(selectedStudentId);
  const [grades, setGrades] = useState<TransformedGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    highest: 0,
    lowest: 0,
    total: 0,
  });

  useEffect(() => {
    loadData();
  }, [selectedStudent]);

  const loadData = async () => {
    setLoading(true);
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch children
    const { data: childrenData, error: childrenError } = await supabase
      .from("students")
      .select("id, name")
      .eq("parent_id", user.id)
      .eq("is_active", true);

    if (childrenError) {
      console.error("Failed to load children:", childrenError);
      setLoading(false);
      return;
    }

    setChildren(childrenData || []);

    if (!childrenData || childrenData.length === 0) {
      setGrades([]);
      setStats({ average: 0, highest: 0, lowest: 0, total: 0 });
      setLoading(false);
      return;
    }

    // Filter by specific student if provided
    const childrenIds = selectedStudent 
      ? [selectedStudent]
      : childrenData?.map(child => child.id) || [];

    // Fetch grades with details
    const { data: gradesData, error: gradesError } = await supabase
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
        subjects:subject_id (name, name_ar),
        students:student_id (id, name)
      `)
      .in("student_id", childrenIds)
      .order("date", { ascending: false });

    if (gradesError) {
      console.error("Failed to load grades:", gradesError);
      setGrades([]);
      setStats({ average: 0, highest: 0, lowest: 0, total: 0 });
      setLoading(false);
      return;
    }

    const transformedGrades: TransformedGrade[] = (gradesData || []).map((grade: any) => {
      const normalizedGrade =
        typeof grade.percentage === "number"
          ? Math.round(grade.percentage)
          : typeof grade.grade === "number" && typeof grade.max_grade === "number" && grade.max_grade > 0
            ? Math.round((grade.grade / grade.max_grade) * 100)
            : Math.round(Number(grade.grade ?? 0));

      // Handle array responses from Supabase joins
      const subject = Array.isArray(grade.subjects) 
        ? (grade.subjects[0] || null)
        : (grade.subjects || null);
      const student = Array.isArray(grade.students)
        ? (grade.students[0] || null)
        : (grade.students || null);

      return {
        id: grade.id,
        grade: grade.grade,
        max_grade: grade.max_grade,
        percentage: grade.percentage,
        exam_type: grade.exam_type,
        exam_name: grade.exam_name,
        feedback: grade.feedback,
        date: grade.date,
        subject: subject,
        student: student,
        normalizedGrade: Math.max(0, Math.min(100, normalizedGrade)),
      };
    });

    setGrades(transformedGrades);

    // Calculate stats
    if (transformedGrades.length > 0) {
      const values = transformedGrades.map((g) => g.normalizedGrade);
      setStats({
        average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        highest: Math.max(...values),
        lowest: Math.min(...values),
        total: values.length,
      });
    }

    setLoading(false);
  };

  const subjectData = useMemo(() => {
    const subjectAverages = grades.reduce((acc: Record<string, { total: number; count: number }>, grade) => {
      const subjectName = grade.subject?.name || t("parent.grades.unknownSubject");
      if (!acc[subjectName]) {
        acc[subjectName] = { total: 0, count: 0 };
      }

      acc[subjectName].total += grade.normalizedGrade;
      acc[subjectName].count += 1;
      return acc;
    }, {});

    return Object.entries(subjectAverages).map(([subject, info]) => ({
      subject,
      average: Math.round(info.total / info.count),
    }));
  }, [grades, t]);

  const distributionData = useMemo(() => {
    const gradeRanges = [
      { range: "90-100", min: 90, max: 100, count: 0, color: "#10b981" },
      { range: "80-89", min: 80, max: 89, count: 0, color: "#3b82f6" },
      { range: "70-79", min: 70, max: 79, count: 0, color: "#f59e0b" },
      { range: "60-69", min: 60, max: 69, count: 0, color: "#ef4444" },
      { range: "0-59", min: 0, max: 59, count: 0, color: "#dc2626" },
    ];

    grades.forEach((grade) => {
      const range = gradeRanges.find(
        (r) => grade.normalizedGrade >= r.min && grade.normalizedGrade <= r.max
      );
      if (range) {
        range.count += 1;
      }
    });

    return gradeRanges.filter((range) => range.count > 0);
  }, [grades]);

  const trendData = useMemo(
    () =>
      grades
        .slice(0, 10)
        .reverse()
        .map((grade, index) => ({
          index: index + 1,
          grade: grade.normalizedGrade,
          subject: grade.subject?.name?.substring(0, 12) || t("parent.grades.unknownSubject"),
          date: grade.date ? new Date(grade.date) : null,
        })),
    [grades, t]
  );

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("navigation.grades")}</h1>
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("navigation.grades")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("parent.grades.description")}
        </p>
      </div>

      {/* Student Filter */}
      {children && children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={!selectedStudent ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStudent(null)}
          >
            {t("parent.homework.allChildren")}
          </Button>
          {children.map((child) => (
            <Button
              key={child.id}
              variant={selectedStudent === child.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStudent(child.id)}
            >
              {child.name}
            </Button>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.grades.averageGrade")}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.average >= 80 ? t("parent.grades.excellent") : 
               stats.average >= 70 ? t("parent.grades.good") : 
               stats.average >= 60 ? t("parent.grades.satisfactory") : 
               t("parent.grades.needsImprovement")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.grades.highestGrade")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.highest}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.grades.lowestGrade")}</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.lowest}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.grades.totalGrades")}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {grades.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Subject Averages Chart */}
          {subjectData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("parent.grades.subjectAverages")}</CardTitle>
                <CardDescription>{t("parent.grades.performanceBySubject")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Grade Distribution Chart */}
          {distributionData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("parent.grades.gradeDistribution")}</CardTitle>
                <CardDescription>{t("parent.grades.rangeBreakdown")}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      dataKey="count"
                      nameKey="range"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Trend Chart */}
          {trendData.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t("parent.grades.gradeTrend")}</CardTitle>
                <CardDescription>{t("parent.grades.recentPerformance")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="grade" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("parent.grades.noGrades")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("parent.grades.noGradesDesc")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Grades List */}
      {grades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("parent.grades.recentGrades")}</CardTitle>
            <CardDescription>{t("parent.grades.latestAssessments")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {grades.slice(0, 10).map((grade) => (
                <div
                  key={grade.id}
                  className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{grade.subject?.name}</span>
                      {children.length > 1 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{grade.student?.name}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {grade.exam_name ?? grade.exam_type ?? t("parent.grades.untitledAssessment")}{" "}
                      •{" "}
                      {grade.date
                        ? new Date(grade.date).toLocaleDateString()
                        : t("parent.grades.noDate")}
                    </p>
                    {grade.feedback && (
                      <p className="text-sm text-muted-foreground mt-1 italic">"{grade.feedback}"</p>
                    )}
                  </div>
                  <div className={`text-2xl font-bold ${
                    grade.normalizedGrade >= 90 ? 'text-green-600 dark:text-green-400' :
                    grade.normalizedGrade >= 70 ? 'text-blue-600 dark:text-blue-400' :
                    grade.normalizedGrade >= 60 ? 'text-orange-600 dark:text-orange-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {grade.normalizedGrade}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

