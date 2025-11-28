"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Edit } from "lucide-react";
import { deleteTeacherNote, getTeacherNoteById, updateTeacherNote } from "@/lib/actions/teacher";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

interface TeacherNoteActionsProps {
  noteId: string;
}

type NoteType = "positive" | "concern" | "general" | "behavioral";

export function TeacherNoteActions({ noteId }: TeacherNoteActionsProps) {
  const router = useRouter();
  const t = useTranslations();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    content: "",
    note_type: "general" as NoteType,
  });

  useEffect(() => {
    if (showEditDialog) {
      loadNote();
    }
  }, [showEditDialog, noteId]);

  const loadNote = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const note = await getTeacherNoteById(noteId);
      setFormData({
        content: note.content,
        note_type: note.note_type as NoteType,
      });
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTeacherNote(noteId);
      setShowDeleteDialog(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete note:", error);
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    setIsEditing(true);
    setError(null);
    try {
      if (!formData.content.trim()) {
        throw new Error(t("teacher.notes.fillRequired"));
      }
      await updateTeacherNote(noteId, formData);
      setShowEditDialog(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || t("common.error"));
      setIsEditing(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("teacher.notes.editNote")}</DialogTitle>
            <DialogDescription>
              {t("teacher.notes.editDescription")}
            </DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="py-4 text-center">{t("common.loading")}</div>
          ) : (
            <div className="space-y-4 py-4">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="note_type">{t("teacher.notes.noteType")} *</Label>
                <Select
                  value={formData.note_type}
                  onValueChange={(value: NoteType) =>
                    setFormData({ ...formData, note_type: value })
                  }
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">{t("teacher.notes.positive")}</SelectItem>
                    <SelectItem value="concern">{t("teacher.notes.concern")}</SelectItem>
                    <SelectItem value="behavioral">{t("teacher.notes.behavioral")}</SelectItem>
                    <SelectItem value="general">{t("teacher.notes.general")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">{t("teacher.notes.note")} *</Label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder={t("teacher.notes.notePlaceholder")}
                  className="w-full min-h-[150px] px-3 py-2 border rounded-md"
                  required
                  disabled={isEditing}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setError(null);
              }}
              disabled={isEditing || isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEdit} disabled={isEditing || isLoading}>
              {isEditing ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("teacher.notes.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("teacher.notes.deleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

