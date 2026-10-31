import React, { useState } from "react";
import { useGetUsersQuery, useUpdateUserMutation, useDeleteUserMutation } from "@/features/users/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Users, Edit, UserX, ShieldAlert, ChevronLeft, ChevronRight, CheckCircle, Ban } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

export function AdminUsersPage() {
  const { toast } = useToast();
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, error, refetch } = useGetUsersQuery({
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    page,
    limit,
  });

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // Edit User State
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("applicant");
  const [editStatus, setEditStatus] = useState("active");

  // Deactivate Target
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const usersList = data?.items || [];
  const totalPages = data?.pages || 1;
  const totalUsers = data?.total || 0;

  const handleOpenEdit = (user) => {
    setEditTarget(user);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditRole(user.role || "applicant");
    setEditStatus(user.status || "active");
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    try {
      await updateUser({
        id: editTarget._id,
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        status: editStatus,
      }).unwrap();
      toast({
        title: "User Updated",
        description: `Account for ${editName} was updated successfully.`,
        variant: "success",
      });
      setEditTarget(null);
      refetch();
    } catch (err) {
      toast({
        title: "Update Failed",
        description: err.data?.message || "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deleteUser(deactivateTarget._id).unwrap();
      toast({
        title: "Account Deactivated",
        description: `User ${deactivateTarget.name} has been deactivated.`,
      });
      setDeactivateTarget(null);
      refetch();
    } catch (err) {
      toast({
        title: "Deactivation Failed",
        description: err.data?.message || "Failed to deactivate account.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <Badge variant="purple">Admin</Badge>;
      case "recruiter":
        return <Badge variant="info">Recruiter</Badge>;
      default:
        return <Badge variant="secondary">Applicant</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "suspended":
        return <Badge variant="warning">Suspended</Badge>;
      case "deleted":
        return <Badge variant="destructive">Deleted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-purple-600" />
            <span>User Management</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit, update roles, manage statuses, and deactivate platform users.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            Filter by Role
          </label>
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            <option value="applicant">Applicant</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            Filter by Status
          </label>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            variant="outline"
            className="w-full text-xs"
            onClick={() => {
              setRoleFilter("");
              setStatusFilter("");
              setPage(1);
            }}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">
              Failed to load users.
            </div>
          ) : usersList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description="No users matched your current filter selection."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersList.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                            {getInitials(u.name)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-foreground text-sm">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>{getStatusBadge(u.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="h-8 px-2 text-xs"
                          title="Edit User"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        {u.status !== "deleted" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeactivateTarget(u)}
                            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                            title="Deactivate Account"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Edit User Modal */}
      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)}>
        <div className="relative">
          <DialogClose onClick={() => setEditTarget(null)} />
          <DialogHeader>
            <DialogTitle>Edit User Account</DialogTitle>
            <DialogDescription>
              Modify role, status, and account properties for this user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Full Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Email Address</label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">User Role</label>
                <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  <option value="applicant">Applicant</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Account Status</label>
                <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deleted">Deleted</option>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                disabled={isUpdating}
                onClick={() => setEditTarget(null)}
              >
                Cancel
              </Button>
              <Button isLoading={isUpdating} onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        </div>
      </Dialog>

      {/* Confirm Deactivation */}
      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Deactivate User Account"
        description={`Are you sure you want to deactivate ${deactivateTarget?.name}'s account? This will mark the account deleted and revoke login access.`}
        confirmText="Deactivate"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}

