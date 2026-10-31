import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applyJobSchema } from "@/features/jobs/schemas";
import { useApplyJobMutation } from "@/features/jobs/api";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { FileText, AlertCircle } from "lucide-react";

export function ApplyModal({ open, onOpenChange, job, profileResumeUrl }) {
  const { toast } = useToast();
  const [applyJob, { isLoading, error: apiError }] = useApplyJobMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applyJobSchema),
    defaultValues: {
      coverLetter: "",
      resume: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const payload = {
        jobId: job._id,
      };
      if (values.coverLetter?.trim()) {
        payload.coverLetter = values.coverLetter.trim();
      }
      if (values.resume?.trim()) {
        payload.resume = values.resume.trim();
      }

      await applyJob(payload).unwrap();
      toast({
        title: "Application Submitted!",
        description: `Your application for ${job.title} has been received.`,
        variant: "success",
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Application failed",
        description: err.data?.message || "Could not submit application.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="relative">
        <DialogClose onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Apply for Position</DialogTitle>
          <DialogDescription>
            Submit your application for <span className="font-semibold text-foreground">{job?.title}</span> at{" "}
            <span className="font-semibold text-foreground">{job?.company?.name || "the company"}</span>.
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <div className="mb-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{apiError.data?.message || "Error submitting application."}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="coverLetter">
              Cover Letter / Personal Note (Optional)
            </label>
            <Textarea
              id="coverLetter"
              rows={4}
              placeholder="Introduce yourself and explain why you're a great fit for this role..."
              error={Boolean(errors.coverLetter)}
              {...register("coverLetter")}
            />
            {errors.coverLetter && (
              <p className="text-xs text-destructive">{errors.coverLetter.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="resume">
              Custom Resume URL (Optional)
            </label>
            <Input
              id="resume"
              type="url"
              placeholder="https://..."
              error={Boolean(errors.resume)}
              {...register("resume")}
            />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                {profileResumeUrl
                  ? "Leaving blank will automatically attach your profile resume."
                  : "If you have a resume uploaded to your profile, it will be attached."}
              </span>
            </div>
            {errors.resume && (
              <p className="text-xs text-destructive">{errors.resume.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Submit Application
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}

