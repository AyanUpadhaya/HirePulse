import React, { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useGenerateJobDescriptionMutation } from "@/features/ai/api";
import { Sparkles, AlertCircle, Wand2, Lightbulb } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function AiJobDescriptionModal({
  open,
  onOpenChange,
  currentValues,
  onApplyDescription,
}) {
  const { toast } = useToast();
  const [additionalContext, setAdditionalContext] = useState("");
  const [generateDescription, { isLoading, error, reset }] = useGenerateJobDescriptionMutation();

  const handleGenerate = async () => {
    if (!currentValues.title || currentValues.title.trim().length < 3) {
      toast({
        title: "Title Required",
        description: "Please enter a job title (at least 3 characters) first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        title: currentValues.title.trim(),
        requiredSkills: currentValues.requiredSkills || [],
        minExperienceYears: Number(currentValues.minExperienceYears) || 0,
        employmentType: currentValues.employmentType,
        workMode: currentValues.workMode,
        location: currentValues.location,
        additionalContext: additionalContext.trim() || undefined,
      };

      const result = await generateDescription(payload).unwrap();
      if (result.description) {
        onApplyDescription(result.description);
        toast({
          title: "Draft Generated!",
          description: "AI draft inserted into the description field. Please review and edit before saving.",
          variant: "success",
        });
        onOpenChange(false);
      }
    } catch {
      // Error is captured in mutation state
    }
  };

  const getErrorMessage = () => {
    if (!error) return null;
    const status = error.status;
    if (status === 429) {
      return "Rate limit exceeded. Please wait a few moments before generating another description.";
    }
    if (status === 503) {
      return "AI generation service is currently unavailable or unconfigured on the server.";
    }
    return error.data?.message || "Failed to generate job description.";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="relative">
        <DialogClose onClick={() => onOpenChange(false)} />

        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">
              AI Assistant
            </span>
          </div>
          <DialogTitle>Generate Job Description Draft</DialogTitle>
          <DialogDescription>
            Creates an editable draft using your current form inputs ({currentValues.title || "Job Title"}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              <strong>Review Required:</strong> The generated draft will populate your editable description field. It is never automatically published or saved to the database.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground" htmlFor="context">
              Additional Context or Special Requirements (Optional)
            </label>
            <Textarea
              id="context"
              rows={4}
              maxLength={2000}
              placeholder="e.g. Include details about our microservices architecture, remote team perks, high equity grant, and interview rounds..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Add key selling points or culture highlights</span>
              <span>{additionalContext.length}/2000</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{getErrorMessage()}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={isLoading}
              onClick={handleGenerate}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Wand2 className="w-4 h-4" />
              <span>Generate Draft</span>
            </Button>
          </DialogFooter>
        </div>
      </div>
    </Dialog>
  );
}

