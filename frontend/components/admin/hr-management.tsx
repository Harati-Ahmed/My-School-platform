"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { UserFormDialog } from "./user-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { deleteUser } from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

/**
 * HR Management Component
 * Client component for managing HR users with CRUD operations
 */

interface HRUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "hr";
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface HRManagementProps {
  initialHRUsers: HRUser[];
}

export function HRManagement({ initialHRUsers }: HRManagementProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const [hrUsers, setHRUsers] = useState(initialHRUsers);
  const [selectedHRUser, setSelectedHRUser] = useState<HRUser | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const handleCreate = () => {
    setSelectedHRUser(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (hrUser: HRUser) => {
    setSelectedHRUser(hrUser);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = async (hrUser: HRUser) => {
    if (!confirm(`${t("confirmDeactivate")} ${hrUser.name}?`)) {
      return;
    }

    const result = await deleteUser(hrUser.id, hrUser.name);

    if (result.error) {
      toast.error(tAdmin("failedToDelete"));
      return;
    }

    toast.success(tAdmin("deactivatedSuccessfully"));
    setHRUsers(hrUsers.filter((u) => u.id !== hrUser.id));
  };

  const columns = [
    {
      key: "name",
      label: t("name"),
      render: (hrUser: HRUser) => (
        <div>
          <p className="font-medium">{hrUser.name}</p>
          {!hrUser.is_active && (
            <span className="text-xs text-destructive">(Inactive)</span>
          )}
        </div>
      ),
    },
    {
      key: "email",
      label: t("email"),
      render: (hrUser: HRUser) => hrUser.email,
    },
    {
      key: "phone",
      label: t("phone"),
      render: (hrUser: HRUser) => hrUser.phone || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "last_login",
      label: tAdmin("lastLogin"),
      render: (hrUser: HRUser) =>
        hrUser.last_login
          ? formatDistanceToNow(new Date(hrUser.last_login), { addSuffix: true })
          : tAdmin("never"),
    },
    {
      key: "created_at",
      label: t("date"),
      render: (hrUser: HRUser) =>
        formatDistanceToNow(new Date(hrUser.created_at), { addSuffix: true }),
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {tAdmin("addHR")}
          </Button>
        </div>

        <DataTable
          data={hrUsers}
          columns={columns}
          searchKeys={["name", "email", "phone"]}
          searchPlaceholder={tAdmin("searchHR")}
          emptyMessage={tAdmin("noHR")}
          actions={(hrUser) => (
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(hrUser)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(hrUser)}
                className="text-destructive hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedHRUser}
        mode={dialogMode}
        roleType="hr"
      />
    </>
  );
}

