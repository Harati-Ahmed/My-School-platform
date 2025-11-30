"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  GraduationCap,
  School,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  UserCog,
  Clock,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SchoolFormDialog } from "./school-form-dialog";
import { updateSchool, deleteSchool, transferAdmin, getAllSchools } from "@/lib/actions/super-admin";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Loader2, ArrowRightLeft } from "lucide-react";
import { DataTable } from "./data-table";
import { Label } from "@/components/ui/label";

interface SchoolDetails {
  school: any;
  stats: {
    admins: number;
    students: number;
    teachers: number;
    parents: number;
    hr: number;
    classes: number;
    subjects: number;
  };
  admins: any[];
  recentUsers: any[];
}

interface SchoolDetailsViewProps {
  schoolDetails: SchoolDetails;
}

export function SchoolDetailsView({ schoolDetails }: SchoolDetailsViewProps) {
  const t = useTranslations();
  const router = useRouter();

  // Load schools for transfer dialog
  useEffect(() => {
    const loadSchools = async () => {
      const result = await getAllSchools();
      if (result.data) {
        setSchools(result.data);
      }
    };
    loadSchools();
  }, []);
  const [editingSchool, setEditingSchool] = useState<any | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transferringAdmin, setTransferringAdmin] = useState<any | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [schools, setSchools] = useState<Array<{ id: string; name: string; name_ar?: string }>>([]);

  const handleUpdate = async (data: any) => {
    if (!editingSchool) return;
    setIsUpdating(true);
    const result = await updateSchool(editingSchool.id, data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("admin.superAdmin.schoolUpdatedSuccess"));
      setShowEditDialog(false);
      setEditingSchool(null);
      router.refresh();
    }
    setIsUpdating(false);
  };

  const handleDelete = async (hardDelete: boolean = false) => {
    if (!deletingSchool) return;
    setIsDeleting(true);
    const result = await deleteSchool(deletingSchool.id, hardDelete);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        hardDelete
          ? t("admin.superAdmin.schoolDeletedSuccess")
          : t("admin.superAdmin.schoolDeactivatedSuccess")
      );
      router.push("/admin/super-admin");
    }
    setIsDeleting(false);
  };

  const handleTransferAdmin = async (newSchoolId: string | null) => {
    if (!transferringAdmin) return;
    setIsTransferring(true);
    const result = await transferAdmin(transferringAdmin.id, newSchoolId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("admin.superAdmin.adminTransferredSuccess"));
      setShowTransferDialog(false);
      setTransferringAdmin(null);
      router.refresh();
    }
    setIsTransferring(false);
  };

  const getSubscriptionStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">{t("admin.superAdmin.active")}</Badge>;
      case "trial":
        return <Badge variant="secondary">{t("admin.superAdmin.trial")}</Badge>;
      case "expired":
        return <Badge variant="destructive">{t("admin.superAdmin.expired")}</Badge>;
      case "canceled":
        return <Badge variant="outline">{t("admin.superAdmin.canceled")}</Badge>;
      default:
        return <Badge variant="secondary">{status || "-"}</Badge>;
    }
  };

  const statCards = [
    {
      title: t("admin.superAdmin.admins"),
      value: schoolDetails.stats.admins,
      icon: UserCog,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: t("admin.superAdmin.students"),
      value: schoolDetails.stats.students,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: t("admin.superAdmin.teachers"),
      value: schoolDetails.stats.teachers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: t("admin.superAdmin.parents"),
      value: schoolDetails.stats.parents,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: t("roles.hr"),
      value: schoolDetails.stats.hr,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
    },
    {
      title: t("admin.superAdmin.classes"),
      value: schoolDetails.stats.classes,
      icon: School,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
    },
    {
      title: t("admin.superAdmin.totalSubjects"),
      value: schoolDetails.stats.subjects,
      icon: BookOpen,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
    },
  ];

  const adminColumns = [
    {
      key: "name",
      label: t("admin.superAdmin.name"),
      render: (admin: any) => (
        <div>
          <p className="font-medium">{admin.name}</p>
          {!admin.is_active && (
            <Badge variant="secondary" className="text-xs mt-1">
              {t("admin.superAdmin.inactive")}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "email",
      label: t("admin.superAdmin.email"),
    },
    {
      key: "phone",
      label: t("admin.superAdmin.phone"),
      render: (admin: any) => admin.phone || "-",
    },
    {
      key: "created_at",
      label: t("admin.superAdmin.created"),
      render: (admin: any) =>
        formatDistanceToNow(new Date(admin.created_at), { addSuffix: true }),
    },
  ];

  const adminActions = (admin: any) => (
    <div className="flex items-center gap-2 justify-end">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setTransferringAdmin(admin);
          setShowTransferDialog(true);
        }}
        title={t("admin.superAdmin.transferAdmin")}
      >
        <ArrowRightLeft className="h-4 w-4" />
      </Button>
    </div>
  );

  const userColumns = [
    {
      key: "name",
      label: t("admin.superAdmin.name"),
      render: (user: any) => (
        <div>
          <p className="font-medium">{user.name}</p>
          <Badge variant="outline" className="text-xs mt-1">
            {t(`roles.${user.role}`)}
          </Badge>
        </div>
      ),
    },
    {
      key: "email",
      label: t("admin.superAdmin.email"),
    },
    {
      key: "role",
      label: t("admin.superAdmin.role"),
      render: (user: any) => t(`roles.${user.role}`),
    },
    {
      key: "created_at",
      label: t("admin.superAdmin.created"),
      render: (user: any) =>
        formatDistanceToNow(new Date(user.created_at), { addSuffix: true }),
    },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* School Info Card */}
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{schoolDetails.school.name}</CardTitle>
                {schoolDetails.school.name_ar && (
                  <CardDescription className="text-base mt-1">
                    {schoolDetails.school.name_ar}
                  </CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = `/admin/super-admin/schools/${schoolDetails.school.id}/statistics`;
                  }}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t("admin.superAdmin.viewStatistics")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingSchool(schoolDetails.school);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t("admin.superAdmin.editSchool")}
                </Button>
                {schoolDetails.school.is_active ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingSchool(schoolDetails.school)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("admin.superAdmin.deactivateSchool")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const result = await updateSchool(schoolDetails.school.id, { is_active: true });
                      if (result.error) {
                        toast.error(result.error);
                      } else {
                        toast.success(t("admin.superAdmin.schoolActivatedSuccess"));
                        router.refresh();
                      }
                    }}
                  >
                    {t("admin.superAdmin.activateSchool")}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{t("admin.superAdmin.contactEmail")}:</strong>{" "}
                    {schoolDetails.school.contact_email || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{t("admin.superAdmin.contactPhone")}:</strong>{" "}
                    {schoolDetails.school.contact_phone || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{t("admin.superAdmin.address")}:</strong>{" "}
                    {schoolDetails.school.address || "-"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{t("admin.superAdmin.subscriptionStatus")}:</strong>{" "}
                    {getSubscriptionStatusBadge(schoolDetails.school.subscription_status)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{t("admin.superAdmin.subscriptionPlan")}:</strong>{" "}
                    {schoolDetails.school.subscription_plan || "-"}
                  </span>
                </div>
                {schoolDetails.school.subscription_end && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{t("admin.superAdmin.subscriptionEnd")}:</strong>{" "}
                      {new Date(schoolDetails.school.subscription_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{t("admin.superAdmin.created")}:</strong>{" "}
                    {formatDistanceToNow(new Date(schoolDetails.school.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
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
                <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.superAdmin.admins")}</CardTitle>
          <CardDescription>
            {t("admin.superAdmin.allAdminsSubtitle")} ({schoolDetails.admins.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={schoolDetails.admins}
            columns={adminColumns}
            searchKeys={["name", "email", "phone"]}
            searchPlaceholder={t("admin.superAdmin.searchAdmins")}
            emptyMessage={t("admin.superAdmin.noAdmins")}
            actions={adminActions}
          />
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.superAdmin.recentUsers")}</CardTitle>
          <CardDescription>
            {t("admin.superAdmin.recentUsersDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={schoolDetails.recentUsers}
            columns={userColumns}
            searchKeys={["name", "email"]}
            searchPlaceholder={t("admin.superAdmin.searchUsers")}
            emptyMessage={t("admin.superAdmin.noUsersFound")}
          />
        </CardContent>
      </Card>

      {/* Edit School Dialog */}
      <SchoolFormDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setEditingSchool(null);
        }}
        onSubmit={handleUpdate}
        initialData={editingSchool || undefined}
        isLoading={isUpdating}
        mode="edit"
      />

      {/* Delete School Confirmation */}
      <AlertDialog
        open={!!deletingSchool}
        onOpenChange={(open) => !open && setDeletingSchool(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.superAdmin.deleteSchool")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.superAdmin.confirmDeactivateSchool")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(false)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("admin.superAdmin.deactivateSchool")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Admin Dialog */}
      <Dialog
        open={showTransferDialog && !!transferringAdmin}
        onOpenChange={(open) => {
          setShowTransferDialog(open);
          if (!open) setTransferringAdmin(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.superAdmin.transferAdmin")}</DialogTitle>
            <DialogDescription>
              {t("admin.superAdmin.transferAdminDescription", {
                name: transferringAdmin?.name,
                currentSchool: schoolDetails.school.name,
              })}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newSchoolId = formData.get("new_school_id") as string;
              await handleTransferAdmin(newSchoolId === "none" ? null : newSchoolId);
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="new_school_id">{t("admin.superAdmin.transferToSchool")}</Label>
              <Select name="new_school_id" defaultValue="none">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("admin.superAdmin.noSchool")} ({t("admin.superAdmin.makeSuperAdmin")})
                  </SelectItem>
                  {schools
                    .filter((school) => school.id !== schoolDetails.school.id)
                    .map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} {school.name_ar && `(${school.name_ar})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowTransferDialog(false);
                  setTransferringAdmin(null);
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isTransferring}>
                {isTransferring && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("admin.superAdmin.transfer")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

