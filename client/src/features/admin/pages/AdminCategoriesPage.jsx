import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema } from "@/features/categories/schemas";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/features/categories/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { FolderTree, Plus, Edit, Trash2, Power, AlertCircle } from "lucide-react";

export function AdminCategoriesPage() {
  const { toast } = useToast();
  const { data: categories = [], isLoading, error, refetch } = useGetCategoriesQuery({
    includeInactive: true,
  });

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true,
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset({
      name: "",
      slug: "",
      description: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    reset({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      isActive: cat.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (cat) => {
    try {
      await updateCategory({
        id: cat._id,
        isActive: !cat.isActive,
      }).unwrap();
      toast({
        title: cat.isActive ? "Category Deactivated" : "Category Activated",
        description: `"${cat.name}" status changed.`,
        variant: "success",
      });
      refetch();
    } catch (err) {
      toast({
        title: "Status change failed",
        description: err.data?.message || "Could not update category status.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug?.trim() || undefined,
        description: values.description?.trim() || undefined,
        isActive: values.isActive,
      };

      if (editingCategory) {
        await updateCategory({ id: editingCategory._id, ...payload }).unwrap();
        toast({
          title: "Category Updated",
          description: `"${values.name}" updated successfully.`,
          variant: "success",
        });
      } else {
        await createCategory(payload).unwrap();
        toast({
          title: "Category Created",
          description: `"${values.name}" added successfully.`,
          variant: "success",
        });
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      if (err.data?.errors && Array.isArray(err.data.errors)) {
        err.data.errors.forEach((validationErr) => {
          if (validationErr.field) {
            setError(validationErr.field, { message: validationErr.message });
          }
        });
      }
      toast({
        title: "Save Failed",
        description: err.data?.message || "Failed to save category.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget._id).unwrap();
      toast({
        title: "Category Removed",
        description: `Category "${deleteTarget.name}" was deleted.`,
        variant: "success",
      });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      if (err.status === 409) {
        toast({
          title: "Cannot Delete Category (409 Conflict)",
          description:
            "Active or archived jobs reference this category. Deactivate it instead to hide it from new job postings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Delete Failed",
          description: err.data?.message || "Failed to delete category.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <FolderTree className="w-8 h-8 text-purple-600" />
            <span>Job Categories</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage industry classifications, view job counts, and control active status.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">
              Failed to load categories.
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title="No categories"
              description="Create your first job category to organize listings."
              actionLabel="Create Category"
              onAction={handleOpenCreate}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Active Jobs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat._id}>
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm">{cat.name}</div>
                      {cat.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-md">
                          {cat.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {cat.slug || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {cat.publishedJobsCount || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cat.isActive ? "success" : "secondary"}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(cat)}
                          className="h-8 px-2 text-xs"
                          title={cat.isActive ? "Deactivate Category" : "Activate Category"}
                        >
                          <Power
                            className={`w-3.5 h-3.5 ${
                              cat.isActive ? "text-amber-500" : "text-emerald-500"
                            }`}
                          />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(cat)}
                          className="h-8 px-2 text-xs"
                          title="Edit Category"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(cat)}
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Category Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <div className="relative">
          <DialogClose onClick={() => setModalOpen(false)} />
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update category taxonomy or deactivate it."
                : "Add a new job classification to the marketplace."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="catName">
                Category Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="catName"
                placeholder="e.g. Software Development"
                error={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="catSlug">
                URL Slug (Optional - auto-generated if blank)
              </label>
              <Input
                id="catSlug"
                placeholder="e.g. software-development"
                error={Boolean(errors.slug)}
                {...register("slug")}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="catDesc">
                Description (Max 500 characters)
              </label>
              <Textarea
                id="catDesc"
                rows={3}
                placeholder="Brief description of this domain..."
                error={Boolean(errors.description)}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-xs font-medium text-foreground">
                  Active (Allows employers to publish jobs under this category)
                </span>
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isCreating || isUpdating}
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isCreating || isUpdating}>
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Job Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Note: If any existing jobs reference this category, the deletion will be rejected (409 Conflict) and you should deactivate it instead.`}
        confirmText="Attempt Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

