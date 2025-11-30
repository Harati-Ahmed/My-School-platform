"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2 } from "lucide-react";

interface SchoolFormData {
  name: string;
  name_ar?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  logo_url?: string;
  theme_color?: string;
  subscription_status?: "active" | "trial" | "expired" | "canceled";
  subscription_plan?: string;
  subscription_end?: string;
  max_students?: number;
  max_teachers?: number;
  timezone?: string;
  is_active?: boolean;
}

interface SchoolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SchoolFormData) => Promise<void>;
  initialData?: SchoolFormData;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function SchoolFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
  mode = "create",
}: SchoolFormDialogProps) {
  const t = useTranslations();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: SchoolFormData = {
      name: formData.get("name") as string,
      name_ar: (formData.get("name_ar") as string) || undefined,
      contact_email: (formData.get("contact_email") as string) || undefined,
      contact_phone: (formData.get("contact_phone") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      logo_url: (formData.get("logo_url") as string) || undefined,
      theme_color: (formData.get("theme_color") as string) || undefined,
      subscription_status: (formData.get("subscription_status") as any) || undefined,
      subscription_plan: (formData.get("subscription_plan") as string) || undefined,
      subscription_end: (formData.get("subscription_end") as string) || undefined,
      max_students: formData.get("max_students")
        ? parseInt(formData.get("max_students") as string)
        : undefined,
      max_teachers: formData.get("max_teachers")
        ? parseInt(formData.get("max_teachers") as string)
        : undefined,
      timezone: (formData.get("timezone") as string) || undefined,
      is_active: formData.get("is_active") === "true",
    };

    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("admin.superAdmin.createSchool") : t("admin.superAdmin.editSchool")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("admin.superAdmin.addNewSchool")
              : t("admin.superAdmin.updateSchool")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">
                {t("admin.superAdmin.schoolName")} *
              </Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={initialData?.name}
              />
            </div>
            <div>
              <Label htmlFor="name_ar">
                {t("admin.superAdmin.schoolNameArabic")}
              </Label>
              <Input
                id="name_ar"
                name="name_ar"
                defaultValue={initialData?.name_ar}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_email">
                {t("admin.superAdmin.contactEmail")}
              </Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                defaultValue={initialData?.contact_email}
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">
                {t("admin.superAdmin.contactPhone")}
              </Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                defaultValue={initialData?.contact_phone}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">{t("admin.superAdmin.address")}</Label>
            <Input
              id="address"
              name="address"
              defaultValue={initialData?.address}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logo_url">{t("admin.superAdmin.logoUrl")}</Label>
              <Input
                id="logo_url"
                name="logo_url"
                type="url"
                placeholder="https://example.com/logo.png"
                defaultValue={initialData?.logo_url}
              />
            </div>
            <div>
              <Label htmlFor="theme_color">
                {t("admin.superAdmin.themeColor")}
              </Label>
              <Input
                id="theme_color"
                name="theme_color"
                type="color"
                defaultValue={initialData?.theme_color || "#3B82F6"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="subscription_status">
                {t("admin.superAdmin.subscriptionStatus")}
              </Label>
              <Select
                name="subscription_status"
                defaultValue={initialData?.subscription_status || "trial"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">{t("admin.superAdmin.trial")}</SelectItem>
                  <SelectItem value="active">{t("admin.superAdmin.active")}</SelectItem>
                  <SelectItem value="expired">{t("admin.superAdmin.expired")}</SelectItem>
                  <SelectItem value="canceled">{t("admin.superAdmin.canceled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subscription_plan">
                {t("admin.superAdmin.subscriptionPlan")}
              </Label>
              <Select
                name="subscription_plan"
                defaultValue={initialData?.subscription_plan || "basic"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">{t("admin.superAdmin.basic")}</SelectItem>
                  <SelectItem value="premium">{t("admin.superAdmin.premium")}</SelectItem>
                  <SelectItem value="enterprise">{t("admin.superAdmin.enterprise")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subscription_end">
                {t("admin.superAdmin.subscriptionEnd")}
              </Label>
              <Input
                id="subscription_end"
                name="subscription_end"
                type="date"
                defaultValue={
                  initialData?.subscription_end
                    ? new Date(initialData.subscription_end).toISOString().split("T")[0]
                    : ""
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="max_students">
                {t("admin.superAdmin.maxStudents")}
              </Label>
              <Input
                id="max_students"
                name="max_students"
                type="number"
                min="1"
                defaultValue={initialData?.max_students || 100}
              />
            </div>
            <div>
              <Label htmlFor="max_teachers">
                {t("admin.superAdmin.maxTeachers")}
              </Label>
              <Input
                id="max_teachers"
                name="max_teachers"
                type="number"
                min="1"
                defaultValue={initialData?.max_teachers || 10}
              />
            </div>
            <div>
              <Label htmlFor="timezone">{t("admin.superAdmin.timezone")}</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={initialData?.timezone || "Africa/Tripoli"}
              />
            </div>
          </div>

          {mode === "edit" && (
            <div>
              <Label htmlFor="is_active">{t("admin.superAdmin.status")}</Label>
              <Select
                name="is_active"
                defaultValue={initialData?.is_active ? "true" : "false"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t("admin.superAdmin.active")}</SelectItem>
                  <SelectItem value="false">{t("admin.superAdmin.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "create" ? t("common.create") : t("common.update")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

