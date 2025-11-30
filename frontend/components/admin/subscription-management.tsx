"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format, isAfter, isBefore, parseISO } from "date-fns";
import { updateSchool } from "@/lib/actions/super-admin";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/routing";

interface School {
  id: string;
  name: string;
  name_ar?: string;
  subscription_status?: "active" | "trial" | "expired" | "canceled";
  subscription_plan?: string;
  subscription_end?: string;
  max_students?: number;
  max_teachers?: number;
  contact_email?: string;
  created_at: string;
}

interface SubscriptionManagementProps {
  initialSchools: School[];
}

export function SubscriptionManagement({ initialSchools }: SubscriptionManagementProps) {
  const t = useTranslations();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "trial" | "expired" | "canceled">("all");
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter schools by subscription status
  const filteredSchools = useMemo(() => {
    if (statusFilter === "all") return schools;
    return schools.filter((school) => school.subscription_status === statusFilter);
  }, [schools, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = schools.length;
    const active = schools.filter((s) => s.subscription_status === "active").length;
    const trial = schools.filter((s) => s.subscription_status === "trial").length;
    const expired = schools.filter((s) => s.subscription_status === "expired").length;
    const canceled = schools.filter((s) => s.subscription_status === "canceled").length;
    const expiringSoon = schools.filter((s) => {
      if (!s.subscription_end || s.subscription_status !== "active") return false;
      const endDate = parseISO(s.subscription_end);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    return { total, active, trial, expired, canceled, expiringSoon };
  }, [schools]);

  const handleUpdate = async (data: any) => {
    if (!editingSchool) return;
    setIsUpdating(true);
    const result = await updateSchool(editingSchool.id, data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("admin.superAdmin.subscriptionUpdatedSuccess"));
      setShowEditDialog(false);
      setEditingSchool(null);
      // Update local state
      setSchools((prev) =>
        prev.map((school) =>
          school.id === editingSchool.id ? { ...school, ...data } : school
        )
      );
      router.refresh();
    }
    setIsUpdating(false);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("admin.superAdmin.active")}
          </Badge>
        );
      case "trial":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {t("admin.superAdmin.trial")}
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {t("admin.superAdmin.expired")}
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline">
            <XCircle className="h-3 w-3 mr-1" />
            {t("admin.superAdmin.canceled")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const getExpiryStatus = (endDate?: string) => {
    if (!endDate) return null;
    const end = parseISO(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: "expired", days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 7) {
      return { status: "critical", days: daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
      return { status: "warning", days: daysUntilExpiry };
    } else {
      return { status: "ok", days: daysUntilExpiry };
    }
  };

  const columns = [
    {
      key: "name",
      label: t("admin.superAdmin.school"),
      render: (school: School) => (
        <div>
          <p className="font-medium">{school.name}</p>
          {school.name_ar && (
            <p className="text-xs text-muted-foreground">{school.name_ar}</p>
          )}
        </div>
      ),
    },
    {
      key: "subscription_status",
      label: t("admin.superAdmin.status"),
      render: (school: School) => getStatusBadge(school.subscription_status),
    },
    {
      key: "subscription_plan",
      label: t("admin.superAdmin.plan"),
      render: (school: School) => (
        <Badge variant="outline">{school.subscription_plan || "-"}</Badge>
      ),
    },
    {
      key: "subscription_end",
      label: t("admin.superAdmin.expiryDate"),
      render: (school: School) => {
        if (!school.subscription_end) return <span className="text-muted-foreground">-</span>;
        const expiryStatus = getExpiryStatus(school.subscription_end);
        return (
          <div>
            <p className="text-sm">
              {format(parseISO(school.subscription_end), "MMM dd, yyyy")}
            </p>
            {expiryStatus && (
              <p
                className={`text-xs ${
                  expiryStatus.status === "expired"
                    ? "text-red-600"
                    : expiryStatus.status === "critical"
                    ? "text-orange-600"
                    : expiryStatus.status === "warning"
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {expiryStatus.status === "expired"
                  ? t("admin.superAdmin.expiredDaysAgo", { days: expiryStatus.days })
                  : t("admin.superAdmin.daysRemaining", { days: expiryStatus.days })}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "limits",
      label: t("admin.superAdmin.limits"),
      render: (school: School) => (
        <div className="text-sm">
          <p>
            {t("admin.superAdmin.students")}: {school.max_students || "-"}
          </p>
          <p>
            {t("admin.superAdmin.teachers")}: {school.max_teachers || "-"}
          </p>
        </div>
      ),
    },
    {
      key: "created_at",
      label: t("admin.superAdmin.created"),
      render: (school: School) =>
        formatDistanceToNow(new Date(school.created_at), { addSuffix: true }),
    },
  ];

  const statCards = [
    {
      title: t("admin.superAdmin.totalSchools"),
      value: stats.total,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: t("admin.superAdmin.activeSubscriptions"),
      value: stats.active,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: t("admin.superAdmin.trialSubscriptions"),
      value: stats.trial,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
    {
      title: t("admin.superAdmin.expiredSubscriptions"),
      value: stats.expired,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
    {
      title: t("admin.superAdmin.expiringSoon"),
      value: stats.expiringSoon,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Subscription Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("admin.superAdmin.subscriptions")}</CardTitle>
              <CardDescription>
                {t("admin.superAdmin.manageSubscriptions")} ({filteredSchools.length})
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="status-filter" className="text-sm">
                  {t("admin.superAdmin.filterByStatus")}:
                </Label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("common.all")} ({stats.total})
                    </SelectItem>
                    <SelectItem value="active">
                      {t("admin.superAdmin.active")} ({stats.active})
                    </SelectItem>
                    <SelectItem value="trial">
                      {t("admin.superAdmin.trial")} ({stats.trial})
                    </SelectItem>
                    <SelectItem value="expired">
                      {t("admin.superAdmin.expired")} ({stats.expired})
                    </SelectItem>
                    <SelectItem value="canceled">
                      {t("admin.superAdmin.canceled")} ({stats.canceled})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredSchools}
            columns={columns}
            searchKeys={["name", "name_ar", "subscription_plan"]}
            searchPlaceholder={t("admin.superAdmin.searchSubscriptions")}
            emptyMessage={t("admin.superAdmin.noSubscriptionsFound")}
            actions={(school) => (
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingSchool(school);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t("admin.superAdmin.editSubscription")}
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Edit Subscription Dialog */}
      <Dialog open={showEditDialog && !!editingSchool} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) setEditingSchool(null);
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin.superAdmin.editSubscription")}</DialogTitle>
            <DialogDescription>
              {t("admin.superAdmin.updateSubscriptionDetails")}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await handleUpdate({
                subscription_status: formData.get("subscription_status") as any,
                subscription_plan: formData.get("subscription_plan") as string,
                subscription_end: formData.get("subscription_end") as string || undefined,
                max_students: formData.get("max_students")
                  ? parseInt(formData.get("max_students") as string)
                  : undefined,
                max_teachers: formData.get("max_teachers")
                  ? parseInt(formData.get("max_teachers") as string)
                  : undefined,
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="subscription_status">{t("admin.superAdmin.subscriptionStatus")} *</Label>
              <Select
                name="subscription_status"
                defaultValue={editingSchool?.subscription_status || "trial"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("admin.superAdmin.active")}</SelectItem>
                  <SelectItem value="trial">{t("admin.superAdmin.trial")}</SelectItem>
                  <SelectItem value="expired">{t("admin.superAdmin.expired")}</SelectItem>
                  <SelectItem value="canceled">{t("admin.superAdmin.canceled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subscription_plan">{t("admin.superAdmin.subscriptionPlan")}</Label>
              <Input
                id="subscription_plan"
                name="subscription_plan"
                defaultValue={editingSchool?.subscription_plan}
                placeholder="e.g., basic, premium, enterprise"
              />
            </div>
            <div>
              <Label htmlFor="subscription_end">{t("admin.superAdmin.subscriptionEndDate")}</Label>
              <Input
                id="subscription_end"
                name="subscription_end"
                type="date"
                defaultValue={
                  editingSchool?.subscription_end
                    ? format(parseISO(editingSchool.subscription_end), "yyyy-MM-dd")
                    : ""
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_students">{t("admin.superAdmin.maxStudents")}</Label>
                <Input
                  id="max_students"
                  name="max_students"
                  type="number"
                  defaultValue={editingSchool?.max_students}
                />
              </div>
              <div>
                <Label htmlFor="max_teachers">{t("admin.superAdmin.maxTeachers")}</Label>
                <Input
                  id="max_teachers"
                  name="max_teachers"
                  type="number"
                  defaultValue={editingSchool?.max_teachers}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingSchool(null);
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("common.update")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

