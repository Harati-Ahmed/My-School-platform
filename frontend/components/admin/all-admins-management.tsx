"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Mail, Phone, Building2, Loader2, Filter, ArrowRightLeft } from "lucide-react";
import { updateSchoolAdmin, deleteSchoolAdmin, transferAdmin, getAllSchools } from "@/lib/actions/super-admin";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface Admin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  school_id: string;
  school?: {
    id: string;
    name: string;
    name_ar?: string;
  };
}

interface AllAdminsManagementProps {
  initialAdmins: Admin[];
}

export function AllAdminsManagement({ initialAdmins }: AllAdminsManagementProps) {
  const t = useTranslations();
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);

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
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transferringAdmin, setTransferringAdmin] = useState<Admin | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [schools, setSchools] = useState<Array<{ id: string; name: string; name_ar?: string }>>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  const handleUpdate = async (data: any) => {
    if (!editingAdmin) return;
    setIsUpdating(true);
    const result = await updateSchoolAdmin(editingAdmin.id, data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("admin.superAdmin.adminUpdatedSuccess"));
      setShowEditDialog(false);
      setEditingAdmin(null);
      // Update local state
      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === editingAdmin.id ? { ...admin, ...data } : admin
        )
      );
    }
    setIsUpdating(false);
  };

  const handleDelete = async (hardDelete: boolean = false) => {
    if (!deletingAdmin) return;
    setIsDeleting(true);
    const result = await deleteSchoolAdmin(deletingAdmin.id, hardDelete);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        hardDelete
          ? t("admin.superAdmin.adminDeletedSuccess")
          : t("admin.superAdmin.adminDeactivatedSuccess")
      );
      setDeletingAdmin(null);
      // Remove from local state
      setAdmins((prev) => prev.filter((admin) => admin.id !== deletingAdmin.id));
    }
    setIsDeleting(false);
  };

  const handleTransfer = async (newSchoolId: string | null) => {
    if (!transferringAdmin) return;
    setIsTransferring(true);
    const result = await transferAdmin(transferringAdmin.id, newSchoolId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("admin.superAdmin.adminTransferredSuccess"));
      setShowTransferDialog(false);
      setTransferringAdmin(null);
      // Update local state
      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === transferringAdmin.id
            ? { ...admin, school_id: newSchoolId || "", school: newSchoolId ? schools.find((s) => s.id === newSchoolId) : undefined }
            : admin
        )
      );
    }
    setIsTransferring(false);
  };

  // Get unique schools for filter
  const uniqueSchools = useMemo(() => {
    const schoolsMap = new Map<string, { id: string; name: string; name_ar?: string }>();
    admins.forEach((admin) => {
      if (admin.school && !schoolsMap.has(admin.school.id)) {
        schoolsMap.set(admin.school.id, admin.school);
      }
    });
    return Array.from(schoolsMap.values());
  }, [admins]);

  // Filter admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && admin.is_active) ||
        (statusFilter === "inactive" && !admin.is_active);

      // School filter
      const matchesSchool =
        schoolFilter === "all" ||
        (admin.school && admin.school.id === schoolFilter);

      // Date range filter
      let matchesDateRange = true;
      if (dateFromFilter || dateToFilter) {
        const adminDate = new Date(admin.created_at);
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter);
          fromDate.setHours(0, 0, 0, 0);
          if (adminDate < fromDate) matchesDateRange = false;
        }
        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          toDate.setHours(23, 59, 59, 999);
          if (adminDate > toDate) matchesDateRange = false;
        }
      }

      return matchesStatus && matchesSchool && matchesDateRange;
    });
  }, [admins, statusFilter, schoolFilter, dateFromFilter, dateToFilter]);

  const columns = [
    {
      key: "name",
      label: t("admin.superAdmin.name"),
      render: (admin: Admin) => (
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
      render: (admin: Admin) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{admin.email}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: t("admin.superAdmin.phone"),
      render: (admin: Admin) =>
        admin.phone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{admin.phone}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "school",
      label: t("admin.superAdmin.school"),
      render: (admin: Admin) =>
        admin.school ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{admin.school.name}</p>
              {admin.school.name_ar && (
                <p className="text-xs text-muted-foreground">{admin.school.name_ar}</p>
              )}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "last_login",
      label: t("admin.superAdmin.lastLogin"),
      render: (admin: Admin) =>
        admin.last_login
          ? formatDistanceToNow(new Date(admin.last_login), { addSuffix: true })
          : t("admin.superAdmin.never"),
    },
    {
      key: "created_at",
      label: t("admin.superAdmin.created"),
      render: (admin: Admin) =>
        formatDistanceToNow(new Date(admin.created_at), { addSuffix: true }),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.superAdmin.allAdmins")}</CardTitle>
          <CardDescription>
            {t("admin.superAdmin.allAdminsSubtitle")} ({filteredAdmins.length} / {admins.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Advanced Filters */}
          <div className="mb-6 space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <h3 className="font-semibold">{t("admin.superAdmin.filters")}</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="status-filter">{t("admin.superAdmin.status")}</Label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    <SelectItem value="active">{t("admin.superAdmin.active")}</SelectItem>
                    <SelectItem value="inactive">{t("admin.superAdmin.inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="school-filter">{t("admin.superAdmin.filterBySchool")}</Label>
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {uniqueSchools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date-from">{t("admin.superAdmin.createdFrom")}</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to">{t("admin.superAdmin.createdTo")}</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>
            </div>
            {(statusFilter !== "all" || schoolFilter !== "all" || dateFromFilter || dateToFilter) && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setSchoolFilter("all");
                    setDateFromFilter("");
                    setDateToFilter("");
                  }}
                >
                  {t("admin.superAdmin.clearFilters")}
                </Button>
              </div>
            )}
          </div>
          <DataTable
            data={filteredAdmins}
            columns={columns}
            searchKeys={["name", "email", "phone"]}
            searchPlaceholder={t("admin.superAdmin.searchAdmins")}
            emptyMessage={t("admin.superAdmin.noAdminsFound")}
            actions={(admin) => (
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingAdmin(admin);
                    setShowEditDialog(true);
                  }}
                  title={t("common.edit")}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingAdmin(admin)}
                  className="text-destructive hover:text-destructive"
                  title={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Edit Admin Dialog */}
      <Dialog open={showEditDialog && !!editingAdmin} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) setEditingAdmin(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.superAdmin.editAdmin")}</DialogTitle>
            <DialogDescription>{t("admin.superAdmin.updateAdmin")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await handleUpdate({
                name: formData.get("admin_name") as string,
                email: formData.get("admin_email") as string,
                phone: (formData.get("admin_phone") as string) || undefined,
                password: (formData.get("admin_password") as string) || undefined,
                is_active: formData.get("admin_active") === "true",
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="edit_admin_name">{t("admin.superAdmin.name")} *</Label>
              <Input
                id="edit_admin_name"
                name="admin_name"
                required
                defaultValue={editingAdmin?.name}
              />
            </div>
            <div>
              <Label htmlFor="edit_admin_email">{t("admin.superAdmin.email")} *</Label>
              <Input
                id="edit_admin_email"
                name="admin_email"
                type="email"
                required
                defaultValue={editingAdmin?.email}
              />
            </div>
            <div>
              <Label htmlFor="edit_admin_phone">{t("admin.superAdmin.phone")}</Label>
              <Input
                id="edit_admin_phone"
                name="admin_phone"
                defaultValue={editingAdmin?.phone}
              />
            </div>
            <div>
              <Label htmlFor="edit_admin_password">{t("admin.superAdmin.resetPassword")}</Label>
              <Input
                id="edit_admin_password"
                name="admin_password"
                type="password"
                placeholder={t("admin.superAdmin.resetPasswordHelper")}
              />
            </div>
            <div>
              <Label htmlFor="edit_admin_active">{t("admin.superAdmin.status")}</Label>
              <Select name="admin_active" defaultValue={editingAdmin?.is_active ? "true" : "false"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t("admin.superAdmin.active")}</SelectItem>
                  <SelectItem value="false">{t("admin.superAdmin.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingAdmin(null);
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

      {/* Delete Admin Confirmation */}
      <AlertDialog
        open={!!deletingAdmin}
        onOpenChange={(open) => !open && setDeletingAdmin(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.superAdmin.deleteAdmin")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.superAdmin.confirmDeactivateAdmin")}
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
              {t("admin.superAdmin.deactivateAdmin")}
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
                name: transferringAdmin?.name || "",
                currentSchool: transferringAdmin?.school?.name || t("admin.superAdmin.noSchoolAssigned"),
              })}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newSchoolId = formData.get("new_school_id") as string;
              await handleTransfer(newSchoolId === "none" ? null : newSchoolId);
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="new_school_id">{t("admin.superAdmin.transferToSchool")}</Label>
              <Select name="new_school_id" defaultValue={transferringAdmin?.school_id || "none"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("admin.superAdmin.noSchool")} ({t("admin.superAdmin.makeSuperAdmin")})
                  </SelectItem>
                  {schools
                    .filter((school) => school.id !== transferringAdmin?.school_id)
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

