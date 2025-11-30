"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { createSchoolOnboarding, createUserProfileOnboarding } from "@/lib/actions/onboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, School, User } from "lucide-react";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import toast from "react-hot-toast";

type OnboardingFormData = {
  name: string;
  phone?: string;
  language_preference: "ar" | "en";
  theme_preference: "light" | "dark" | "system";
  school_name?: string;
  school_name_ar?: string;
  school_contact_email?: string;
  school_contact_phone?: string;
  school_address?: string;
};

export default function OnboardingPage() {
  const t = useTranslations();
  const tOnboarding = useTranslations("onboarding");
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<"admin" | "teacher" | "parent" | "hr" | null>(null);

  const onboardingSchema = z.object({
    name: z.string().min(2, tOnboarding("nameRequired")),
    phone: z.string().optional(),
    language_preference: z.enum(["ar", "en"]),
    theme_preference: z.enum(["light", "dark", "system"]),
    school_name: z.string().min(2, tOnboarding("schoolNameRequired")).optional().or(z.literal("")),
    school_name_ar: z.string().optional(),
    school_contact_email: z.string().email(tOnboarding("invalidEmail")).optional().or(z.literal("")),
    school_contact_phone: z.string().optional(),
    school_address: z.string().optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      language_preference: "en",
      theme_preference: "light",
    },
  });

  const isAdmin = watch("school_name") !== undefined && watch("school_name") !== "";

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        setUserEmail(user.email || "");

        // Check if user already has a profile
        const { data: profile } = await supabase
          .from("users")
          .select("role, school_id")
          .eq("id", user.id)
          .single();

        if (profile) {
          // User already has profile, redirect to dashboard
          router.push(`/${profile.role}/dashboard`);
          return;
        }

        // Check user metadata for role hint (if set during auth user creation)
        const roleHint = user.user_metadata?.role;
        if (roleHint && ["admin", "teacher", "parent", "hr"].includes(roleHint)) {
          setUserRole(roleHint);
        } else {
          // Default to admin for new users (can be changed)
          setUserRole("admin");
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error checking user:", error);
        toast.error("Failed to load user information");
        router.push("/login");
      }
    }

    checkUser();
  }, [router, supabase]);

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      let schoolId: string | null = null;

      // If admin and school info provided, create school first using server action
      if (data.school_name) {
        const schoolResult = await createSchoolOnboarding({
          name: data.school_name,
          name_ar: data.school_name_ar,
          contact_email: data.school_contact_email || user.email || "",
          contact_phone: data.school_contact_phone || data.phone,
          address: data.school_address,
        });

        if (schoolResult.error || !schoolResult.data) {
          throw new Error(`Failed to create school: ${schoolResult.error || "Unknown error"}`);
        }

        schoolId = schoolResult.data.id;
      }

      // Create user profile using server action
      const profileResult = await createUserProfileOnboarding({
        name: data.name,
        phone: data.phone,
        language_preference: data.language_preference,
        theme_preference: data.theme_preference,
        role: userRole || "admin",
        school_id: schoolId || undefined,
      });

      if (profileResult.error || !profileResult.data) {
        throw new Error(`Failed to create profile: ${profileResult.error || "Unknown error"}`);
      }

      toast.success(tOnboarding("profileCreated"));
      
      // Redirect to dashboard
      router.push(`/${userRole || "admin"}/dashboard`);
      router.refresh();
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || tOnboarding("setupFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Language and Theme Toggles - Fixed Top Right Corner */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2" dir="ltr">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 min-h-screen">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">{tOnboarding("title")}</CardTitle>
            <CardDescription>
              {tOnboarding("description")} {userEmail && `${tOnboarding("loggedInAs")}: ${userEmail}`}
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                <span>{tOnboarding("personalInfo")}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{tOnboarding("fullName")} *</Label>
                <Input
                  id="name"
                  placeholder={tOnboarding("enterFullName")}
                  {...register("name")}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{tOnboarding("phoneNumber")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+218-91-234-5678"
                  {...register("phone")}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language_preference">{tOnboarding("language")}</Label>
                  <select
                    id="language_preference"
                    {...register("language_preference")}
                    disabled={isSubmitting}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme_preference">{tOnboarding("theme")}</Label>
                  <select
                    id="theme_preference"
                    {...register("theme_preference")}
                    disabled={isSubmitting}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="light">{t("common.lightMode")}</option>
                    <option value="dark">{t("common.darkMode")}</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </div>

            {/* School Information (for Admin) */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <School className="h-5 w-5" />
                <span>{tOnboarding("schoolInfo")}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {tOnboarding("schoolInfoDescription")}
              </p>

              <div className="space-y-2">
                <Label htmlFor="school_name">{tOnboarding("schoolName")}</Label>
                <Input
                  id="school_name"
                  placeholder={tOnboarding("enterSchoolName")}
                  {...register("school_name")}
                  disabled={isSubmitting}
                />
                {errors.school_name && (
                  <p className="text-sm text-destructive">{errors.school_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="school_name_ar">{tOnboarding("schoolNameAr")}</Label>
                <Input
                  id="school_name_ar"
                  placeholder="اسم المدرسة"
                  {...register("school_name_ar")}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school_contact_email">{tOnboarding("contactEmail")}</Label>
                  <Input
                    id="school_contact_email"
                    type="email"
                    placeholder="contact@school.ly"
                    {...register("school_contact_email")}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school_contact_phone">{tOnboarding("contactPhone")}</Label>
                  <Input
                    id="school_contact_phone"
                    type="tel"
                    placeholder="+218-91-234-5678"
                    {...register("school_contact_phone")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school_address">{tOnboarding("schoolAddress")}</Label>
                <Input
                  id="school_address"
                  placeholder={tOnboarding("enterSchoolAddress")}
                  {...register("school_address")}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tOnboarding("settingUp")}
                  </>
                ) : (
                  tOnboarding("completeSetup")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

