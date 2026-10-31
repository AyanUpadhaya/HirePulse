import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/auth/authSlice";
import { useGetMyJobsQuery } from "@/features/jobs/api";
import { useGetMyProfileQuery } from "@/features/profiles/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Briefcase,
  Users,
  Building,
  PlusCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function RecruiterDashboardPage() {
  const user = useSelector(selectCurrentUser);
  const { data: jobs, isLoading: isJobsLoading } = useGetMyJobsQuery();
  const { data: profile } = useGetMyProfileQuery();

  const jobsList = jobs || [];
  const totalJobs = jobsList.length;
  const publishedJobs = jobsList.filter((j) => j.status === "published").length;
  const totalApplicants = jobsList.reduce((acc, j) => acc + (j.applicationsCount || 0), 0);

  const hasCompany = Boolean(profile?.company);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recruiter Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {user?.name || "Recruiter"}! 💼
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your hiring pipeline, post open roles, and review candidates.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/recruiter/jobs/new">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <PlusCircle className="w-4 h-4" />
              <span>Post New Job</span>
            </Button>
          </Link>
          <Link to="/recruiter/company">
            <Button variant="outline" className="gap-2">
              <Building className="w-4 h-4" />
              <span>Company Profile</span>
            </Button>
          </Link>
        </div>
      </div>

      {!hasCompany && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4">
          <div className="text-sm">
            <strong>Organization Profile Incomplete:</strong> Please set up your company details so applicants can learn about your culture and mission.
          </div>
          <Link to="/recruiter/company">
            <Button size="sm" variant="outline" className="bg-white dark:bg-transparent shrink-0">
              Set Up Company
            </Button>
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Positions</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all statuses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Published Jobs</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{publishedJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">Accepting applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applicants</CardTitle>
            <Users className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{totalApplicants}</div>
            <p className="text-xs text-muted-foreground mt-1">Applications received to date</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <span>Recent Job Postings</span>
          </h2>
          <Link
            to="/recruiter/jobs"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isJobsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : jobsList.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground text-sm mb-4">
              You haven't posted any jobs yet.
            </p>
            <Link to="/recruiter/jobs/new">
              <Button size="sm">Post Your First Job</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobsList.slice(0, 5).map((job) => (
              <Card key={job._id} className="p-4 sm:p-5 hover:shadow-sm transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/recruiter/jobs/${job._id}/applicants`}
                        className="font-bold text-base text-foreground hover:text-primary transition-colors"
                      >
                        {job.title}
                      </Link>
                      <Badge variant={job.status === "published" ? "success" : "secondary"}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{job.category?.name || "General"}</span>
                      <span>•</span>
                      <span>Created {formatDate(job.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/recruiter/jobs/${job._id}/applicants`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>Applicants ({job.applicationsCount || 0})</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

