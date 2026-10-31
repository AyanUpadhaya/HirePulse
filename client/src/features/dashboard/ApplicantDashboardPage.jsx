import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/auth/authSlice";
import { useGetMyProfileQuery } from "@/features/profiles/api";
import { useGetMyApplicationsQuery } from "@/features/applications/api";
import { useGenerateJobRecommendationsMutation } from "@/features/recommendations/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  User,
  Briefcase,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function ApplicantDashboardPage() {
  const user = useSelector(selectCurrentUser);
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfileQuery();
  const { data: applications, isLoading: isAppsLoading } = useGetMyApplicationsQuery();

  const completion = profile?.profileCompletion ?? 20;
  const recentApps = (applications || []).slice(0, 3);

  const getMissingSections = () => {
    if (!profile) return ["Add skills", "Upload resume", "Add work experience"];
    const missing = [];
    if (!profile.skills || profile.skills.length === 0) missing.push("Add technical skills");
    if (!profile.resume) missing.push("Upload your PDF resume");
    if (!profile.experience || profile.experience.length === 0) missing.push("Add work experience");
    if (!profile.education || profile.education.length === 0) missing.push("Add education history");
    if (!profile.headline) missing.push("Add a professional headline");
    return missing;
  };

  const missingList = getMissingSections();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Applicant Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {user?.name || "Job Seeker"}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here is what is happening with your job applications and profile visibility.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/jobs">
            <Button className="gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Explore Jobs</span>
            </Button>
          </Link>
          <Link to="/applicant/profile">
            <Button variant="outline" className="gap-2">
              <User className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Profile Completion & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Completion Card */}
        <Card className="md:col-span-2 border-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Strength
              </CardTitle>
              <span className="font-bold text-lg text-primary">{completion}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>

            {missingList.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Complete these sections to improve AI matching accuracy:
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingList.map((item, idx) => (
                    <Link key={idx} to="/applicant/profile">
                      <Badge
                        variant="secondary"
                        className="text-xs py-1 px-2.5 gap-1.5 hover:bg-muted cursor-pointer"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>{item}</span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your profile is 100% complete! Employers can easily discover you.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <Card className="border-muted flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Applications Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm text-muted-foreground">Total Applications</span>
              <span className="text-2xl font-bold text-foreground">
                {applications?.length || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm text-muted-foreground">In Review / Active</span>
              <span className="text-2xl font-bold text-indigo-600">
                {(applications || []).filter(
                  (a) => !["withdrawn", "rejected", "hired"].includes(a.status)
                ).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Recent Applications</span>
          </h2>
          <Link
            to="/applicant/applications"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isAppsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : recentApps.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground text-sm mb-4">
              You haven't submitted any applications yet.
            </p>
            <Link to="/jobs">
              <Button size="sm">Search Jobs</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentApps.map((app) => (
              <Card key={app._id} className="p-4 sm:p-5 hover:shadow-sm transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/jobs/${app.job?._id || ""}`}
                        className="font-semibold text-base text-foreground hover:text-primary transition-colors"
                      >
                        {app.job?.title || "Job Position"}
                      </Link>
                      <Badge variant="outline" className="text-xs capitalize">
                        {app.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{app.company?.name || app.job?.company?.name || "Company"}</span>
                      <span>•</span>
                      <span>Applied {formatDate(app.createdAt)}</span>
                    </div>
                  </div>

                  <Link to="/applicant/applications">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View Status Timeline →
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recommendation Banner */}
      <Card className="bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-background dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-background border-indigo-200/50 dark:border-indigo-900/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              AI Matched Positions Available
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              We calculate match scores against your skills, experiences, and preferred locations. Check your recommendation feed.
            </p>
          </div>
          <Link to="/applicant/recommendations">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
              View Recommendations →
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

