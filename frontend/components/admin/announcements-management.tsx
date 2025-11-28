"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Megaphone, AlertTriangle, Info } from "lucide-react";
import { deleteAnnouncement, createAnnouncement, updateAnnouncement } from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "urgent" | "normal" | "info";
  target_audience: "all" | "parents" | "teachers" | "class";
  target_class_id?: string;
  is_published: boolean;
  created_at: string;
  created_by_user?: { name: string };
  target_class?: { name: string };
}

interface AnnouncementsManagementProps {
  initialAnnouncements: Announcement[];
  classes: Array<{ id: string; name: string }>;
}

export function AnnouncementsManagement({
  initialAnnouncements,
  classes,
}: AnnouncementsManagementProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"urgent" | "normal" | "info">("normal");
  const [targetAudience, setTargetAudience] = useState<"all" | "parents" | "teachers" | "class">("all");
  const [targetClassId, setTargetClassId] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const handleCreate = () => {
    setSelectedAnnouncement(undefined);
    setDialogMode("create");
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDialogMode("edit");
    setTitle(announcement.title);
    setContent(announcement.content);
    setPriority(announcement.priority);
    setTargetAudience(announcement.target_audience);
    setTargetClassId(announcement.target_class_id || "");
    setIsPublished(announcement.is_published);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPriority("normal");
    setTargetAudience("all");
    setTargetClassId("");
    setIsPublished(true);
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      toast.error(tAdmin("fillRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        title,
        content,
        priority,
        target_audience: targetAudience,
        target_class_id: targetAudience === "class" ? targetClassId : undefined,
        is_published: isPublished,
      };

      let result;
      if (dialogMode === "create") {
        result = await createAnnouncement(data);
        if (result.error) throw result.error;
        toast.success(tAdmin("createdSuccessfully"));
      } else if (selectedAnnouncement) {
        result = await updateAnnouncement(selectedAnnouncement.id, data);
        if (result.error) throw result.error;
        toast.success(tAdmin("updatedSuccessfully"));
      }

      setDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error saving announcement:", error);
      const errorMessage = error?.message || error || tAdmin("failedToSave");
      const contextMessage = dialogMode === "create"
        ? `Failed to create announcement. ${errorMessage}`
        : `Failed to update announcement. ${errorMessage}`;
      toast.error(contextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (announcement: Announcement) => {
    if (!confirm(`${t("confirmDelete")} "${announcement.title}"?`)) {
      return;
    }

    const result = await deleteAnnouncement(announcement.id, announcement.title);

    if (result.error) {
      const errorMessage = result.error || tAdmin("failedToDelete");
      toast.error(`Failed to delete "${announcement.title}". ${errorMessage}`);
      return;
    }

    toast.success(tAdmin("deletedSuccessfully"));
    setAnnouncements(announcements.filter((a) => a.id !== announcement.id));
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "normal":
        return <Megaphone className="h-4 w-4 text-primary" />;
      case "info":
        return <Info className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const columns = [
    {
      key: "title",
      label: tAdmin("title"),
      render: (announcement: Announcement) => (
        <div className="flex items-start gap-2">
          {getPriorityIcon(announcement.priority)}
          <div>
            <p className="font-medium">{announcement.title}</p>
            {!announcement.is_published && (
              <span className="text-xs text-primary">({tAdmin("draft")})</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "audience",
      label: tAdmin("audience"),
      render: (announcement: Announcement) => (
        <div>
          <p className="capitalize">{announcement.target_audience}</p>
          {announcement.target_class && (
            <p className="text-xs text-muted-foreground">
              {announcement.target_class.name}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "created_by",
      label: tAdmin("createdBy"),
      render: (announcement: Announcement) =>
        announcement.created_by_user?.name || "-",
    },
    {
      key: "created_at",
      label: t("date"),
      render: (announcement: Announcement) =>
        formatDistanceToNow(new Date(announcement.created_at), {
          addSuffix: true,
        }),
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {tAdmin("createAnnouncement")}
          </Button>
        </div>

        <DataTable
          data={announcements}
          columns={columns}
          searchKeys={["title", "content"]}
          searchPlaceholder={tAdmin("searchAnnouncements")}
          emptyMessage={tAdmin("noAnnouncements")}
          actions={(announcement) => (
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(announcement)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(announcement)}
                className="text-destructive hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? tAdmin("createAnnouncement") : tAdmin("editAnnouncement")}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? tAdmin("fillInDetails")
                : tAdmin("updateInformation")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{tAdmin("title")} *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={tAdmin("titlePlaceholder")}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{tAdmin("content")} *</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={tAdmin("contentPlaceholder")}
                disabled={isSubmitting}
                className="w-full min-h-[150px] px-3 py-2 border rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">{tAdmin("priority")}</Label>
                <Select
                  value={priority}
                  onValueChange={(v: any) => setPriority(v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">{tAdmin("urgent")}</SelectItem>
                    <SelectItem value="normal">{tAdmin("normal")}</SelectItem>
                    <SelectItem value="info">{tAdmin("info")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">{tAdmin("audience")}</Label>
                <Select
                  value={targetAudience}
                  onValueChange={(v: any) => setTargetAudience(v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tAdmin("everyone")}</SelectItem>
                    <SelectItem value="parents">{tAdmin("parentsOnly")}</SelectItem>
                    <SelectItem value="teachers">{tAdmin("teachersOnly")}</SelectItem>
                    <SelectItem value="class">{tAdmin("specificClass")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {targetAudience === "class" && (
              <div className="space-y-2">
                <Label htmlFor="target_class_id">{tAdmin("targetClass")}</Label>
                <Select
                  value={targetClassId}
                  onValueChange={setTargetClassId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tAdmin("selectClass")} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="is_published" className="cursor-pointer">
                {tAdmin("publishImmediately")}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "create" ? t("create") : t("update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

