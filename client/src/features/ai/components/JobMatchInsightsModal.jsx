import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useGetJobMatchInsightsMutation } from "../api";
import { Sparkles, ShieldCheck, AlertCircle, CheckCircle2, XCircle, Lightbulb, RefreshCw } from "lucide-react";

export function JobMatchInsightsModal({ open, onOpenChange, jobId, jobTitle }) {
  const [hasConsented, setHasConsented] = useState(false);
  const [getInsights, { data, isLoading, error, reset }] = useGetJobMatchInsightsMutation();

  const handleRequestInsights = async () => {
    if (!hasConsented) return;
    try {
      await getInsights({ jobId, consent: true }).unwrap();
    } catch {
      // Error handled via error state
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Don't reset state immediately to allow reopening
  };

  const getErrorMessage = () => {
    if (!error) return null;
    const status = error.status;
    if (status === 429) {
      return "AI match insights request limit reached (10 requests per 15 minutes). Please try again shortly.";
    }
    if (status === 503) {
      return "AI service is currently not configured or temporarily unavailable. Normal applications are unaffected.";
    }
    if (status === 502 || status === 504) {
      return "The AI service timed out. Please try again in a few moments.";
    }
    return error.data?.message || "Could not generate match insights at this time.";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <div className="relative">
        <DialogClose onClick={handleClose} />

        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-bold tracking-wider uppercase text-indigo-600">
              AI Match Insights
            </span>
          </div>
          <DialogTitle>Career Fit Analysis</DialogTitle>
          <DialogDescription>
            Position: <span className="font-semibold text-foreground">{jobTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Pre-flight Consent Screen */}
        {!data && !isLoading && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-muted bg-muted/40 p-4 text-xs text-muted-foreground space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Privacy & Data Disclosure</p>
                  <p className="mt-1 leading-relaxed">
                    To assess your alignment with this position, your headline, skills, experience, and education summaries will be sent to the configured AI provider alongside this job's requirements.
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    Your actual resume file and URLs will never be shared. This insight is non-binding guidance, not a score or hiring decision.
                  </p>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs text-foreground font-medium">
                I understand and provide explicit consent to transmit my profile summaries to the AI service for this job evaluation.
              </span>
            </label>

            {error && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{getErrorMessage()}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!hasConsented}
                onClick={handleRequestInsights}
                className="gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Analyze Match
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-foreground">Analyzing Profile & Job Details...</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Comparing your skills, experience, and background against requirements.
            </p>
          </div>
        )}

        {/* Step 3: Result Display */}
        {data && (
          <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Guidance banner */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <span>
                <strong>Guidance Notice:</strong> These insights are AI-generated suggestions to assist your preparation. They do not constitute an automated hiring decision.
              </span>
            </div>

            {/* Match summary (Escaped text) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Overview & Alignment
              </h4>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap rounded-lg bg-muted/40 p-3.5 border">
                {String(data.matchSummary || "No summary provided.")}
              </p>
            </div>

            {/* Matching skills & Skill gaps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg border bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/60">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Matching Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.matchingSkills && data.matchingSkills.length > 0 ? (
                    data.matchingSkills.map((s, idx) => (
                      <Badge key={idx} variant="success" className="text-xs">
                        {String(s)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None identified</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/60">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  <XCircle className="w-4 h-4" />
                  <span>Potential Gaps / Learnings</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.skillGaps && data.skillGaps.length > 0 ? (
                    data.skillGaps.map((s, idx) => (
                      <Badge key={idx} variant="warning" className="text-xs">
                        {String(s)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No significant gaps detected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {data.suggestions && data.suggestions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Actionable Application Suggestions
                </h4>
                <ul className="space-y-1.5 text-xs text-foreground list-disc pl-5">
                  {data.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {String(suggestion)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            {data.disclaimer && (
              <p className="text-[11px] text-muted-foreground italic border-t pt-2">
                {String(data.disclaimer)}
              </p>
            )}

            <div className="flex justify-between items-center pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  reset();
                }}
                className="gap-1 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Analyze Again
              </Button>
              <Button size="sm" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

