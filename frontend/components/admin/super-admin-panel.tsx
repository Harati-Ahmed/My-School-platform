"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, School, Users, Loader2, Mail, Phone, MapPin, Calendar, UserPlus, GraduationCap, Edit, Trash2, MoreVertical, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getAllSchools, createSchool, updateSchool, deleteSchool, createSchoolAdmin, updateSchoolAdmin, deleteSchoolAdmin, getSchoolAdmins } from "@/lib/actions/super-admin";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { SchoolFormDialog } from "./school-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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

interface SchoolStats {
  admins: number;
  students: number;
  teachers: number;
  classes: number;
}

interface School {
  id: string;
  name: string;
  name_ar?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  logo_url?: string;
  theme_color?: string;
  subscription_status?: "active" | "trial" | "expired" | "canceled";
  subscription_plan?: string;
  subscription_end?: string;
  max_students?: number;
  max_teachers?: number;
  timezone?: string;
  is_active: boolean;
  created_at: string;
  stats?: SchoolStats;
}

interface SuperAdminPanelProps {
  initialSchools?: School[];
}

export function SuperAdminPanel({ initialSchools = [] }: SuperAdminPanelProps) {
  const t = useTranslations();
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [isLoading, setIsLoading] = useState(initialSchools.length === 0);
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);
  const [isUpdatingSchool, setIsUpdatingSchool] = useState(false);
  const [isDeletingSchool, setIsDeletingSchool] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<any | null>(null);
  const [schoolAdmins, setSchoolAdmins] = useState<Record<string, any[]>>({});
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [showEditSchoolDialog, setShowEditSchoolDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showEditAdminDialog, setShowEditAdminDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  useEffect(() => {
    if (initialSchools.length === 0) {
      loadSchools();
    }
  }, []);

  const loadSchools = async () => {
    try {
      setIsLoading(true);
      const result = await getAllSchools();
      if (result.error) {
        toast.error(result.error);
      } else {
        setSchools(result.data || []);
      }
    } catch (error) {
      toast.error(t("admin.superAdmin.failedToLoadSchools"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSchool = async (data: any) => {
    setIsCreatingSchool(true);
    const result = await createSchool(data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("admin.superAdmin.schoolCreatedSuccess"));
      setShowSchoolDialog(false);
      loadSchools();
    }
    setIsCreatingSchool(false);
  };

  const handleUpdateSchool = async (data: any) => {
    if (!editingSchool) return;
    setIsUpdatingSchool(true);
    const result = await updateSchool(editingSchool.id, data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("admin.superAdmin.schoolUpdatedSuccess"));
      setShowEditSchoolDialog(false);
      setEditingSchool(null);
      loadSchools();
    }
    setIsUpdatingSchool(false);
  };

  const handleDeleteSchool = async (hardDelete: boolean = false) => {
    if (!deletingSchool) return;
    setIsDeletingSchool(true);
    const result = await deleteSchool(deletingSchool.id, hardDelete);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        hardDelete
          ? t("admin.superAdmin.schoolDeletedSuccess")
          : t("admin.superAdmin.schoolDeactivatedSuccess")
      );
      setDeletingSchool(null);
      loadSchools();
    }
    setIsDeletingSchool(false);
  };

  const loadSchoolAdmins = async (schoolId: string) => {
    try {
      const result = await getSchoolAdmins(schoolId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setSchoolAdmins((prev) => ({
          ...prev,
          [schoolId]: result.data || [],
        }));
      }
    } catch (error) {
      toast.error("Failed to load admins");
    }
  };

  const toggleSchoolExpansion = (schoolId: string) => {
    setExpandedSchools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(schoolId)) {
        newSet.delete(schoolId);
      } else {
        newSet.add(schoolId);
        if (!schoolAdmins[schoolId]) {
          loadSchoolAdmins(schoolId);
        }
      }
      return newSet;
    });
  };

  const handleUpdateAdmin = async (data: any) => {
    if (!editingAdmin) return;
    setIsUpdatingAdmin(true);
    const result = await updateSchoolAdmin(editingAdmin.id, data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("admin.superAdmin.adminUpdatedSuccess"));
      setShowEditAdminDialog(false);
      setEditingAdmin(null);
      if (editingAdmin.school_id) {
        loadSchoolAdmins(editingAdmin.school_id);
      }
    }
    setIsUpdatingAdmin(false);
  };

  const handleDeleteAdmin = async (hardDelete: boolean = false) => {
    if (!deletingAdmin) return;
    setIsDeletingAdmin(true);
    const schoolId = deletingAdmin.school_id;
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
      if (schoolId) {
        loadSchoolAdmins(schoolId);
      }
      loadSchools(); // Refresh school stats
    }
    setIsDeletingAdmin(false);
  };

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSchool) return;

    setIsCreatingAdmin(true);
    const formData = new FormData(e.currentTarget);
    const result = await createSchoolAdmin({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string || undefined,
      password: formData.get("password") as string || undefined,
      school_id: selectedSchool,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("admin.superAdmin.adminCreatedSuccess"));
      setShowAdminDialog(false);
      e.currentTarget.reset();
      if (selectedSchool) {
        loadSchoolAdmins(selectedSchool);
      }
      setSelectedSchool(null);
      loadSchools(); // Refresh school stats
    }
    setIsCreatingAdmin(false);
  };

  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.contact_email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && school.is_active) ||
        (statusFilter === "inactive" && !school.is_active);

      // Subscription filter
      const matchesSubscription =
        subscriptionFilter === "all" ||
        school.subscription_status === subscriptionFilter;

      // Date range filter
      let matchesDateRange = true;
      if (dateFromFilter || dateToFilter) {
        const schoolDate = new Date(school.created_at);
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter);
          fromDate.setHours(0, 0, 0, 0);
          if (schoolDate < fromDate) matchesDateRange = false;
        }
        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          toDate.setHours(23, 59, 59, 999);
          if (schoolDate > toDate) matchesDateRange = false;
        }
      }

      return matchesSearch && matchesStatus && matchesSubscription && matchesDateRange;
    });
  }, [schools, searchQuery, statusFilter, subscriptionFilter, dateFromFilter, dateToFilter]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-2xl">{t("admin.superAdmin.schoolsManagement")}</CardTitle>
            <CardDescription>
              {t("admin.superAdmin.manageAllSchools")} ({schools.length} {t("admin.superAdmin.total")})
            </CardDescription>
          </div>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => setShowSchoolDialog(true)}
          >
            <Plus className="h-4 w-4" />
            {t("admin.superAdmin.createNewSchool")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Advanced Filters */}
        <div className="mb-6 space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <h3 className="font-semibold">{t("admin.superAdmin.filters")}</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="search">{t("admin.superAdmin.search")}</Label>
              <Input
                id="search"
                placeholder={t("admin.superAdmin.searchSchools")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
              <Label htmlFor="subscription-filter">{t("admin.superAdmin.subscriptionStatus")}</Label>
              <Select
                value={subscriptionFilter}
                onValueChange={setSubscriptionFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="active">{t("admin.superAdmin.active")}</SelectItem>
                  <SelectItem value="trial">{t("admin.superAdmin.trial")}</SelectItem>
                  <SelectItem value="expired">{t("admin.superAdmin.expired")}</SelectItem>
                  <SelectItem value="canceled">{t("admin.superAdmin.canceled")}</SelectItem>
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
          {(searchQuery || statusFilter !== "all" || subscriptionFilter !== "all" || dateFromFilter || dateToFilter) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSubscriptionFilter("all");
                  setDateFromFilter("");
                  setDateToFilter("");
                }}
              >
                {t("admin.superAdmin.clearFilters")}
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="text-center py-12">
            <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? t("admin.superAdmin.noSchoolsMatching") : t("admin.superAdmin.noSchoolsFound")}
            </p>
            {!searchQuery && (
              <Button
                className="mt-4"
                onClick={() => setShowSchoolDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.superAdmin.createFirstSchool")}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSchools.map((school) => (
              <Card key={school.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <School className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          <Link
                            href={`/admin/super-admin/schools/${school.id}`}
                            className="hover:underline"
                          >
                            {school.name}
                          </Link>
                        </CardTitle>
                      </div>
                      {school.name_ar && (
                        <p className="text-sm text-muted-foreground mb-2">{school.name_ar}</p>
                      )}
                      <Badge variant={school.is_active ? "default" : "secondary"} className="text-xs">
                        {school.is_active ? t("admin.superAdmin.active") : t("admin.superAdmin.inactive")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* School Stats */}
                  {school.stats && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("admin.superAdmin.admins")}:</span>
                        <span className="font-semibold">{school.stats.admins}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("admin.superAdmin.students")}:</span>
                        <span className="font-semibold">{school.stats.students}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("admin.superAdmin.teachers")}:</span>
                        <span className="font-semibold">{school.stats.teachers}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("admin.superAdmin.classes")}:</span>
                        <span className="font-semibold">{school.stats.classes}</span>
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-muted-foreground border-t pt-3">
                    {school.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{school.contact_email}</span>
                      </div>
                    )}
                    {school.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{school.contact_phone}</span>
                      </div>
                    )}
                    {school.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{school.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{t("admin.superAdmin.created")} {formatDistanceToNow(new Date(school.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedSchool(school.id);
                        setShowAdminDialog(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t("admin.superAdmin.addAdmin")}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingSchool(school);
                            setShowEditSchoolDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t("admin.superAdmin.editSchool")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {school.is_active ? (
                          <DropdownMenuItem
                            onClick={() => setDeletingSchool(school)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("admin.superAdmin.deactivateSchool")}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={async () => {
                              const result = await updateSchool(school.id, { is_active: true });
                              if (result.error) {
                                toast.error(result.error);
                              } else {
                                toast.success(t("admin.superAdmin.schoolActivatedSuccess"));
                                loadSchools();
                              }
                            }}
                          >
                            {t("admin.superAdmin.activateSchool")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Admins List - Expandable */}
                  <div className="pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => toggleSchoolExpansion(school.id)}
                    >
                      <span className="text-sm">
                        {t("admin.superAdmin.admins")} ({school.stats?.admins || 0})
                      </span>
                      {expandedSchools.has(school.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    {expandedSchools.has(school.id) && (
                      <div className="mt-2 space-y-2">
                        {schoolAdmins[school.id] ? (
                          schoolAdmins[school.id].length > 0 ? (
                            schoolAdmins[school.id].map((admin) => (
                              <div
                                key={admin.id}
                                className="flex items-center justify-between p-2 rounded-lg border bg-card"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{admin.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                                  {!admin.is_active && (
                                    <Badge variant="secondary" className="text-xs mt-1">
                                      {t("admin.superAdmin.inactive")}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingAdmin(admin);
                                      setShowEditAdminDialog(true);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletingAdmin(admin)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              {t("admin.superAdmin.noAdmins")}
                            </p>
                          )
                        ) : (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create School Dialog */}
        <SchoolFormDialog
          open={showSchoolDialog}
          onOpenChange={setShowSchoolDialog}
          onSubmit={handleCreateSchool}
          isLoading={isCreatingSchool}
          mode="create"
        />

        {/* Edit School Dialog */}
        <SchoolFormDialog
          open={showEditSchoolDialog}
          onOpenChange={(open) => {
            setShowEditSchoolDialog(open);
            if (!open) setEditingSchool(null);
          }}
          onSubmit={handleUpdateSchool}
          initialData={editingSchool || undefined}
          isLoading={isUpdatingSchool}
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
              <AlertDialogCancel disabled={isDeletingSchool}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteSchool(false)}
                disabled={isDeletingSchool}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingSchool && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("admin.superAdmin.deactivateSchool")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Admin Dialog */}
        <Dialog open={showAdminDialog && !!selectedSchool} onOpenChange={(open) => {
          setShowAdminDialog(open);
          if (!open) setSelectedSchool(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("admin.superAdmin.createAdminFor")}{" "}
                {schools.find((s) => s.id === selectedSchool)?.name || ""}
              </DialogTitle>
              <DialogDescription>{t("admin.superAdmin.createAdminUser")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <Label htmlFor="admin_name">{t("admin.superAdmin.name")} *</Label>
                <Input id="admin_name" name="name" required />
              </div>
              <div>
                <Label htmlFor="admin_email">{t("admin.superAdmin.email")} *</Label>
                <Input id="admin_email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="admin_phone">{t("admin.superAdmin.phone")}</Label>
                <Input id="admin_phone" name="phone" />
              </div>
              <div>
                <Label htmlFor="admin_password">{t("admin.superAdmin.passwordAutoGenerated")}</Label>
                <Input id="admin_password" name="password" type="password" />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAdminDialog(false);
                    setSelectedSchool(null);
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={isCreatingAdmin}>
                  {isCreatingAdmin && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("admin.superAdmin.createAdmin")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Admin Dialog */}
        <Dialog open={showEditAdminDialog && !!editingAdmin} onOpenChange={(open) => {
          setShowEditAdminDialog(open);
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
                await handleUpdateAdmin({
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
                    setShowEditAdminDialog(false);
                    setEditingAdmin(null);
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={isUpdatingAdmin}>
                  {isUpdatingAdmin && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
              <AlertDialogCancel disabled={isDeletingAdmin}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteAdmin(false)}
                disabled={isDeletingAdmin}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingAdmin && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("admin.superAdmin.deactivateAdmin")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

