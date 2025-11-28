"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "./data-table";
import { UserFormDialog } from "./user-form-dialog";
import { ParentQuickView } from "./parent-quick-view";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { deleteUser, getParentQuickViewStats } from "@/lib/actions/admin";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

/**
 * Parents Management Component
 */

interface Parent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "parent";
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface ParentsManagementProps {
  initialParents: Parent[];
}

export function ParentsManagement({ initialParents }: ParentsManagementProps) {
  const t = useTranslations("common");
  const tAdmin = useTranslations("admin.shared");
  const [parents, setParents] = useState(initialParents);
  const [selectedParent, setSelectedParent] = useState<Parent | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewParentId, setQuickViewParentId] = useState<string | null>(null);
  const [quickViewStats, setQuickViewStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const handleCreate = () => {
    setSelectedParent(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (parent: Parent) => {
    setSelectedParent(parent);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = async (parent: Parent) => {
    if (!confirm(`${t("confirmDeactivate")} ${parent.name}?`)) {
      return;
    }

    const result = await deleteUser(parent.id, parent.name);

    if (result.error) {
      const errorMessage = result.error || tAdmin("failedToDelete");
      toast.error(`Failed to deactivate ${parent.name}. ${errorMessage}`);
      return;
    }

    toast.success(tAdmin("deactivatedSuccessfully"));
    setParents(parents.filter((p) => p.id !== parent.id));
  };

  const handleUserSuccess = (user: { id: string; name: string; email: string; phone?: string; role: string; is_active?: boolean; created_at?: string; last_login?: string }) => {
    const updatedUser: Parent = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: "parent" as const,
      is_active: user.is_active ?? true,
      created_at: user.created_at ?? new Date().toISOString(),
      last_login: user.last_login,
    };
    
    if (dialogMode === "create") {
      // Optimistically add new parent
      setParents([...parents, updatedUser]);
    } else if (selectedParent) {
      // Optimistically update existing parent
      setParents(parents.map((p) => 
        p.id === selectedParent.id ? updatedUser : p
      ));
    }
  };

  const handleQuickView = async (parent: Parent) => {
    setQuickViewParentId(parent.id);
    setQuickViewOpen(true);
    setIsLoadingStats(true);
    try {
      const stats = await getParentQuickViewStats(parent.id);
      setQuickViewStats(stats);
    } catch (error) {
      toast.error("Failed to load parent stats");
      console.error(error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: t("name"),
      render: (parent: Parent) => (
        <div>
          <p className="font-medium">{parent.name}</p>
          {!parent.is_active && (
            <span className="text-xs text-destructive">(Inactive)</span>
          )}
        </div>
      ),
    },
    {
      key: "email",
      label: t("email"),
    },
    {
      key: "phone",
      label: t("phone"),
      render: (parent: Parent) => parent.phone || "-",
    },
    {
      key: "last_login",
      label: tAdmin("lastLogin"),
      render: (parent: Parent) =>
        parent.last_login
          ? formatDistanceToNow(new Date(parent.last_login), { addSuffix: true })
          : tAdmin("never"),
    },
    {
      key: "created_at",
      label: t("date"),
      render: (parent: Parent) =>
        formatDistanceToNow(new Date(parent.created_at), { addSuffix: true }),
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {tAdmin("addParent")}
          </Button>
        </div>

        <DataTable
          data={parents}
          columns={columns}
          searchKeys={["name", "email", "phone"]}
          searchPlaceholder={tAdmin("searchParents")}
          emptyMessage={tAdmin("noParents")}
          actions={(parent) => (
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickView(parent)}
                title="View Stats"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(parent)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(parent)}
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
        user={selectedParent}
        mode={dialogMode}
        roleType="parent"
        onSuccess={handleUserSuccess}
      />

      <ParentQuickView
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        stats={quickViewStats}
        isLoading={isLoadingStats}
      />
    </>
  );
}

