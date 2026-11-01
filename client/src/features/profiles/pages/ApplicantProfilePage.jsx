import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useGetMyProfileQuery, useUpdateApplicantProfileMutation, useUploadResumeMutation } from "../api";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicantProfileSchema } from "../schemas";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  User,
  Briefcase,
  GraduationCap,
  FileText,
  Sliders,
  Mail,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  Copy,
  Share2,
} from "lucide-react";
import { employmentTypes, workModes, salaryPeriods } from "@/features/jobs/schemas";
import { selectCurrentUser } from "@/features/auth/authSlice";

export function ApplicantProfilePage() {
  const { toast } = useToast();
  const user = useSelector(selectCurrentUser);
  const { data: profile, isLoading, refetch } = useGetMyProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateApplicantProfileMutation();
  const [uploadResume, { isLoading: isUploadingResume }] = useUploadResumeMutation();

  const [skillInput, setSkillInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileError, setResumeFileError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(applicantProfileSchema),
    defaultValues: {
      headline: "",
      summary: "",
      location: "",
      skills: [],
      experience: [],
      education: [],
      resume: "",
      preferredJobTitles: [],
      preferredLocations: [],
      preferredEmploymentTypes: [],
      preferredWorkModes: [],
      expectedSalaryMin: 0,
      expectedSalaryMax: 0,
      expectedSalaryPeriod: "monthly",
      currency: "USD",
      isDiscoverable: true,
      emailJobRecommendations: false,
    },
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({ control, name: "experience" });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({ control, name: "education" });

  const currentSkills = watch("skills") || [];
  const currentPrefTitles = watch("preferredJobTitles") || [];
  const currentPrefLocations = watch("preferredLocations") || [];
  const currentPrefTypes = watch("preferredEmploymentTypes") || [];
  const currentPrefModes = watch("preferredWorkModes") || [];
  const currentResumeUrl = watch("resume") || "";
  const isDiscoverable = watch("isDiscoverable");
  const publicProfileUrl = user?._id
    ? `${window.location.origin}/applicants/${user._id}`
    : "";

  const copyPublicProfileLink = async () => {
    if (!publicProfileUrl) return;
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      toast({
        title: "Profile link copied",
        description: "Share this link with recruiters. They must sign in to view it.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not copy link",
        description: "Your browser blocked clipboard access. Copy the profile URL from the address field.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (profile) {
      reset({
        headline: profile.headline || "",
        summary: profile.summary || "",
        location: profile.location || "",
        skills: profile.skills || [],
        experience: (profile.experience || []).map((exp) => ({
          company: exp.company || "",
          title: exp.title || "",
          description: exp.description || "",
          startDate: exp.startDate ? exp.startDate.slice(0, 10) : "",
          endDate: exp.endDate ? exp.endDate.slice(0, 10) : "",
          current: Boolean(exp.current),
        })),
        education: (profile.education || []).map((edu) => ({
          institution: edu.institution || "",
          qualification: edu.qualification || "",
          fieldOfStudy: edu.fieldOfStudy || "",
          startDate: edu.startDate ? edu.startDate.slice(0, 10) : "",
          endDate: edu.endDate ? edu.endDate.slice(0, 10) : "",
        })),
        resume: profile.resume || "",
        preferredJobTitles: profile.preferredJobTitles || [],
        preferredLocations: profile.preferredLocations || [],
        preferredEmploymentTypes: profile.preferredEmploymentTypes || [],
        preferredWorkModes: profile.preferredWorkModes || [],
        expectedSalaryMin: profile.expectedSalaryMin || 0,
        expectedSalaryMax: profile.expectedSalaryMax || 0,
        expectedSalaryPeriod: profile.expectedSalaryPeriod || "monthly",
        currency: profile.currency || "USD",
        isDiscoverable: profile.isDiscoverable !== false,
        emailJobRecommendations: Boolean(profile.emailJobRecommendations),
      });
    }
  }, [profile, reset]);

  // Skill management
  const addSkill = () => {
    if (skillInput.trim() && !currentSkills.includes(skillInput.trim())) {
      setValue("skills", [...currentSkills, skillInput.trim()], { shouldDirty: true });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setValue(
      "skills",
      currentSkills.filter((s) => s !== skillToRemove),
      { shouldDirty: true }
    );
  };

  // Preference tag management
  const addPrefTitle = () => {
    if (titleInput.trim() && !currentPrefTitles.includes(titleInput.trim())) {
      setValue("preferredJobTitles", [...currentPrefTitles, titleInput.trim()], { shouldDirty: true });
      setTitleInput("");
    }
  };

  const removePrefTitle = (title) => {
    setValue(
      "preferredJobTitles",
      currentPrefTitles.filter((t) => t !== title),
      { shouldDirty: true }
    );
  };

  const addPrefLocation = () => {
    if (locationInput.trim() && !currentPrefLocations.includes(locationInput.trim())) {
      setValue("preferredLocations", [...currentPrefLocations, locationInput.trim()], { shouldDirty: true });
      setLocationInput("");
    }
  };

  const removePrefLocation = (loc) => {
    setValue(
      "preferredLocations",
      currentPrefLocations.filter((l) => l !== loc),
      { shouldDirty: true }
    );
  };

  const toggleEmploymentType = (type) => {
    const next = currentPrefTypes.includes(type)
      ? currentPrefTypes.filter((t) => t !== type)
      : [...currentPrefTypes, type];
    setValue("preferredEmploymentTypes", next, { shouldDirty: true });
  };

  const toggleWorkMode = (mode) => {
    const next = currentPrefModes.includes(mode)
      ? currentPrefModes.filter((m) => m !== mode)
      : [...currentPrefModes, mode];
    setValue("preferredWorkModes", next, { shouldDirty: true });
  };

  // Resume Upload handler
  const handleResumeFileSelect = (e) => {
    const file = e.target.files?.[0];
    setResumeFileError("");
    if (!file) return;

    if (file.type !== "application/pdf") {
      setResumeFileError("Only PDF files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeFileError("Resume file size cannot exceed 5MB.");
      return;
    }
    setResumeFile(file);
  };

  const handleUploadResume = async () => {
    if (!resumeFile) return;
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      const res = await uploadResume(formData).unwrap();
      setValue("resume", res.resume || res.profile?.resume, { shouldDirty: true });
      toast({
        title: "Resume uploaded!",
        description: "Your resume has been saved to Cloudinary and linked to your profile.",
        variant: "success",
      });
      setResumeFile(null);
      refetch();
    } catch (err) {
      toast({
        title: "Upload failed",
        description:
          err.status === 503
            ? "Cloudinary upload service is currently unconfigured on the server."
            : err.data?.message || "Failed to upload resume.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values) => {
    try {
      // Format experience & education dates to ISO string
      const payload = {
        ...values,
        experience: values.experience.map((exp) => ({
          ...exp,
          startDate: exp.startDate ? new Date(exp.startDate).toISOString() : undefined,
          endDate: exp.endDate && !exp.current ? new Date(exp.endDate).toISOString() : null,
        })),
        education: values.education.map((edu) => ({
          ...edu,
          startDate: edu.startDate ? new Date(edu.startDate).toISOString() : undefined,
          endDate: edu.endDate ? new Date(edu.endDate).toISOString() : null,
        })),
      };

      if (payload.resume?.trim()) {
        payload.resume = payload.resume.trim();
      } else {
        delete payload.resume;
      }

      await updateProfile(payload).unwrap();
      toast({
        title: "Profile Updated",
        description: "Your profile details have been successfully saved.",
        variant: "success",
      });
      refetch();
    } catch (err) {
      toast({
        title: "Save Failed",
        description: err.data?.message || "Could not save profile changes.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Applicant Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your credentials, experience, preferences, and automated job matching settings.
          </p>
        </div>

        {profile?.profileCompletion != null && (
          <div className="flex items-center gap-3 bg-card p-3 rounded-xl border shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-medium">Completion</div>
              <div className="text-sm font-bold text-primary">{profile.profileCompletion}%</div>
            </div>
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${profile.profileCompletion}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general" className="gap-2">
              <User className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-2">
              <Briefcase className="w-4 h-4" />
              Skills & Experience
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              Education
            </TabsTrigger>
            <TabsTrigger value="resume" className="gap-2">
              <FileText className="w-4 h-4" />
              Resume
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Sliders className="w-4 h-4" />
              Job Preferences
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Email Digests
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GENERAL */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal & Professional Overview</CardTitle>
                <CardDescription>
                  This information forms the core of your candidate representation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="headline">
                    Professional Headline
                  </label>
                  <Input
                    id="headline"
                    placeholder="e.g. Senior Full Stack Engineer (React, Node.js)"
                    error={Boolean(errors.headline)}
                    {...register("headline")}
                  />
                  {errors.headline && (
                    <p className="text-xs text-destructive">{errors.headline.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="location">
                    Current Location
                  </label>
                  <Input
                    id="location"
                    placeholder="e.g. Dhaka, Bangladesh or San Francisco, CA"
                    error={Boolean(errors.location)}
                    {...register("location")}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="summary">
                    Professional Bio / Summary
                  </label>
                  <Textarea
                    id="summary"
                    rows={4}
                    placeholder="Provide a concise summary of your experience, leadership, and accomplishments..."
                    error={Boolean(errors.summary)}
                    {...register("summary")}
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("isDiscoverable")}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <div>
                      <div className="text-sm font-semibold">Share my profile with recruiters</div>
                      <div className="text-xs text-muted-foreground">
                        When enabled, recruiters can find your profile in candidate discovery and open your shareable profile page. Your resume, email, and job preferences are not shown.
                      </div>
                    </div>
                  </label>
                  {isDiscoverable && (
                    <div className="mt-3 flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Share2 className="h-4 w-4 text-primary" />
                          Recruiter profile link
                        </div>
                        <p className="mt-1 break-all text-xs text-muted-foreground">{publicProfileUrl}</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={copyPublicProfileLink} className="shrink-0">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy link
                      </Button>
                    </div>
                  )}
                  {!isDiscoverable && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Turn on sharing and save your profile to make the link available to recruiters.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: SKILLS & EXPERIENCE */}
          <TabsContent value="skills" className="space-y-6">
            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Technical Proficiencies</CardTitle>
                <CardDescription>
                  Add key skills that define your expertise. These are evaluated by match algorithms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill (e.g. TypeScript, PostgreSQL, AWS)..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill} variant="secondary">
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {currentSkills.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No skills added yet.</p>
                  ) : (
                    currentSkills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs py-1 px-3 gap-1.5 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        onClick={() => removeSkill(skill)}
                        title="Click to remove"
                      >
                        <span>{skill}</span>
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Work Experience</CardTitle>
                  <CardDescription>Chronological employment history</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendExperience({
                      company: "",
                      title: "",
                      description: "",
                      startDate: "",
                      endDate: "",
                      current: false,
                    })
                  }
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Position
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {experienceFields.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No work experiences added.</p>
                ) : (
                  experienceFields.map((field, index) => {
                    const isCurrent = watch(`experience.${index}.current`);
                    return (
                      <div
                        key={field.id}
                        className="p-4 rounded-xl border bg-muted/20 space-y-4 relative"
                      >
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Job Title</label>
                            <Input
                              placeholder="e.g. Lead Software Engineer"
                              {...register(`experience.${index}.title`)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Company Name</label>
                            <Input
                              placeholder="e.g. Acme Tech"
                              {...register(`experience.${index}.company`)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Start Date</label>
                            <Input
                              type="date"
                              {...register(`experience.${index}.startDate`)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">End Date</label>
                            <Input
                              type="date"
                              disabled={isCurrent}
                              {...register(`experience.${index}.endDate`)}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`curr-${index}`}
                            {...register(`experience.${index}.current`)}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                          />
                          <label htmlFor={`curr-${index}`} className="text-xs font-medium cursor-pointer">
                            I currently work here
                          </label>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium">Key Responsibilities / Impact</label>
                          <Textarea
                            rows={3}
                            placeholder="Architected microservices, scaled throughput by 40%..."
                            {...register(`experience.${index}.description`)}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: EDUCATION */}
          <TabsContent value="education" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Education & Credentials</CardTitle>
                  <CardDescription>Academic degrees, certifications, or diplomas</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendEducation({
                      institution: "",
                      qualification: "",
                      fieldOfStudy: "",
                      startDate: "",
                      endDate: "",
                    })
                  }
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Education
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {educationFields.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No education items recorded.</p>
                ) : (
                  educationFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-xl border bg-muted/20 space-y-4 relative"
                    >
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-6">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Institution / University</label>
                          <Input
                            placeholder="e.g. University of California"
                            {...register(`education.${index}.institution`)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Degree / Qualification</label>
                          <Input
                            placeholder="e.g. Bachelor of Science"
                            {...register(`education.${index}.qualification`)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Field of Study</label>
                          <Input
                            placeholder="e.g. Computer Science"
                            {...register(`education.${index}.fieldOfStudy`)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Start Date</label>
                          <Input
                            type="date"
                            {...register(`education.${index}.startDate`)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">End Date</label>
                          <Input
                            type="date"
                            {...register(`education.${index}.endDate`)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: RESUME */}
          <TabsContent value="resume" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resume Attachment</CardTitle>
                <CardDescription>
                  Upload your PDF resume (max 5 MB) stored securely on Cloudinary, or specify an external URL.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentResumeUrl ? (
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">Current Resume Attached</div>
                        <div className="text-xs text-muted-foreground truncate max-w-md">
                          {currentResumeUrl}
                        </div>
                      </div>
                    </div>

                    <a
                      href={currentResumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      <span>View PDF</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed text-center text-muted-foreground text-sm">
                    No resume linked yet. Upload below or paste a direct URL.
                  </div>
                )}

                {/* Upload PDF Section */}
                <div className="p-5 rounded-xl border bg-muted/20 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    Upload New PDF File
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleResumeFileSelect}
                      className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!resumeFile || isUploadingResume}
                      isLoading={isUploadingResume}
                      onClick={handleUploadResume}
                    >
                      Upload
                    </Button>
                  </div>
                  {resumeFileError && (
                    <p className="text-xs text-destructive">{resumeFileError}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Supported format: PDF only. Maximum file size: 5 MB.
                  </p>
                </div>

                {/* Manual Resume URL */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-medium" htmlFor="resumeUrl">
                    Direct Resume URL (Optional Alternative)
                  </label>
                  <Input
                    id="resumeUrl"
                    type="url"
                    placeholder="https://example.com/my-resume.pdf"
                    {...register("resume")}
                  />
                  {errors.resume && (
                    <p className="text-xs text-destructive">{errors.resume.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: JOB PREFERENCES */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Search Preferences</CardTitle>
                <CardDescription>
                  Help employers and recommendation engines find the most relevant roles for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Target Titles */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Desired Job Titles</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Backend Engineer, Tech Lead..."
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addPrefTitle();
                        }
                      }}
                    />
                    <Button type="button" onClick={addPrefTitle} variant="secondary">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentPrefTitles.map((title, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                        onClick={() => removePrefTitle(title)}
                      >
                        {title}
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Target Locations */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Locations</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Dhaka, Remote, Singapore..."
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addPrefLocation();
                        }
                      }}
                    />
                    <Button type="button" onClick={addPrefLocation} variant="secondary">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentPrefLocations.map((loc, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                        onClick={() => removePrefLocation(loc)}
                      >
                        {loc}
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Preferred Employment Types */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Employment Types</label>
                  <div className="flex flex-wrap gap-2">
                    {employmentTypes.map((type) => {
                      const isSelected = currentPrefTypes.includes(type.value);
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => toggleEmploymentType(type.value)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Work Modes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Work Modes</label>
                  <div className="flex flex-wrap gap-2">
                    {workModes.map((mode) => {
                      const isSelected = currentPrefModes.includes(mode.value);
                      return (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => toggleWorkMode(mode.value)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Salary Expectations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Expected Min Salary</label>
                    <Input
                      type="number"
                      min={0}
                      {...register("expectedSalaryMin")}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" htmlFor="expectedSalaryPeriod">Salary Period</label>
                    <Select id="expectedSalaryPeriod" {...register("expectedSalaryPeriod")}>
                      {salaryPeriods.map((period) => (
                        <option key={period.value} value={period.value}>{period.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Expected Max Salary</label>
                    <Input
                      type="number"
                      min={0}
                      {...register("expectedSalaryMax")}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Currency</label>
                    <Input
                      placeholder="USD"
                      {...register("currency")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: EMAIL DIGESTS */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automated Job Recommendations Email Digest</CardTitle>
                <CardDescription>
                  Configure your explicit opt-in preference for automated daily job recommendation emails.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-start gap-3 p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    {...register("emailJobRecommendations")}
                    className="mt-1 rounded border-gray-300 text-primary focus:ring-primary h-5 w-5"
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-foreground">
                      Receive Daily Job Digest Emails
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      When enabled, our scheduled backend matching engine sends up to 5 top-scoring jobs published within the last 24 hours directly to your email at midnight.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You can disable this setting anytime to stop future digest deliveries immediately.
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Global Submit Bar */}
        <div className="sticky bottom-4 z-20 flex justify-end p-4 rounded-xl border bg-card/90 backdrop-blur shadow-lg">
          <Button type="submit" size="lg" isLoading={isUpdating} className="px-8 font-semibold">
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
