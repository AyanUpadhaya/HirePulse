import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGetJobsQuery, useDeleteJobMutation } from "@/features/jobs/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Briefcase, Edit, Trash2, ExternalLink, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function AdminJobsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("published");
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, error, refetch } = useGetJobsQuery({
    status: statusFilter,
    page,
    limit,
  });

  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const jobsList = data?.items || [];
  const totalPages = data?.pages || 1;
  const total = data?.total || 0;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteJob(deleteTarget._id).unwrap();
      toast({
        title: "Job Updated",
        description: `"${deleteTarget.title}" was archived or deleted.`,
        variant: "success",
      });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast({
        title: "Action failed",
        description: err.data?.message || "Failed to remove job.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "paused":
        return <Badge variant="warning">Paused</Badge>;
      case "closed":
        return <Badge variant="destructive">Closed</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-purple-600" />
            <span>Job Listings Oversight</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor, inspect, edit, or archive all marketplace jobs across statuses.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm flex items-center gap-4 max-w-sm">
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          Filter by Status:
        </label>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

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
              Failed to load jobs.
            </div>
          ) : jobsList.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={`No ${statusFilter} jobs`}
              description={`There are currently no jobs with status "${statusFilter}".`}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsList.map((job) => (
                  <TableRow key={job._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="font-semibold text-foreground text-sm hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <span>{job.title}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </Link>
                        {job.isAiGeneratedDescription && (
                          <Badge variant="secondary" className="gap-0.5 text-[10px] py-0 px-1.5">
                            <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                            AI
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {job.company?.name || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {job.category?.name || "General"}
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(job.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/recruiter/jobs/${job._id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" title="Edit Job">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(job)}
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                          title="Archive or Delete"
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

      {/* Delete/Archive Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Archive or Delete Job"
        description={`Are you sure you want to remove or archive "${deleteTarget?.title}"?`}
        confirmText="Confirm"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

