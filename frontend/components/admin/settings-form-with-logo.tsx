"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSchoolSettings } from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { Loader2, Save } from "lucide-react";
import { SchoolLogoUpload } from "@/components/admin/school-logo-upload";
import { useRouter } from "next/navigation";

/**
 * School Settings Form with Logo Upload Component
 */

interface SettingsFormWithLogoProps {
  initialSettings: any;
}

export function SettingsFormWithLogo({ initialSettings }: SettingsFormWithLogoProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(initialSettings.name || "");
  const [nameAr, setNameAr] = useState(initialSettings.name_ar || "");
  const [contactEmail, setContactEmail] = useState(initialSettings.contact_email || "");
  const [contactPhone, setContactPhone] = useState(initialSettings.contact_phone || "");
  const [address, setAddress] = useState(initialSettings.address || "");
  const [themeColor, setThemeColor] = useState(initialSettings.theme_color || "#3B82F6");
  const [timezone, setTimezone] = useState(initialSettings.timezone || "Africa/Tripoli");
  const [logoUrl, setLogoUrl] = useState(initialSettings.logo_url || "");

  const handleLogoUpload = (url: string) => {
    setLogoUrl(url);
    toast.success(tAdmin("logoUploadedReminder"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !nameAr || !contactEmail) {
      toast.error(tAdmin("fillRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateSchoolSettings({
        name,
        name_ar: nameAr,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        address,
        theme_color: themeColor,
        timezone,
        logo_url: logoUrl,
      });

      if (result.error) throw result.error;

      toast.success(tAdmin("settingsUpdated"));
      
      // Refresh to show updated logo
      router.refresh();
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(tAdmin("failedToUpdateSettings"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo Upload Section */}
      <div>
        <SchoolLogoUpload 
          currentLogoUrl={logoUrl} 
          onUploadSuccess={handleLogoUpload}
        />
      </div>

      {/* School Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">{tAdmin("schoolNameEn")} *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tAdmin("schoolNamePlaceholder")}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_ar">{tAdmin("schoolNameAr")} *</Label>
          <Input
            id="name_ar"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="أدخل اسم المدرسة"
            disabled={isSubmitting}
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">{tAdmin("contactEmail")} *</Label>
          <Input
            id="contact_email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="email@school.ly"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">{tAdmin("contactPhone")}</Label>
          <Input
            id="contact_phone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+218 91 234 5678"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">{tAdmin("address")}</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={tAdmin("addressPlaceholder")}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme_color">{tAdmin("themeColor")}</Label>
          <div className="flex gap-2">
            <Input
              id="theme_color"
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              disabled={isSubmitting}
              className="w-20 h-10"
            />
            <Input
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              disabled={isSubmitting}
              placeholder="#3B82F6"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">{tAdmin("timezone")}</Label>
          <Input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="Africa/Tripoli"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {tAdmin("saveSettings")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

