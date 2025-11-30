"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileSpreadsheet, Building2, Users, BarChart } from "lucide-react";
import { exportSchoolsData, exportUsersData, exportPlatformStatsReport } from "@/lib/actions/super-admin";
import toast from "react-hot-toast";
import { format } from "date-fns";

export function DataExportPanel() {
  const t = useTranslations();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportSchools = async () => {
    setIsExporting("schools");
    try {
      const result = await exportSchoolsData();
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        const filename = `schools_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
        downloadCSV(result.data, filename);
        toast.success(t("admin.superAdmin.exportSuccess"));
      }
    } catch (error: any) {
      toast.error(error.message || t("admin.superAdmin.exportFailed"));
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportUsers = async (role?: "admin" | "teacher" | "parent" | "hr") => {
    const exportType = role || "all";
    setIsExporting(`users-${exportType}`);
    try {
      const result = await exportUsersData(role);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        const roleLabel = role ? t(`roles.${role}`) : "all";
        const filename = `users_${roleLabel}_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
        downloadCSV(result.data, filename);
        toast.success(t("admin.superAdmin.exportSuccess"));
      }
    } catch (error: any) {
      toast.error(error.message || t("admin.superAdmin.exportFailed"));
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportStats = async () => {
    setIsExporting("stats");
    try {
      const result = await exportPlatformStatsReport();
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        const filename = `platform_statistics_${format(new Date(), "yyyy-MM-dd")}.csv`;
        downloadCSV(result.data, filename);
        toast.success(t("admin.superAdmin.exportSuccess"));
      }
    } catch (error: any) {
      toast.error(error.message || t("admin.superAdmin.exportFailed"));
    } finally {
      setIsExporting(null);
    }
  };

  const exportCards = [
    {
      id: "schools",
      title: t("admin.superAdmin.exportSchools"),
      description: t("admin.superAdmin.exportSchoolsDescription"),
      icon: Building2,
      onClick: handleExportSchools,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      id: "stats",
      title: t("admin.superAdmin.exportStatistics"),
      description: t("admin.superAdmin.exportStatisticsDescription"),
      icon: BarChart,
      onClick: handleExportStats,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      id: "users-all",
      title: t("admin.superAdmin.exportAllUsers"),
      description: t("admin.superAdmin.exportAllUsersDescription"),
      icon: Users,
      onClick: () => handleExportUsers(),
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      id: "users-admins",
      title: t("admin.superAdmin.exportAdmins"),
      description: t("admin.superAdmin.exportAdminsDescription"),
      icon: Users,
      onClick: () => handleExportUsers("admin"),
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      id: "users-teachers",
      title: t("admin.superAdmin.exportTeachers"),
      description: t("admin.superAdmin.exportTeachersDescription"),
      icon: Users,
      onClick: () => handleExportUsers("teacher"),
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
    },
    {
      id: "users-parents",
      title: t("admin.superAdmin.exportParents"),
      description: t("admin.superAdmin.exportParentsDescription"),
      icon: Users,
      onClick: () => handleExportUsers("parent"),
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
    },
    {
      id: "users-hr",
      title: t("admin.superAdmin.exportHR"),
      description: t("admin.superAdmin.exportHRDescription"),
      icon: Users,
      onClick: () => handleExportUsers("hr"),
      color: "text-cyan-600",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {exportCards.map((card) => {
        const Icon = card.icon;
        const isLoading = isExporting === card.id;
        return (
          <Card key={card.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="mt-2">{card.description}</CardDescription>
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={card.onClick}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("admin.superAdmin.exporting")}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t("admin.superAdmin.export")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

