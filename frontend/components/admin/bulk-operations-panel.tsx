"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, CheckSquare, Square, Building2, Users, UserCog } from "lucide-react";
import { bulkUpdateSchools, bulkUpdateUsers } from "@/lib/actions/super-admin";
import toast from "react-hot-toast";
import { useRouter } from "@/i18n/routing";

interface School {
  id: string;
  name: string;
  name_ar?: string;
  is_active: boolean;
  subscription_status?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  school?: {
    id: string;
    name: string;
  };
}

interface BulkOperationsPanelProps {
  initialSchools: School[];
  initialAdmins: User[];
  initialUsers: User[];
}

export function BulkOperationsPanel({
  initialSchools,
  initialAdmins,
  initialUsers,
}: BulkOperationsPanelProps) {
  const t = useTranslations();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"schools" | "admins" | "users">("schools");
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set());
  const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAll = (type: "schools" | "admins" | "users") => {
    if (type === "schools") {
      if (selectedSchools.size === initialSchools.length) {
        setSelectedSchools(new Set());
      } else {
        setSelectedSchools(new Set(initialSchools.map((s) => s.id)));
      }
    } else if (type === "admins") {
      if (selectedAdmins.size === initialAdmins.length) {
        setSelectedAdmins(new Set());
      } else {
        setSelectedAdmins(new Set(initialAdmins.map((a) => a.id)));
      }
    } else {
      if (selectedUsers.size === initialUsers.length) {
        setSelectedUsers(new Set());
      } else {
        setSelectedUsers(new Set(initialUsers.map((u) => u.id)));
      }
    }
  };

  const handleToggleSelection = (type: "schools" | "admins" | "users", id: string) => {
    if (type === "schools") {
      const newSet = new Set(selectedSchools);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setSelectedSchools(newSet);
    } else if (type === "admins") {
      const newSet = new Set(selectedAdmins);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setSelectedAdmins(newSet);
    } else {
      const newSet = new Set(selectedUsers);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setSelectedUsers(newSet);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction) return;

    setIsProcessing(true);
    try {
      if (selectedTab === "schools" && selectedSchools.size > 0) {
        const schoolIds = Array.from(selectedSchools);
        let updates: any = {};

        if (bulkAction === "activate") {
          updates.is_active = true;
        } else if (bulkAction === "deactivate") {
          updates.is_active = false;
        } else if (bulkAction.startsWith("subscription_")) {
          updates.subscription_status = bulkAction.replace("subscription_", "");
        }

        const result = await bulkUpdateSchools(schoolIds, updates);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(
            t("admin.superAdmin.bulkOperationSuccess", {
              count: schoolIds.length,
              type: t("admin.superAdmin.schools"),
            })
          );
          setSelectedSchools(new Set());
          setBulkAction("");
          router.refresh();
        }
      } else if (selectedTab === "admins" && selectedAdmins.size > 0) {
        const adminIds = Array.from(selectedAdmins);
        let updates: any = {};

        if (bulkAction === "activate") {
          updates.is_active = true;
        } else if (bulkAction === "deactivate") {
          updates.is_active = false;
        }

        const result = await bulkUpdateUsers(adminIds, updates);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(
            t("admin.superAdmin.bulkOperationSuccess", {
              count: adminIds.length,
              type: t("admin.superAdmin.admins"),
            })
          );
          setSelectedAdmins(new Set());
          setBulkAction("");
          router.refresh();
        }
      } else if (selectedTab === "users" && selectedUsers.size > 0) {
        const userIds = Array.from(selectedUsers);
        let updates: any = {};

        if (bulkAction === "activate") {
          updates.is_active = true;
        } else if (bulkAction === "deactivate") {
          updates.is_active = false;
        }

        const result = await bulkUpdateUsers(userIds, updates);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(
            t("admin.superAdmin.bulkOperationSuccess", {
              count: userIds.length,
              type: t("admin.superAdmin.users"),
            })
          );
          setSelectedUsers(new Set());
          setBulkAction("");
          router.refresh();
        }
      }
    } catch (error: any) {
      toast.error(error.message || t("admin.superAdmin.bulkOperationFailed"));
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
    }
  };

  const getSelectedCount = () => {
    if (selectedTab === "schools") return selectedSchools.size;
    if (selectedTab === "admins") return selectedAdmins.size;
    return selectedUsers.size;
  };

  const getBulkActions = () => {
    if (selectedTab === "schools") {
      return [
        { value: "activate", label: t("admin.superAdmin.activateSchools") },
        { value: "deactivate", label: t("admin.superAdmin.deactivateSchools") },
        { value: "subscription_active", label: t("admin.superAdmin.setSubscriptionActive") },
        { value: "subscription_trial", label: t("admin.superAdmin.setSubscriptionTrial") },
        { value: "subscription_expired", label: t("admin.superAdmin.setSubscriptionExpired") },
        { value: "subscription_canceled", label: t("admin.superAdmin.setSubscriptionCanceled") },
      ];
    } else {
      return [
        { value: "activate", label: t("admin.superAdmin.activateUsers") },
        { value: "deactivate", label: t("admin.superAdmin.deactivateUsers") },
      ];
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card
          className={`cursor-pointer transition-colors ${
            selectedTab === "schools" ? "border-primary" : ""
          }`}
          onClick={() => setSelectedTab("schools")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("admin.superAdmin.schools")}
            </CardTitle>
            <CardDescription>{initialSchools.length} {t("admin.superAdmin.total")}</CardDescription>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${
            selectedTab === "admins" ? "border-primary" : ""
          }`}
          onClick={() => setSelectedTab("admins")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              {t("admin.superAdmin.admins")}
            </CardTitle>
            <CardDescription>{initialAdmins.length} {t("admin.superAdmin.total")}</CardDescription>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${
            selectedTab === "users" ? "border-primary" : ""
          }`}
          onClick={() => setSelectedTab("users")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("admin.superAdmin.users")}
            </CardTitle>
            <CardDescription>{initialUsers.length} {t("admin.superAdmin.total")}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {selectedTab === "schools"
                  ? t("admin.superAdmin.bulkManageSchools")
                  : selectedTab === "admins"
                  ? t("admin.superAdmin.bulkManageAdmins")
                  : t("admin.superAdmin.bulkManageUsers")}
              </CardTitle>
              <CardDescription>
                {t("admin.superAdmin.selectedCount", { count: getSelectedCount() })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(selectedTab)}
              >
                {getSelectedCount() ===
                (selectedTab === "schools"
                  ? initialSchools.length
                  : selectedTab === "admins"
                  ? initialAdmins.length
                  : initialUsers.length) ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    {t("admin.superAdmin.deselectAll")}
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {t("admin.superAdmin.selectAll")}
                  </>
                )}
              </Button>
              {getSelectedCount() > 0 && (
                <div className="flex items-center gap-2">
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t("admin.superAdmin.selectAction")} />
                    </SelectTrigger>
                    <SelectContent>
                      {getBulkActions().map((action) => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={!bulkAction || isProcessing}
                  >
                    {t("admin.superAdmin.apply")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {selectedTab === "schools" &&
              initialSchools.map((school) => (
                <div
                  key={school.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedSchools.has(school.id)}
                    onCheckedChange={() => handleToggleSelection("schools", school.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{school.name}</p>
                    {school.name_ar && (
                      <p className="text-sm text-muted-foreground">{school.name_ar}</p>
                    )}
                  </div>
                  <Badge variant={school.is_active ? "default" : "secondary"}>
                    {school.is_active ? t("admin.superAdmin.active") : t("admin.superAdmin.inactive")}
                  </Badge>
                  {school.subscription_status && (
                    <Badge variant="outline">{school.subscription_status}</Badge>
                  )}
                </div>
              ))}
            {selectedTab === "admins" &&
              initialAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedAdmins.has(admin.id)}
                    onCheckedChange={() => handleToggleSelection("admins", admin.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    {admin.school && (
                      <p className="text-xs text-muted-foreground">{admin.school.name}</p>
                    )}
                  </div>
                  <Badge variant={admin.is_active ? "default" : "secondary"}>
                    {admin.is_active ? t("admin.superAdmin.active") : t("admin.superAdmin.inactive")}
                  </Badge>
                </div>
              ))}
            {selectedTab === "users" &&
              initialUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedUsers.has(user.id)}
                    onCheckedChange={() => handleToggleSelection("users", user.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.school && (
                      <p className="text-xs text-muted-foreground">{user.school.name}</p>
                    )}
                  </div>
                  <Badge variant="outline">{t(`roles.${user.role}`)}</Badge>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? t("admin.superAdmin.active") : t("admin.superAdmin.inactive")}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.superAdmin.confirmBulkAction")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.superAdmin.confirmBulkActionDescription", {
                count: getSelectedCount(),
                action: getBulkActions().find((a) => a.value === bulkAction)?.label || bulkAction,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("admin.superAdmin.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

