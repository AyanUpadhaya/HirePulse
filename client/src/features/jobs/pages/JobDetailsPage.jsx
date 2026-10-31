import React, { useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated } from "@/features/auth/authSlice";
import { useGetJobByIdQuery } from "../api";
import { useGetMyProfileQuery } from "@/features/profiles/api";
import { ApplyModal } from "@/features/applications/components/ApplyModal";
import { JobMatchInsightsModal } from "@/features/ai/components/JobMatchInsightsModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Sparkles,
  ArrowLeft,
  Users,
  Award,
  Globe,
  Share2,
  CheckCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

export function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const { data: job, isLoading, error, refetch } = useGetJobByIdQuery(jobId);
  const { data: profile } = useGetMyProfileQuery(undefined, {
    skip: !isAuthenticated || user?.role !== "applicant",
  });

  const isApplicant = user?.role === "applicant";
  const isOwnerOrAdmin =
    user?.role === "admin" || (user?.role === "recruiter" && job?.createdBy === user?._id);

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    if (isApplicant) {
      setApplyModalOpen(true);
    }
  };

  const handleAiInsightsClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setAiModalOpen(true);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Job posting link copied to your clipboard.",
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-5xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="p-8 rounded-2xl border bg-card space-y-4">
          <div className="flex gap-4 items-center">
            <Skeleton className="w-16 h-16 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container py-16 text-center max-w-md">
        <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
        <p className="text-muted-foreground text-sm mb-6">
          The job listing you are looking for may have been closed, archived, or does not exist.
        </p>
        <Link to="/jobs">
          <Button variant="default">Back to All Jobs</Button>
        </Link>
      </div>
    );
  }

  const company = job.company;
  const isExpired = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();
  const isPublished = job.status === "published";

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </Link>
      </div>

      {/* Main Job Banner */}
      <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            {company?.logo ? (
              <img
                src={company.logo}
                alt={company.name}
                className="w-16 h-16 rounded-xl object-contain border bg-white p-1.5 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                <Building2 className="w-8 h-8" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {job.title}
                </h1>
                {job.status !== "published" && (
                  <Badge variant="warning" className="capitalize">
                    {job.status}
                  </Badge>
                )}
                {job.isAiGeneratedDescription && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    AI Assisted
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                {company?._id ? (
                  <Link
                    to={`/companies/${company._id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {company.name}
                  </Link>
                ) : (
                  <span>{company?.name || "Private Employer"}</span>
                )}

                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Posted {formatDate(job.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 sm:self-start">
            <Button variant="outline" size="icon" onClick={handleShare} title="Share job">
              <Share2 className="w-4 h-4" />
            </Button>

            {isOwnerOrAdmin ? (
              <Link to={`/recruiter/jobs/${job._id}/applicants`}>
                <Button variant="secondary" className="gap-2">
                  <Users className="w-4 h-4" />
                  View Applicants
                </Button>
              </Link>
            ) : isApplicant ? (
              <div className="flex flex-wrap gap-2">
                {/* AI Match Insights Button */}
                {isPublished && !isExpired && (
                  <Button
                    variant="outline"
                    onClick={handleAiInsightsClick}
                    className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Get AI Match Insights</span>
                  </Button>
                )}

                <Button
                  onClick={handleApplyClick}
                  disabled={!isPublished || isExpired}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isExpired ? "Application Closed" : "Apply Now"}
                </Button>
              </div>
            ) : !isAuthenticated ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleAiInsightsClick}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Match Insights
                </Button>
                <Button onClick={handleApplyClick}>Apply Now</Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground self-center">
                Signed in as {user.role}
              </p>
            )}
          </div>
        </div>

        {/* Highlight Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t text-sm">
          <div>
            <span className="text-xs text-muted-foreground block">Employment Type</span>
            <span className="font-semibold capitalize text-foreground">
              {job.employmentType?.replace("_", " ")}
            </span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block">Work Mode</span>
            <span className="font-semibold capitalize text-foreground">
              {job.workMode}
            </span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block">Experience</span>
            <span className="font-semibold text-foreground">
              {job.minExperienceYears ? `${job.minExperienceYears}+ years` : "Entry level"}
            </span>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block">Offered Salary</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {job.salaryMin && job.salaryMax
                ? `${formatCurrency(job.salaryMin, job.currency)} - ${formatCurrency(job.salaryMax, job.currency)}`
                : job.salaryMin
                ? `From ${formatCurrency(job.salaryMin, job.currency)}`
                : job.salaryMax
                ? `Up to ${formatCurrency(job.salaryMax, job.currency)}`
                : "Not disclosed"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Description & Skills */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-foreground/90 leading-relaxed">
                {job.description}
              </div>
            </CardContent>
          </Card>

          {/* Required Skills */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Skills & Technologies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Col: Details & Company Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Category</span>
                <span className="font-semibold text-foreground">{job.category?.name || "General"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Vacancies</span>
                <span className="font-semibold text-foreground">{job.vacancies || 1}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Application Deadline</span>
                <span className={`font-semibold ${isExpired ? "text-destructive" : "text-foreground"}`}>
                  {job.applicationDeadline ? formatDate(job.applicationDeadline) : "Open until filled"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={job.status === "published" ? "success" : "secondary"}>
                  {job.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Company Card */}
          {company && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About {company.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {company.description && (
                  <p className="text-muted-foreground line-clamp-4 leading-relaxed">
                    {company.description}
                  </p>
                )}
                {company.industry && (
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Industry</span>
                    <span className="font-semibold text-foreground">{company.industry}</span>
                  </div>
                )}
                {company.companySize && (
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Company Size</span>
                    <span className="font-semibold text-foreground">{company.companySize} employees</span>
                  </div>
                )}
                {company.headquarters && (
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Headquarters</span>
                    <span className="font-semibold text-foreground">{company.headquarters}</span>
                  </div>
                )}
                {company.website && (
                  <div className="pt-2">
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Visit Company Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      {isApplicant && (
        <ApplyModal
          open={applyModalOpen}
          onOpenChange={setApplyModalOpen}
          job={job}
          profileResumeUrl={profile?.resume}
        />
      )}

      <JobMatchInsightsModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        jobId={job._id}
        jobTitle={job.title}
      />
    </div>
  );
}

