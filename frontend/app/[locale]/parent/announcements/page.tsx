import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Megaphone, AlertTriangle, Info, Calendar, User } from "lucide-react";

/**
 * Parent Announcements Page
 * Shows school announcements and important notices
 */
export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const t = await getTranslations();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Get user's school
  const { data: userProfile } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", user.id)
    .single();

  // Fetch announcements for this school
  // Filter by audience: 'all' or 'parents'
  const { data: announcements } = await supabase
    .from("announcements")
    .select(`
      id,
      title,
      content,
      priority,
      audience,
      start_date,
      end_date,
      created_at,
      users!announcements_created_by_fkey (name)
    `)
    .eq("school_id", userProfile?.school_id)
    .in("audience", ["all", "parents"])
    .lte("start_date", new Date().toISOString())
    .gte("end_date", new Date().toISOString())
    .order("priority", { ascending: true }) // urgent first
    .order("created_at", { ascending: false });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'normal':
        return <Info className="w-5 h-5 text-primary" />;
      case 'info':
        return <Info className="w-5 h-5 text-gray-500" />;
      default:
        return <Megaphone className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-destructive/10';
      case 'normal':
        return 'border-l-4 border-blue-500 bg-primary/10';
      case 'info':
        return 'border-l-4 border-gray-500 bg-background';
      default:
        return 'border-l-4 border-gray-300';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const urgentAnnouncements = announcements?.filter(a => a.priority === 'urgent') || [];
  const normalAnnouncements = announcements?.filter(a => a.priority === 'normal') || [];
  const infoAnnouncements = announcements?.filter(a => a.priority === 'info') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("navigation.announcements")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("parent.announcements.description")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.announcements.urgent")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{urgentAnnouncements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.announcements.normal")}</CardTitle>
            <Info className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{normalAnnouncements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("parent.announcements.info")}</CardTitle>
            <Info className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{infoAnnouncements.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      {announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={getPriorityColor(announcement.priority)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getPriorityIcon(announcement.priority)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          announcement.priority === 'urgent'
                            ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                            : announcement.priority === 'normal'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-foreground'
                        }`}>
                          {t(`parent.announcements.${announcement.priority}`)}
                        </span>
                      </div>
                      <CardDescription className="mt-2 flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {(announcement as any).users?.name || t("parent.announcements.postedBy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(announcement.created_at)}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                {announcement.start_date !== announcement.end_date && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDate(announcement.start_date)} - {formatDate(announcement.end_date)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("parent.announcements.noAnnouncements")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("parent.announcements.noAnnouncementsDesc")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

