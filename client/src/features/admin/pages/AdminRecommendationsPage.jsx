import React, { useState } from "react";
import { useGenerateCandidateRecommendationsMutation } from "@/features/recommendations/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Sparkles, RefreshCw, Users, TrendingUp } from "lucide-react";
import { getInitials } from "@/lib/utils";

export function AdminRecommendationsPage() {
  const { toast } = useToast();
  const [generateMatches, { data, isLoading, error }] =
    useGenerateCandidateRecommendationsMutation();

  const handleTrigger = async () => {
    try {
      const res = await generateMatches().unwrap();
      toast({
        title: "Candidate Matching Generated",
        description: `Computed ${res.length} matches across system jobs.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Generation Failed",
        description: "Failed to run recommendation engine.",
        variant: "destructive",
      });
    }
  };

  const matches = data || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <span>Candidate Match Engine Console</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit system-wide candidate-job recommendation scoring and trigger match runs.
          </p>
        </div>

        <Button
          onClick={handleTrigger}
          isLoading={isLoading}
          disabled={isLoading}
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Execute Match Scoring</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No candidate matches generated yet"
          description="Click 'Execute Match Scoring' above to test and compute candidate recommendations."
          actionLabel="Execute Now"
          onAction={handleTrigger}
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m) => (
            <Card key={m._id} className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base">{m.applicant?.name || "Candidate"}</span>
                    <Badge variant="success">{m.matchScore || 0}% Score</Badge>
                    <Badge variant="outline">Job: {m.job?.title || "Position"}</Badge>
                  </div>
                  {m.reason && (
                    <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border">
                      {m.reason}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

