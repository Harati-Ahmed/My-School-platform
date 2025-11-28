import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { MessageSquare, User, Calendar, Heart, AlertTriangle, Info, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Parent Teacher Notes Page
 * Shows all teacher notes for children
 */
export default async function TeacherNotesPage({
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

  // Fetch all notes
  const { data: allNotes } = await supabase
    .from("teacher_notes")
    .select(`
      id,
      content,
      note_type,
      is_read,
      created_at,
      student:student_id (id, name),
      teacher:teacher_id (name),
      subject:subject_id (name, name_ar)
    `)
    .in("student_id", filteredChildrenIds)
    .order("created_at", { ascending: false });

  // Separate notes by type
  const positiveNotes = allNotes?.filter(n => n.note_type === 'positive') || [];
  const concernNotes = allNotes?.filter(n => n.note_type === 'concern') || [];
  const behavioralNotes = allNotes?.filter(n => n.note_type === 'behavioral') || [];
  const generalNotes = allNotes?.filter(n => n.note_type === 'general') || [];

  // Count unread notes
  const unreadCount = allNotes?.filter(n => !n.is_read).length || 0;

  const getNoteIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <Heart className="w-5 h-5 text-primary" />;
      case 'concern':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'behavioral':
        return <Frown className="w-5 h-5 text-primary" />;
      case 'general':
        return <Info className="w-5 h-5 text-primary" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getNoteColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'border-l-4 border-green-500 bg-primary/10';
      case 'concern':
        return 'border-l-4 border-red-500 bg-destructive/10';
      case 'behavioral':
        return 'border-l-4 border-orange-500 bg-primary/10';
      case 'general':
        return 'border-l-4 border-blue-500 bg-primary/10';
      default:
        return 'border-l-4 border-gray-300';
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return t("parent.notes.today");
    if (diff === 1) return t("parent.notes.yesterday");
    if (diff < 7) return `${diff} ${t("parent.notes.daysAgo")}`;
    return d.toLocaleDateString();
  };

  const NoteCard = ({ note }: { note: any }) => (
    <Card className={`${getNoteColor(note.note_type)} ${!note.is_read ? 'shadow-md' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getNoteIcon(note.note_type)}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">
                  {t(`parent.notes.${note.note_type}`)}
                </CardTitle>
                {!note.is_read && (
                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                    {t("parent.notes.new")}
                  </span>
                )}
              </div>
              <CardDescription className="mt-1">
                {note.teacher?.name} • {formatDate(note.created_at)}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-3">{note.content}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {children && children.length > 1 && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{note.student?.name}</span>
            </div>
          )}
          {note.subject && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{note.subject?.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("navigation.teacherNotes")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("parent.notes.description")}
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
            {unreadCount} {t("parent.notes.unread")}
          </div>
        )}
      </div>

      {/* Student Filter */}
      {children && children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={!selectedStudentId ? "default" : "outline"}
            size="sm"
            asChild
          >
            <a href="/parent/notes">
              {t("parent.homework.allChildren")}
            </a>
          </Button>
          {children.map((child) => (
            <Button
              key={child.id}
              variant={selectedStudentId === child.id ? "default" : "outline"}
              size="sm"
              asChild
            >
              <a href={`/parent/notes?student=${child.id}`}>
                {child.name}
              </a>
            </Button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.notes.positive")}</CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{positiveNotes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.notes.concern")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{concernNotes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.notes.behavioral")}</CardTitle>
            <Frown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{behavioralNotes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.notes.general")}</CardTitle>
            <Info className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{generalNotes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different note types */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            {t("parent.notes.all")} ({allNotes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="positive">
            {t("parent.notes.positive")} ({positiveNotes.length})
          </TabsTrigger>
          <TabsTrigger value="concern">
            {t("parent.notes.concern")} ({concernNotes.length})
          </TabsTrigger>
          <TabsTrigger value="behavioral">
            {t("parent.notes.behavioral")} ({behavioralNotes.length})
          </TabsTrigger>
          <TabsTrigger value="general">
            {t("parent.notes.general")} ({generalNotes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-4">
          {allNotes && allNotes.length > 0 ? (
            allNotes.map((note) => <NoteCard key={note.id} note={note} />)
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("parent.notes.noNotes")}</h3>
                <p className="text-sm text-muted-foreground">{t("parent.notes.noNotesDesc")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="positive" className="mt-6 space-y-4">
          {positiveNotes.length > 0 ? (
            positiveNotes.map((note) => <NoteCard key={note.id} note={note} />)
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("parent.notes.noPositiveNotes")}</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="concern" className="mt-6 space-y-4">
          {concernNotes.length > 0 ? (
            concernNotes.map((note) => <NoteCard key={note.id} note={note} />)
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("parent.notes.noConcernNotes")}</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="behavioral" className="mt-6 space-y-4">
          {behavioralNotes.length > 0 ? (
            behavioralNotes.map((note) => <NoteCard key={note.id} note={note} />)
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Frown className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("parent.notes.noBehavioralNotes")}</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="general" className="mt-6 space-y-4">
          {generalNotes.length > 0 ? (
            generalNotes.map((note) => <NoteCard key={note.id} note={note} />)
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Info className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("parent.notes.noGeneralNotes")}</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

