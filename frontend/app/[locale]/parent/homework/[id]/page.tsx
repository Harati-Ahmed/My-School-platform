import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { BookOpen, Calendar, User, FileText, CheckCircle, AlertCircle, Download } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

/**
 * Parent Homework Detail Page
 * Shows detailed information about a specific homework assignment
 */
export default async function HomeworkDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const supabase = await createClient();
  const t = await getTranslations();
  const { id, locale } = await params;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  // Fetch homework submission with full details
  const { data: submission, error } = await supabase
    .from("homework_submissions")
    .select(`
      id,
      status,
      submitted_at,
      grade,
      feedback,
      submission_text,
      submission_file_url,
      graded_at,
      homework:homework_id (
        id,
        title,
        description,
        due_date,
        total_points,
        attachment_url,
        subject:subject_id (name, name_ar),
        class:class_id (name),
        teacher:teacher_id (name)
      ),
      student:student_id (id, name, parent_id)
    `)
    .eq("id", id)
    .single();

  if (error || !submission) {
    notFound();
  }

  // Verify this homework belongs to one of the parent's children
  if ((submission.student as any)?.parent_id !== user.id) {
    notFound();
  }

  const homework = submission.homework as any;
  const dueDate = new Date(homework?.due_date);
  const isOverdue = dueDate < new Date() && !submission.submitted_at;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/parent/homework">← {t("common.cancel")}</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{homework.title}</h1>
        <p className="text-muted-foreground mt-2">
          {locale === 'ar' ? homework.subject?.name_ar : homework.subject?.name}
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex gap-2">
        {submission.submitted_at ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            {t("parent.homework.submitted")}
          </div>
        ) : isOverdue ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            {t("parent.homework.overdue")}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            {t("parent.homework.pending")}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t("parent.homework.instructions")}</CardTitle>
            </CardHeader>
            <CardContent>
              {homework.description ? (
                <p className="text-sm whitespace-pre-wrap">{homework.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t("parent.homework.noInstructions")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Teacher's Attachment */}
          {homework.attachment_url && (
            <Card>
              <CardHeader>
                <CardTitle>{t("parent.homework.attachments")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a href={homework.attachment_url} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    {t("parent.homework.downloadAttachment")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Student Submission */}
          {submission.submitted_at && (
            <Card>
              <CardHeader>
                <CardTitle>{t("parent.homework.submission")}</CardTitle>
                <CardDescription>
                  {t("parent.homework.submittedOn")} {formatDate(submission.submitted_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.submission_text && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t("parent.homework.submissionText")}</h4>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                      {submission.submission_text}
                    </p>
                  </div>
                )}
                {submission.submission_file_url && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t("parent.homework.submittedFile")}</h4>
                    <Button variant="outline" asChild>
                      <a href={submission.submission_file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 mr-2" />
                        {t("parent.homework.downloadSubmission")}
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Grade and Feedback */}
          {submission.grade !== null && (
            <Card>
              <CardHeader>
                <CardTitle>{t("parent.homework.gradeAndFeedback")}</CardTitle>
                {submission.graded_at && (
                  <CardDescription>
                    {t("parent.homework.gradedOn")} {formatDate(submission.graded_at)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                  <span className="text-lg font-medium">{t("parent.homework.grade")}</span>
                  <span className="text-3xl font-bold text-primary">
                    {submission.grade}/{homework.total_points || 100}
                  </span>
                </div>
                {submission.feedback && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t("parent.homework.teacherFeedback")}</h4>
                    <p className="text-sm bg-primary/10 p-3 rounded whitespace-pre-wrap">
                      {submission.feedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("parent.homework.details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">{t("parent.homework.student")}</p>
                  <p className="font-medium">{(submission.student as any)?.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">{t("parent.homework.subject")}</p>
                  <p className="font-medium">
                    {locale === 'ar' ? homework.subject?.name_ar : homework.subject?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">{t("parent.homework.class")}</p>
                  <p className="font-medium">{homework.class?.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">{t("parent.homework.teacher")}</p>
                  <p className="font-medium">{homework.teacher?.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">{t("parent.homework.dueDate")}</p>
                  <p className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                    {formatDate(homework.due_date)}
                  </p>
                </div>
              </div>

              {homework.total_points && (
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-muted-foreground">{t("parent.homework.totalPoints")}</p>
                    <p className="font-medium">{homework.total_points}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">{t("parent.homework.status")}</p>
                  <p className="font-medium">
                    {submission.submitted_at 
                      ? t("parent.homework.submitted")
                      : isOverdue
                      ? t("parent.homework.overdue")
                      : t("parent.homework.pending")
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={`/parent/grades?student=${(submission.student as any)?.id}`}>
                  {t("navigation.grades")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={`/parent/homework?student=${(submission.student as any)?.id}`}>
                  {t("parent.homework.allHomework")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

