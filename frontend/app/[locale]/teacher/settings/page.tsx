"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { User, Lock, Bell, Palette, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "@/i18n/routing";
import toast from "react-hot-toast";

/**
 * Teacher Profile Settings Page
 * Manage user profile, preferences, and account settings
 */
export default function TeacherSettingsPage() {
  const supabase = createClient();
  const t = useTranslations();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    language_preference: "ar",
    theme_preference: "light",
  });
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/login");
      return;
    }

    setUser(authUser);

    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (userProfile) {
      setProfile({
        name: userProfile.name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        language_preference: userProfile.language_preference || "ar",
        theme_preference: userProfile.theme_preference || "light",
      });
    }

    setLoading(false);
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: profile.name,
          phone: profile.phone,
          language_preference: profile.language_preference,
          theme_preference: profile.theme_preference,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(t("teacher.settings.profileUpdated"));
      
      // Refresh if language changed
      if (profile.language_preference) {
        setTimeout(() => {
          window.location.href = `/${profile.language_preference}/teacher/settings`;
        }, 1000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("teacher.settings.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.new || !passwordData.confirm) {
      toast.error(t("teacher.settings.fillAllFields"));
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      toast.error(t("teacher.settings.passwordsDoNotMatch"));
      return;
    }

    if (passwordData.new.length < 8) {
      toast.error(t("teacher.settings.passwordTooShort"));
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      });

      if (error) throw error;

      toast.success(t("teacher.settings.passwordChanged"));
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(t("teacher.settings.passwordChangeError"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("common.settings")}</h1>
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("common.settings")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("teacher.settings.description")}
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <CardTitle>{t("teacher.settings.profileInformation")}</CardTitle>
          </div>
          <CardDescription>{t("teacher.settings.updateProfile")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("teacher.settings.fullName")}</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder={t("teacher.settings.enterName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("common.email")}</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {t("teacher.settings.emailCannotChange")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("common.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+218 91 234 5678"
            />
          </div>

          <Button onClick={handleProfileUpdate} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? t("common.loading") : t("teacher.settings.saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <CardTitle>{t("teacher.settings.preferences")}</CardTitle>
          </div>
          <CardDescription>{t("teacher.settings.customizeExperience")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">{t("common.language")}</Label>
            <select
              id="language"
              value={profile.language_preference}
              onChange={(e) => setProfile({ ...profile, language_preference: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">{t("teacher.settings.themePreference")}</Label>
            <select
              id="theme"
              value={profile.theme_preference}
              onChange={(e) => setProfile({ ...profile, theme_preference: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="light">{t("common.lightMode")}</option>
              <option value="dark">{t("common.darkMode")}</option>
              <option value="system">{t("teacher.settings.systemDefault")}</option>
            </select>
          </div>

          <Button onClick={handleProfileUpdate} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? t("common.loading") : t("teacher.settings.savePreferences")}
          </Button>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <CardTitle>{t("teacher.settings.changePassword")}</CardTitle>
          </div>
          <CardDescription>{t("teacher.settings.passwordDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("teacher.settings.newPassword")}</Label>
            <Input
              id="new-password"
              type="password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("teacher.settings.confirmPassword")}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <Button onClick={handlePasswordChange} disabled={saving} variant="outline">
            <Lock className="w-4 h-4 mr-2" />
            {saving ? t("common.loading") : t("teacher.settings.updatePassword")}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>{t("teacher.settings.notifications")}</CardTitle>
          </div>
          <CardDescription>{t("teacher.settings.manageNotifications")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("teacher.settings.emailNotifications")}</p>
              <p className="text-sm text-muted-foreground">{t("teacher.settings.emailNotificationsDesc")}</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("teacher.settings.gradeSubmissions")}</p>
              <p className="text-sm text-muted-foreground">{t("teacher.settings.gradeSubmissionsDesc")}</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("teacher.settings.attendanceAlerts")}</p>
              <p className="text-sm text-muted-foreground">{t("teacher.settings.attendanceAlertsDesc")}</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("teacher.settings.schoolAnnouncements")}</p>
              <p className="text-sm text-muted-foreground">{t("teacher.settings.schoolAnnouncementsDesc")}</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t("teacher.settings.accountActions")}</CardTitle>
          <CardDescription>{t("teacher.settings.dangerZone")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleLogout} variant="destructive" className="w-full">
            {t("common.logout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

