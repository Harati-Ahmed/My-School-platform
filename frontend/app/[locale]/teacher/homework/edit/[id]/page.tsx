import { getTranslations } from "next-intl/server";
import { getTeacherSubjects, getHomeworkById } from "@/lib/actions/teacher";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { HomeworkForm } from "@/components/teacher/homework-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditHomeworkPage({ params }: Props) {
  const t = await getTranslations();
  const { id } = await params;
  
  const [subjects, homework] = await Promise.all([
    getTeacherSubjects(),
    getHomeworkById(id),
  ]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/homework">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("teacher.homework.editHomework")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("teacher.homework.editDescription")}
          </p>
        </div>
      </div>

      <HomeworkForm subjects={subjects} homework={homework} mode="edit" />
    </div>
  );
}

