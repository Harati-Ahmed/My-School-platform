"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Mail, Phone, Lock, Loader2 } from "lucide-react";

// Form schemas
const emailLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const phoneLoginSchema = z.object({
  phone: z.string().min(10, "Invalid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type EmailLoginForm = z.infer<typeof emailLoginSchema>;
type PhoneLoginForm = z.infer<typeof phoneLoginSchema>;

/**
 * Login Page with Email and Phone Login Options
 * Supports all user roles (Admin, Teacher, Parent)
 */
export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const supabase = createClient();

  // Email login form
  const emailForm = useForm<EmailLoginForm>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Phone login form
  const phoneForm = useForm<PhoneLoginForm>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  // Handle email login
  const onEmailLogin = async (data: EmailLoginForm) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(t("auth.invalidCredentials"));
        return;
      }

      if (authData.user) {
        // Fetch user profile to determine role
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("role, school_id")
          .eq("id", authData.user.id)
          .single();

        if (profileError || !userProfile) {
          toast.error(t("auth.profileLoadError"));
          return;
        }

        toast.success(t("auth.loginSuccess"));

        // Redirect based on role
        const dashboardPath = `/${userProfile.role}/dashboard`;
        router.push(dashboardPath);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(t("auth.genericError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle phone login
  const onPhoneLogin = async (data: PhoneLoginForm) => {
    setIsLoading(true);
    try {
      // Phone authentication with Supabase
      // This requires phone auth to be enabled in Supabase
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        phone: data.phone,
        password: data.password,
      });

      if (error) {
        toast.error(t("auth.invalidCredentials"));
        return;
      }

      if (authData.user) {
        // Fetch user profile
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("role, school_id")
          .eq("id", authData.user.id)
          .single();

        if (profileError || !userProfile) {
          toast.error(t("auth.profileLoadError"));
          return;
        }

        toast.success(t("auth.loginSuccess"));
        
        // Redirect based on role
        const dashboardPath = `/${userProfile.role}/dashboard`;
        router.push(dashboardPath);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(t("auth.genericError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl font-bold text-primary">
              Tilmeedhy • تلميذي
            </div>
          </div>
          <CardTitle className="text-2xl">{t("auth.loginTitle")}</CardTitle>
          <CardDescription>{t("auth.loginDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={loginMethod}
            onValueChange={(value) => setLoginMethod(value as "email" | "phone")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t("auth.emailLogin")}
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t("auth.phoneLogin")}
              </TabsTrigger>
            </TabsList>

            {/* Email Login Tab */}
            <TabsContent value="email">
              <form onSubmit={emailForm.handleSubmit(onEmailLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("common.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="parent@example.com"
                      className="pl-10"
                      {...emailForm.register("email")}
                      disabled={isLoading}
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("common.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...emailForm.register("password")}
                      disabled={isLoading}
                    />
                  </div>
                  {emailForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {emailForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>{t("common.rememberMe")}</span>
                  </label>
                  <Button variant="link" size="sm" className="p-0 h-auto" type="button">
                    {t("common.forgotPassword")}
                  </Button>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("common.login")}
                </Button>
              </form>
            </TabsContent>

            {/* Phone Login Tab */}
            <TabsContent value="phone">
              <form onSubmit={phoneForm.handleSubmit(onPhoneLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("common.phone")}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+218 91 234 5678"
                      className="pl-10"
                      {...phoneForm.register("phone")}
                      disabled={isLoading}
                    />
                  </div>
                  {phoneForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">
                      {phoneForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-password">{t("common.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...phoneForm.register("password")}
                      disabled={isLoading}
                    />
                  </div>
                  {phoneForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {phoneForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>{t("common.rememberMe")}</span>
                  </label>
                  <Button variant="link" size="sm" className="p-0 h-auto" type="button">
                    {t("common.forgotPassword")}
                  </Button>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("common.login")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>© 2024 Tilmeedhy. All rights reserved.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

