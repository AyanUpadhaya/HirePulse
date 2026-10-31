import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGetMyApplicationsQuery, useWithdrawApplicationMutation } from "../api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Ban,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function ApplicantApplicationsPage() {
  const { toast } = useToast();
  const { data: applications, isLoading, error, refetch } = useGetMyApplicationsQuery();
  const [withdrawApp, { isLoading: isWithdrawing }] = useWithdrawApplicationMutation();

  const [withdrawTarget, setWithdrawTarget] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case "submitted":
        return <Badge variant="secondary">Submitted</Badge>;
      case "reviewing":
        return <Badge variant="info">In Review</Badge>;
      case "shortlisted":
        return <Badge variant="purple">Shortlisted</Badge>;
      case "interviewing":
        return <Badge variant="info">Interviewing</Badge>;
      case "offered":
        return <Badge variant="success">Offer Extended</Badge>;
      case "hired":
        return <Badge variant="success">Hired 🎉</Badge>;
      case "rejected":
        return <Badge variant="destructive">Declined</Badge>;
      case "withdrawn":
        return <Badge variant="outline">Withdrawn</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const canWithdraw = (status) => {
    return !["withdrawn", "hired", "rejected"].includes(status);
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawTarget) return;
    try {
      await withdrawApp(withdrawTarget._id).unwrap();
      toast({
        title: "Application Withdrawn",
        description: "Your application has been withdrawn.",
      });
      setWithdrawTarget(null);
      refetch();
    } catch (err) {
      toast({
        title: "Could not withdraw",
        description: err.data?.message || "Failed to withdraw application.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          My Applications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track the status and timeline of all your submitted job applications.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 border border-destructive/30 rounded-xl bg-destructive/5 text-center">
          <p className="text-destructive font-medium mb-3">Failed to load applications.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : !applications || applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="You haven't submitted any job applications yet. Browse published jobs to start your journey."
          actionLabel="Find Jobs"
          onAction={() => {
            window.location.href = "/jobs";
          }}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const job = app.job || {};
            const company = app.company || job.company || {};
            const isEligibleForWithdraw = canWithdraw(app.status);

            return (
              <Card key={app._id} className="p-5 sm:p-6 transition-all hover:shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        to={`/jobs/${job._id || ""}`}
                        className="font-bold text-lg text-foreground hover:text-primary transition-colors"
                      >
                        {job.title || "Job Title Unavailable"}
                      </Link>
                      {getStatusBadge(app.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {company.name || "Company"}
                      </span>

                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Applied on {formatDate(app.createdAt)}
                      </span>
                    </div>

                    {app.coverLetter && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2 bg-muted/40 p-2.5 rounded-lg border">
                        <strong className="text-foreground">Cover letter:</strong> {app.coverLetter}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:self-center">
                    {job._id && (
                      <Link to={`/jobs/${job._id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          View Job
                        </Button>
                      </Link>
                    )}

                    {isEligibleForWithdraw && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWithdrawTarget(app)}
                        className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Ban className="w-3.5 h-3.5 mr-1" />
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Destructive Action (Withdraw) */}
      <ConfirmDialog
        open={Boolean(withdrawTarget)}
        onOpenChange={(open) => !open && setWithdrawTarget(null)}
        title="Withdraw Application"
        description={`Are you sure you want to withdraw your application for "${withdrawTarget?.job?.title || "this position"}"? Once withdrawn, this application cannot be reinstated.`}
        confirmText="Confirm Withdrawal"
        variant="destructive"
        isLoading={isWithdrawing}
        onConfirm={handleConfirmWithdraw}
      />
    </div>
  );
}

