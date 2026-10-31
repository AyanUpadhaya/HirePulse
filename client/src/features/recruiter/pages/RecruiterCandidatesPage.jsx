import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGenerateCandidateRecommendationsMutation } from "@/features/recommendations/api";
import { useCreateConversationMutation } from "@/features/messaging/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  Users,
  Sparkles,
  RefreshCw,
  MessageSquare,
  TrendingUp,
  MapPin,
  Briefcase,
  FileText,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

export function RecruiterCandidatesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generateCandidates, { data: candidateMatches, isLoading, error }] =
    useGenerateCandidateRecommendationsMutation();
  const [createConversation, { isLoading: isCreatingChat }] = useCreateConversationMutation();

  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    generateCandidates();
  }, [generateCandidates]);

  useEffect(() => {
    if (candidateMatches) {
      setCandidates(candidateMatches.filter((c) => !c.isDismissed));
    }
  }, [candidateMatches]);

  const handleRefresh = async () => {
    try {
      const res = await generateCandidates().unwrap();
      setCandidates(res.filter((c) => !c.isDismissed));
      toast({
        title: "Candidate matches refreshed!",
        description: `Found ${res.length} matched candidates for your open roles.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not refresh",
        description: "Failed to recalculate candidate matches.",
        variant: "destructive",
      });
    }
  };

  const handleMessage = async (applicantId, jobId) => {
    try {
      const conv = await createConversation({
        recipient: applicantId,
        job: jobId || undefined,
      }).unwrap();
      navigate(`/messages/${conv._id}`);
    } catch (err) {
      toast({
        title: "Chat Error",
        description: err.data?.message || "Failed to start conversation.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            <span>Candidate Discovery</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover qualified applicants whose verified skills match your company's active openings.
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
          <span>Refresh Candidates</span>
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
          <p className="text-destructive font-medium mb-3">Failed to load candidate matches.</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidate recommendations yet"
          description="Ensure you have published jobs with specified required skills to activate intelligent candidate matching."
          actionLabel="View My Jobs"
          onAction={() => {
            window.location.href = "/recruiter/jobs";
          }}
        />
      ) : (
        <div className="space-y-4">
          {candidates.map((rec) => {
            const applicant = rec.applicant || {};
            const job = rec.job || {};

            return (
              <Card key={rec._id} className="p-5 sm:p-6 transition-all hover:shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {applicant.avatar ? (
                      <img
                        src={applicant.avatar}
                        alt={applicant.name}
                        className="w-12 h-12 rounded-full object-cover border shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                        {getInitials(applicant.name)}
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-foreground">
                          {applicant.name || "Candidate"}
                        </span>
                        <Badge variant="success" className="text-xs">
                          {rec.matchScore || 0}% Fit
                        </Badge>
                        {job.title && (
                          <Badge variant="outline" className="text-xs">
                            For: {job.title}
                          </Badge>
                        )}
                      </div>

                      {rec.reason && (
                        <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200 mt-1 flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                          <span>{rec.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleMessage(applicant._id, job._id)}
                      isLoading={isCreatingChat}
                      className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Contact Candidate</span>
                    </Button>
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

