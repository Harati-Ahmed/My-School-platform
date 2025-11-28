import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { getTeacherNotes } from "@/lib/actions/teacher";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import { TeacherNoteActions } from "@/components/teacher/teacher-note-actions";

export default async function TeacherNotesPage() {
  const t = await getTranslations();
  
  const notes = await getTeacherNotes();
  
  // Group notes by type
  const notesByType = {
    positive: notes.filter((n: any) => n.note_type === "positive"),
    concern: notes.filter((n: any) => n.note_type === "concern"),
    behavioral: notes.filter((n: any) => n.note_type === "behavioral"),
    general: notes.filter((n: any) => n.note_type === "general"),
  };
  
  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "concern":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "behavioral":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("teacher.notes.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("teacher.notes.description")}
          </p>
        </div>
        <Link href="/teacher/notes/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("teacher.notes.addNote")}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("teacher.notes.totalNotes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">{t("teacher.notes.positive")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notesByType.positive.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">{t("teacher.notes.concerns")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notesByType.concern.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">{t("teacher.notes.behavioral")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notesByType.behavioral.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t("teacher.notes.allNotes")}</h2>
        
        {notes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("teacher.notes.noNotes")}</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                {t("teacher.notes.noNotesDesc")}
              </p>
              <Link href="/teacher/notes/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("teacher.notes.addFirstNote")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {notes.map((note: any) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getNoteTypeColor(note.note_type)}`}>
                          {t(`teacher.notes.${note.note_type}`)}
                        </span>
                        {!note.is_read && (
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                            {t("teacher.notes.unread")}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-1">
                        {note.students?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {note.students?.classes?.name} • {t("teacher.notes.id")}: {note.students?.student_id_number}
                      </p>
                      
                      <p className="text-sm mb-3">{note.content}</p>
                      
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    
                    <TeacherNoteActions noteId={note.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

