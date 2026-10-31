import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useGetJobByIdQuery, useGetJobApplicationsQuery } from "@/features/jobs/api";
import { useUpdateApplicationStatusMutation } from "@/features/applications/api";
import { useCreateConversationMutation } from "@/features/messaging/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  ArrowLeft,
  Users,
  FileText,
  MessageSquare,
  ExternalLink,
  Calendar,
  CheckCircle,
  Briefcase,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

const allowedTransitions = {
  submitted: ["reviewing", "shortlisted", "rejected"],
  reviewing: ["shortlisted", "interviewing", "rejected"],
  shortlisted: ["interviewing", "offered", "rejected"],
  interviewing: ["offered", "rejected"],
  offered: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

export function RecruiterJobApplicantsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: job, isLoading: isJobLoading } = useGetJobByIdQuery(jobId);
  const {
    data: applications,
    isLoading: isAppsLoading,
    refetch,
  } = useGetJobApplicationsQuery(jobId);

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateApplicationStatusMutation();
  const [createConversation, { isLoading: isCreatingChat }] = useCreateConversationMutation();

  // Status modal state
  const [statusTarget, setStatusTarget] = useState(null);
  const [nextStatus, setNextStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Candidate inspect modal state
  const [inspectTarget, setInspectTarget] = useState(null);

  const handleOpenStatusModal = (app) => {
    setStatusTarget(app);
    const valid = allowedTransitions[app.status] || [];
    setNextStatus(valid[0] || "");
    setStatusNote("");
  };

  const handleSaveStatus = async () => {
    if (!statusTarget || !nextStatus) return;
    try {
      await updateStatus({
        id: statusTarget._id,
        status: nextStatus,
        note: statusNote.trim() || undefined,
      }).unwrap();
      toast({
        title: "Status Updated",
        description: `Candidate status changed to ${nextStatus}.`,
        variant: "success",
      });
      setStatusTarget(null);
      refetch();
    } catch (err) {
      toast({
        title: "Update Failed",
        description: err.data?.message || "Failed to update application status.",
        variant: "destructive",
      });
    }
  };

  const handleMessageCandidate = async (app) => {
    const applicantUser = app.applicant;
    const recipientId = applicantUser?._id || applicantUser;
    if (!recipientId) return;

    try {
      const conv = await createConversation({
        recipient: recipientId,
        job: jobId,
        application: app._id,
      }).unwrap();
      navigate(`/messages/${conv._id}`);
    } catch (err) {
      toast({
        title: "Chat Error",
        description: err.data?.message || "Could not open conversation.",
        variant: "destructive",
      });
    }
  };

  if (isJobLoading || isAppsLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const appsList = applications || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <Link
          to="/recruiter/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Applicants for {job?.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review received candidate profiles, update hiring pipeline statuses, and initiate direct conversations.
            </p>
          </div>
          <Badge variant="outline" className="text-sm py-1 px-3 self-start">
            Total Applicants: {appsList.length}
          </Badge>
        </div>
      </div>

      {appsList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applications received yet"
          description="Your position is published. As candidates apply, their resumes, qualifications, and cover letters will appear here."
        />
      ) : (
        <div className="space-y-4">
          {appsList.map((app) => {
            const applicant = app.applicant || {};
            const profile = app.applicantProfile || {};
            const validTransitions = allowedTransitions[app.status] || [];
            const resumeUrl = app.resume || profile.resume;

            return (
              <Card key={app._id} className="p-5 sm:p-6 transition-all hover:shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Column: Candidate Info */}
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
                        <Badge variant="secondary" className="capitalize text-xs">
                          {app.status}
                        </Badge>
                      </div>

                      {profile.headline && (
                        <p className="text-xs font-medium text-foreground truncate">
                          {profile.headline}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {profile.location && <span>📍 {profile.location}</span>}
                        <span>Applied {formatDate(app.createdAt)}</span>
                        {applicant.email && <span>✉️ {applicant.email}</span>}
                      </div>

                      {/* Cover letter snippet */}
                      {app.coverLetter && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2 bg-muted/40 p-2.5 rounded-lg border">
                          <strong className="text-foreground">Cover letter:</strong> {app.coverLetter}
                        </p>
                      )}

                      {/* Candidate Skills preview */}
                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {profile.skills.slice(0, 5).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground"
                            >
                              {s}
                            </span>
                          ))}
                          {profile.skills.length > 5 && (
                            <span className="text-[11px] text-muted-foreground self-center">
                              +{profile.skills.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 lg:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectTarget({ applicant, profile, app })}
                      className="text-xs"
                    >
                      Inspect Profile
                    </Button>

                    {resumeUrl && (
                      <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <FileText className="w-3.5 h-3.5" />
                          Resume
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </a>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleMessageCandidate(app)}
                      isLoading={isCreatingChat}
                      className="gap-1 text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      Message
                    </Button>

                    {validTransitions.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenStatusModal(app)}
                        className="text-xs"
                      >
                        Change Status
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Change Status Modal */}
      <Dialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
      >
        <div className="relative">
          <DialogClose onClick={() => setStatusTarget(null)} />
          <DialogHeader>
            <DialogTitle>Update Hiring Stage</DialogTitle>
            <DialogDescription>
              Transition candidate{" "}
              <span className="font-semibold text-foreground">
                {statusTarget?.applicant?.name}
              </span>{" "}
              to the next hiring pipeline status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">New Status</label>
              <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                {(allowedTransitions[statusTarget?.status] || []).map((st) => (
                  <option key={st} value={st}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Internal Note (Optional)</label>
              <Textarea
                rows={3}
                placeholder="Add private evaluation notes or reasons for this status transition..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingStatus}
                onClick={() => setStatusTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                isLoading={isUpdatingStatus}
                onClick={handleSaveStatus}
              >
                Confirm Status
              </Button>
            </DialogFooter>
          </div>
        </div>
      </Dialog>

      {/* Candidate Profile Inspection Modal */}
      <Dialog
        open={Boolean(inspectTarget)}
        onOpenChange={(open) => !open && setInspectTarget(null)}
      >
        <div className="relative max-h-[80vh] overflow-y-auto pr-1">
          <DialogClose onClick={() => setInspectTarget(null)} />
          <DialogHeader>
            <DialogTitle>{inspectTarget?.applicant?.name || "Candidate Profile"}</DialogTitle>
            <DialogDescription>
              {inspectTarget?.profile?.headline || "No headline provided"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2 text-xs">
            {inspectTarget?.profile?.summary && (
              <div>
                <h4 className="font-semibold text-foreground mb-1">Bio / Summary</h4>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed bg-muted/30 p-3 rounded-lg border">
                  {inspectTarget.profile.summary}
                </p>
              </div>
            )}

            {inspectTarget?.profile?.skills && inspectTarget.profile.skills.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Technical Proficiencies</h4>
                <div className="flex flex-wrap gap-1.5">
                  {inspectTarget.profile.skills.map((s, idx) => (
                    <Badge key={idx} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {inspectTarget?.profile?.experience && inspectTarget.profile.experience.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Work Experience
                </h4>
                <div className="space-y-2">
                  {inspectTarget.profile.experience.map((exp, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/20">
                      <div className="font-semibold text-foreground">{exp.title}</div>
                      <div className="text-muted-foreground">{exp.company}</div>
                      {exp.description && (
                        <p className="mt-1 text-muted-foreground whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inspectTarget?.profile?.education && inspectTarget.profile.education.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Education
                </h4>
                <div className="space-y-2">
                  {inspectTarget.profile.education.map((edu, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/20">
                      <div className="font-semibold text-foreground">
                        {edu.qualification} in {edu.fieldOfStudy}
                      </div>
                      <div className="text-muted-foreground">{edu.institution}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t">
              <Button size="sm" onClick={() => setInspectTarget(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

