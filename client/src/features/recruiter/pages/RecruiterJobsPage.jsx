import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGetMyJobsQuery, useDeleteJobMutation } from "@/features/jobs/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  Briefcase,
  PlusCircle,
  Users,
  Edit,
  Trash2,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function RecruiterJobsPage() {
  const { toast } = useToast();
  const { data: jobs, isLoading, error, refetch } = useGetMyJobsQuery();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteJob(deleteTarget._id).unwrap();
      toast({
        title: "Job Updated",
        description: "Job was deleted or archived successfully.",
        variant: "success",
      });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast({
        title: "Action failed",
        description: err.data?.message || "Failed to remove or archive job.",
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
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Manage Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of all your organization's open, draft, and archived job listings.
          </p>
        </div>

        <Link to="/recruiter/jobs/new">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            <span>Post a Job</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 border border-destructive/30 rounded-xl bg-destructive/5 text-center">
          <p className="text-destructive font-medium mb-3">Failed to load your jobs.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs published yet"
          description="Create your first job posting to start attracting applicants and leveraging AI matching."
          actionLabel="Post First Job"
          onAction={() => {
            window.location.href = "/recruiter/jobs/new";
          }}
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job._id} className="p-5 sm:p-6 transition-all hover:shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="font-bold text-lg text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <span>{job.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </Link>
                    {getStatusBadge(job.status)}
                    {job.isAiGeneratedDescription && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        AI Drafted
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{job.category?.name || "General"}</span>
                    <span>•</span>
                    <span className="capitalize">{job.employmentType?.replace("_", " ")}</span>
                    <span>•</span>
                    <span className="capitalize">{job.workMode}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Created {formatDate(job.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:self-center">
                  <Link to={`/recruiter/jobs/${job._id}/applicants`}>
                    <Button variant="secondary" size="sm" className="gap-1.5">
                      <Users className="w-4 h-4 text-primary" />
                      <span>Applicants ({job.applicationsCount || 0})</span>
                    </Button>
                  </Link>

                  <Link to={`/recruiter/jobs/${job._id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(job)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete or Archive Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Delete / Archive */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete or Archive Job"
        description={`Are you sure you want to remove "${deleteTarget?.title}"? If this job has received applications, it will be safely archived instead of removed.`}
        confirmText="Confirm"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

