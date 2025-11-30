"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Mail, Phone, Building2, Loader2, Users, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateSchoolAdmin, deleteSchoolAdmin } from "@/lib/actions/super-admin";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "teacher" | "parent" | "hr";
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

interface AllUsersManagementProps {
  initialUsers: User[];
}

export function AllUsersManagement({ initialUsers }: AllUsersManagementProps) {
  const t = useTranslations();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [roleFilter, setRoleFilter] = useState<"all" | "teacher" | "parent" | "hr">("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  // Get unique schools for filter
  const uniqueSchools = useMemo(() => {
    const schoolsMap = new Map<string, { id: string; name: string; name_ar?: string }>();
    users.forEach((user) => {
      if (user.school && !schoolsMap.has(user.school.id)) {
        schoolsMap.set(user.school.id, user.school);
      }
    });
    return Array.from(schoolsMap.values());
  }, [users]);

  // Filter users by role and other filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      // School filter
      const matchesSchool =
        schoolFilter === "all" ||
        (user.school && user.school.id === schoolFilter);

      // Date range filter
      let matchesDateRange = true;
      if (dateFromFilter || dateToFilter) {
        const userDate = new Date(user.created_at);
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter);
          fromDate.setHours(0, 0, 0, 0);
          if (userDate < fromDate) matchesDateRange = false;
        }
        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          toDate.setHours(23, 59, 59, 999);
          if (userDate > toDate) matchesDateRange = false;
        }
      }

      return matchesRole && matchesStatus && matchesSchool && matchesDateRange;
    });
  }, [users, roleFilter, statusFilter, schoolFilter, dateFromFilter, dateToFilter]);

  const handleUpdate = async (data: any) => {
    if (!editingUser) return;
    setIsUpdating(true);
    const result = await updateSchoolAdmin(editingUser.id, data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("admin.superAdmin.userUpdatedSuccess"));
      setShowEditDialog(false);
      setEditingUser(null);
      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser.id ? { ...user, ...data } : user
        )
      );
    }
    setIsUpdating(false);
  };

  const handleDelete = async (hardDelete: boolean = false) => {
    if (!deletingUser) return;
    setIsDeleting(true);
    const result = await deleteSchoolAdmin(deletingUser.id, hardDelete);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        hardDelete
          ? t("admin.superAdmin.userDeletedSuccess")
          : t("admin.superAdmin.userDeactivatedSuccess")
      );
      setDeletingUser(null);
      // Remove from local state
      setUsers((prev) => prev.filter((user) => user.id !== deletingUser.id));
    }
    setIsDeleting(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "teacher":
        return t("roles.teacher");
      case "parent":
        return t("roles.parent");
      case "hr":
        return t("roles.hr");
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "teacher":
        return "default";
      case "parent":
        return "secondary";
      case "hr":
        return "outline";
      default:
        return "default";
    }
  };

  const columns = [
    {
      key: "name",
      label: t("admin.superAdmin.name"),
      render: (user: User) => (
        <div>
          <p className="font-medium">{user.name}</p>
          {!user.is_active && (
            <Badge variant="secondary" className="text-xs mt-1">
              {t("admin.superAdmin.inactive")}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "role",
      label: t("admin.superAdmin.role"),
      render: (user: User) => (
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {getRoleLabel(user.role)}
        </Badge>
      ),
    },
    {
      key: "email",
      label: t("admin.superAdmin.email"),
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{user.email}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: t("admin.superAdmin.phone"),
      render: (user: User) =>
        user.phone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{user.phone}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "school",
      label: t("admin.superAdmin.school"),
      render: (user: User) =>
        user.school ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{user.school.name}</p>
              {user.school.name_ar && (
                <p className="text-xs text-muted-foreground">{user.school.name_ar}</p>
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
      render: (user: User) =>
        user.last_login
          ? formatDistanceToNow(new Date(user.last_login), { addSuffix: true })
          : t("admin.superAdmin.never"),
    },
    {
      key: "created_at",
      label: t("admin.superAdmin.created"),
      render: (user: User) =>
        formatDistanceToNow(new Date(user.created_at), { addSuffix: true }),
    },
  ];

  const roleCounts = useMemo(() => {
    return {
      all: users.length,
      teacher: users.filter((u) => u.role === "teacher").length,
      parent: users.filter((u) => u.role === "parent").length,
      hr: users.filter((u) => u.role === "hr").length,
    };
  }, [users]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("admin.superAdmin.allUsers")}</CardTitle>
              <CardDescription>
                {t("admin.superAdmin.allUsersSubtitle")} ({filteredUsers.length} / {users.length})
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="role-filter" className="text-sm">
                  {t("admin.superAdmin.filterByRole")}:
                </Label>
                <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("common.all")} ({roleCounts.all})
                    </SelectItem>
                    <SelectItem value="teacher">
                      {t("roles.teacher")} ({roleCounts.teacher})
                    </SelectItem>
                    <SelectItem value="parent">
                      {t("roles.parent")} ({roleCounts.parent})
                    </SelectItem>
                    <SelectItem value="hr">
                      {t("roles.hr")} ({roleCounts.hr})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
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
                <Label htmlFor="status-filter-users">{t("admin.superAdmin.status")}</Label>
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
                <Label htmlFor="school-filter-users">{t("admin.superAdmin.filterBySchool")}</Label>
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
                <Label htmlFor="date-from-users">{t("admin.superAdmin.createdFrom")}</Label>
                <Input
                  id="date-from-users"
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to-users">{t("admin.superAdmin.createdTo")}</Label>
                <Input
                  id="date-to-users"
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
            data={filteredUsers}
            columns={columns}
            searchKeys={["name", "email", "phone"]}
            searchPlaceholder={t("admin.superAdmin.searchUsers")}
            emptyMessage={t("admin.superAdmin.noUsersFound")}
            actions={(user) => (
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingUser(user);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingUser(user)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog && !!editingUser} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) setEditingUser(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.superAdmin.editUser")}</DialogTitle>
            <DialogDescription>{t("admin.superAdmin.updateUser")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await handleUpdate({
                name: formData.get("user_name") as string,
                email: formData.get("user_email") as string,
                phone: (formData.get("user_phone") as string) || undefined,
                password: (formData.get("user_password") as string) || undefined,
                is_active: formData.get("user_active") === "true",
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="edit_user_name">{t("admin.superAdmin.name")} *</Label>
              <Input
                id="edit_user_name"
                name="user_name"
                required
                defaultValue={editingUser?.name}
              />
            </div>
            <div>
              <Label htmlFor="edit_user_email">{t("admin.superAdmin.email")} *</Label>
              <Input
                id="edit_user_email"
                name="user_email"
                type="email"
                required
                defaultValue={editingUser?.email}
              />
            </div>
            <div>
              <Label htmlFor="edit_user_phone">{t("admin.superAdmin.phone")}</Label>
              <Input
                id="edit_user_phone"
                name="user_phone"
                defaultValue={editingUser?.phone}
              />
            </div>
            <div>
              <Label htmlFor="edit_user_password">{t("admin.superAdmin.resetPassword")}</Label>
              <Input
                id="edit_user_password"
                name="user_password"
                type="password"
                placeholder={t("admin.superAdmin.resetPasswordHelper")}
              />
            </div>
            <div>
              <Label htmlFor="edit_user_active">{t("admin.superAdmin.status")}</Label>
              <Select name="user_active" defaultValue={editingUser?.is_active ? "true" : "false"}>
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
                  setEditingUser(null);
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

      {/* Delete User Confirmation */}
      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.superAdmin.deleteUser")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.superAdmin.confirmDeactivateUser")}
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
              {t("admin.superAdmin.deactivateUser")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

