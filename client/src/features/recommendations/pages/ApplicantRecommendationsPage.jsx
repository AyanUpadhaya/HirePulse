import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGenerateJobRecommendationsMutation, useUpdateRecommendationMutation } from "../api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  Sparkles,
  RefreshCw,
  Building2,
  MapPin,
  DollarSign,
  X,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ApplicantRecommendationsPage() {
  const { toast } = useToast();
  const [generateRecommendations, { data: recommendationsData, isLoading, error }] =
    useGenerateJobRecommendationsMutation();
  const [updateRec] = useUpdateRecommendationMutation();

  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Generate initial recommendations on mount
    generateRecommendations();
  }, [generateRecommendations]);

  useEffect(() => {
    if (recommendationsData) {
      setRecommendations(recommendationsData.filter((r) => !r.isDismissed));
    }
  }, [recommendationsData]);

  const handleRefresh = async () => {
    try {
      const result = await generateRecommendations().unwrap();
      setRecommendations(result.filter((r) => !r.isDismissed));
      toast({
        title: "Matches refreshed!",
        description: `Found ${result.length} recommended positions.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not refresh",
        description: "Failed to recalculate job recommendations.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = async (id) => {
    try {
      await updateRec({ id, isDismissed: true }).unwrap();
      setRecommendations((prev) => prev.filter((r) => r._id !== id));
      toast({
        title: "Recommendation dismissed",
        description: "This job won't appear in your recommendation feed.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to dismiss recommendation.",
        variant: "destructive",
      });
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return <Badge variant="success">{score}% Match</Badge>;
    if (score >= 60) return <Badge variant="info">{score}% Match</Badge>;
    return <Badge variant="secondary">{score}% Match</Badge>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-indigo-600" />
            <span>AI Job Recommendations</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tailored roles matched against your skills, experience, location, and salary preferences.
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          isLoading={isLoading}
          variant="outline"
          className="gap-2 shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Matches</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 border border-destructive/30 rounded-xl bg-destructive/5 text-center">
          <p className="text-destructive font-medium mb-3">Failed to generate recommendations.</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations right now"
          description="Update your applicant profile with more skills, experience, and target job titles to help our match engine find optimal opportunities."
          actionLabel="Update Profile"
          onAction={() => {
            window.location.href = "/applicant/profile";
          }}
        />
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const job = rec.job || {};
            const company = job.company || {};
            const hasSalary = job.salaryMin != null || job.salaryMax != null;

            return (
              <Card key={rec._id} className="p-5 sm:p-6 transition-all hover:shadow-md border-muted">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        to={`/jobs/${job._id || ""}`}
                        className="font-bold text-lg text-foreground hover:text-primary transition-colors"
                      >
                        {job.title || "Job Position"}
                      </Link>
                      {getScoreBadge(rec.matchScore || 0)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Building2 className="w-3.5 h-3.5" />
                        {company.name || "Company"}
                      </span>

                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                      )}

                      {hasSalary && (
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                          <DollarSign className="w-3.5 h-3.5" />
                          {job.salaryMin && job.salaryMax
                            ? `${formatCurrency(job.salaryMin, job.currency)} - ${formatCurrency(job.salaryMax, job.currency)}`
                            : job.salaryMin
                            ? `From ${formatCurrency(job.salaryMin, job.currency)}`
                            : `Up to ${formatCurrency(job.salaryMax, job.currency)}`}
                        </span>
                      )}
                    </div>

                    {/* Match Reason explanation */}
                    {rec.reason && (
                      <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200 mt-2 flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Why this matched:</strong> {rec.reason}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDismiss(rec._id)}
                      title="Dismiss match"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>

                    <Link to={`/jobs/${job._id}`}>
                      <Button size="sm" className="gap-1.5 text-xs">
                        <span>View Position</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

