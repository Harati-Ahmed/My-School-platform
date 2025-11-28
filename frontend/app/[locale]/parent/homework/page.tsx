import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { BookOpen, Calendar, Clock, CheckCircle, AlertCircle, User } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Parent Homework List Page
 * Shows all homework assignments for all children
 * Supports filtering by student via URL parameter
 */
export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const supabase = await createClient();
  const t = await getTranslations();
  const params = await searchParams;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  // Fetch all children
  const { data: children } = await supabase
    .from("students")
    .select("id, name")
    .eq("parent_id", user.id)
    .eq("is_active", true);

  const childrenIds = children?.map(child => child.id) || [];
  
  // Filter by specific student if provided
  const selectedStudentId = params.student;
  const filteredChildrenIds = selectedStudentId ? [selectedStudentId] : childrenIds;

  // Fetch pending homework
  const { data: pendingHomework } = await supabase
    .from("homework_submissions")
    .select(`
      id,
      status,
      submitted_at,
      grade,
      feedback,
      homework:homework_id (
        id,
        title,
        description,
        due_date,
        subject:subject_id (name, name_ar),
        class:class_id (name)
      ),
      student:student_id (id, name)
    `)
    .in("student_id", filteredChildrenIds)
    .is("submitted_at", null)
    .order("homework.due_date", { ascending: true });

  // Fetch submitted homework
  const { data: submittedHomework } = await supabase
    .from("homework_submissions")
    .select(`
      id,
      status,
      submitted_at,
      grade,
      feedback,
      homework:homework_id (
        id,
        title,
        description,
        due_date,
        subject:subject_id (name, name_ar),
        class:class_id (name)
      ),
      student:student_id (id, name)
    `)
    .in("student_id", filteredChildrenIds)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(20);

  // Fetch overdue homework
  const today = new Date().toISOString();
  const { data: overdueHomework } = await supabase
    .from("homework_submissions")
    .select(`
      id,
      status,
      submitted_at,
      grade,
      feedback,
      homework:homework_id (
        id,
        title,
        description,
        due_date,
        subject:subject_id (name, name_ar),
        class:class_id (name)
      ),
      student:student_id (id, name)
    `)
    .in("student_id", filteredChildrenIds)
    .is("submitted_at", null)
    .lt("homework.due_date", today)
    .order("homework.due_date", { ascending: false });

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDueDate = (dueDate: string) => {
    return new Date(dueDate).toLocaleDateString();
  };

  const HomeworkCard = ({ submission, locale }: { submission: any; locale: string }) => {
    const homework = submission.homework;
    const daysUntil = getDaysUntilDue(homework.due_date);
    const isOverdue = daysUntil < 0;
    const isDueSoon = daysUntil <= 2 && daysUntil >= 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{homework.title}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {locale === 'ar' ? homework.subject?.name_ar : homework.subject?.name}
              </CardDescription>
            </div>
            {isOverdue && (
              <AlertCircle className="w-5 h-5 text-destructive" />
            )}
            {submission.submitted_at && (
              <CheckCircle className="w-5 h-5 text-primary" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Description */}
            {homework.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {homework.description}
              </p>
            )}

            {/* Student Name */}
            {children && children.length > 1 && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{submission.student?.name}</span>
              </div>
            )}

            {/* Due Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className={`font-medium ${
                isOverdue ? 'text-destructive' :
                isDueSoon ? 'text-primary' :
                'text-foreground'
              }`}>
                {formatDueDate(homework.due_date)}
              </span>
              {!submission.submitted_at && (
                <span className={`text-xs ${
                  isOverdue ? 'text-destructive' :
                  isDueSoon ? 'text-primary' :
                  'text-muted-foreground'
                }`}>
                  {isOverdue 
                    ? `${Math.abs(daysUntil)} ${t("parent.homework.daysOverdue")}`
                    : `${daysUntil} ${t("parent.homework.daysLeft")}`
                  }
                </span>
              )}
            </div>

            {/* Submission Status */}
            {submission.submitted_at && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Clock className="w-4 h-4" />
                <span>
                  {t("parent.homework.submittedOn")} {formatDueDate(submission.submitted_at)}
                </span>
              </div>
            )}

            {/* Grade */}
            {submission.grade !== null && (
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm font-medium">{t("parent.homework.grade")}</span>
                <span className="text-lg font-bold text-primary">{submission.grade}%</span>
              </div>
            )}

            {/* Feedback */}
            {submission.feedback && (
              <div className="p-2 bg-primary/10 rounded text-sm">
                <span className="font-medium">{t("parent.homework.feedback")}: </span>
                <span className="text-muted-foreground">{submission.feedback}</span>
              </div>
            )}

            {/* Action Button */}
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/parent/homework/${submission.id}`}>
                {t("parent.children.viewDetails")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("navigation.homework")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("parent.homework.description")}
          </p>
        </div>
      </div>

      {/* Student Filter */}
      {children && children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={!selectedStudentId ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href="/parent/homework">
              {t("parent.homework.allChildren")}
            </Link>
          </Button>
          {children.map((child) => (
            <Button
              key={child.id}
              variant={selectedStudentId === child.id ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`/parent/homework?student=${child.id}`}>
                {child.name}
              </Link>
            </Button>
          ))}
        </div>
      )}

      {/* Tabs for Pending/Submitted/Overdue */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            {t("parent.homework.pending")} ({pendingHomework?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            {t("parent.homework.overdue")} ({overdueHomework?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            {t("parent.homework.submitted")} ({submittedHomework?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingHomework && pendingHomework.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingHomework.map((submission: any) => (
                <HomeworkCard key={submission.id} submission={submission} locale="en" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("parent.homework.noPending")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("parent.homework.allCaughtUp")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="mt-6">
          {overdueHomework && overdueHomework.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {overdueHomework.map((submission: any) => (
                <HomeworkCard key={submission.id} submission={submission} locale="en" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("parent.homework.noOverdue")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("parent.homework.greatJob")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="mt-6">
          {submittedHomework && submittedHomework.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {submittedHomework.map((submission: any) => (
                <HomeworkCard key={submission.id} submission={submission} locale="en" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("parent.homework.noSubmitted")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("parent.homework.noSubmittedDesc")}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

