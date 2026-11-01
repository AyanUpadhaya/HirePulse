import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/auth/authSlice";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobSchema, employmentTypes, workModes, salaryPeriods, jobStatuses } from "@/features/jobs/schemas";
import {
  useGetJobByIdQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
} from "@/features/jobs/api";
import { useGetCategoriesQuery } from "@/features/categories/api";
import { useGetCompaniesQuery } from "@/features/companies/api";
import { useGetMyProfileQuery } from "@/features/profiles/api";
import { AiJobDescriptionModal } from "../components/AiJobDescriptionModal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  Sparkles,
  ArrowLeft,
  Briefcase,
  Building,
  DollarSign,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

export function RecruiterJobFormPage() {
  const { jobId } = useParams();
  const isEditMode = Boolean(jobId);
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === "admin";

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const { data: job, isLoading: isJobLoading } = useGetJobByIdQuery(jobId, {
    skip: !isEditMode,
  });
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: companies = [] } = useGetCompaniesQuery(undefined, { skip: !isAdmin });
  const { data: recruiterProfile } = useGetMyProfileQuery(undefined, { skip: isAdmin });

  const [createJob, { isLoading: isCreating }] = useCreateJobMutation();
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();

  const recruiterCompanyId =
    typeof recruiterProfile?.company === "object"
      ? recruiterProfile?.company?._id
      : recruiterProfile?.company;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      category: "",
      company: "",
      employmentType: "full_time",
      workMode: "onsite",
      location: "",
      description: "",
      requiredSkills: [],
      minExperienceYears: 0,
      salaryMin: undefined,
      salaryMax: undefined,
      salaryPeriod: "monthly",
      currency: "USD",
      applicationDeadline: "",
      vacancies: 1,
      status: "draft",
      isAiGeneratedDescription: false,
    },
  });

  const currentSkills = watch("requiredSkills") || [];
  const watchedValues = watch();

  // Populate recruiter company if not edit mode
  useEffect(() => {
    if (!isEditMode && recruiterCompanyId) {
      setValue("company", recruiterCompanyId);
    }
  }, [isEditMode, recruiterCompanyId, setValue]);

  // Populate data when editing
  useEffect(() => {
    if (isEditMode && job) {
      reset({
        title: job.title || "",
        category: typeof job.category === "object" ? job.category?._id : job.category || "",
        company: typeof job.company === "object" ? job.company?._id : job.company || "",
        employmentType: job.employmentType || "full_time",
        workMode: job.workMode || "onsite",
        location: job.location || "",
        description: job.description || "",
        requiredSkills: job.requiredSkills || [],
        minExperienceYears: job.minExperienceYears || 0,
        salaryMin: job.salaryMin != null ? job.salaryMin : undefined,
        salaryMax: job.salaryMax != null ? job.salaryMax : undefined,
        salaryPeriod: job.salaryPeriod || "monthly",
        currency: job.currency || "USD",
        applicationDeadline: job.applicationDeadline
          ? job.applicationDeadline.slice(0, 10)
          : "",
        vacancies: job.vacancies || 1,
        status: job.status || "draft",
        isAiGeneratedDescription: Boolean(job.isAiGeneratedDescription),
      });
    }
  }, [isEditMode, job, reset]);

  const addSkill = () => {
    if (skillInput.trim() && !currentSkills.includes(skillInput.trim())) {
      setValue("requiredSkills", [...currentSkills, skillInput.trim()], { shouldDirty: true });
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setValue(
      "requiredSkills",
      currentSkills.filter((s) => s !== skill),
      { shouldDirty: true }
    );
  };

  const handleApplyAiDescription = (generatedText) => {
    setValue("description", generatedText, { shouldDirty: true, shouldValidate: true });
    setValue("isAiGeneratedDescription", true);
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        applicationDeadline: values.applicationDeadline
          ? new Date(values.applicationDeadline).toISOString()
          : null,
      };

      if (isEditMode) {
        await updateJob({ id: jobId, ...payload }).unwrap();
        toast({
          title: "Job Updated",
          description: "Changes to your job posting have been saved.",
          variant: "success",
        });
      } else {
        await createJob(payload).unwrap();
        toast({
          title: "Job Created",
          description: `Job "${values.title}" has been successfully created.`,
          variant: "success",
        });
      }

      navigate(isAdmin ? "/admin/jobs" : "/recruiter/jobs");
    } catch (err) {
      if (err.data?.errors && Array.isArray(err.data.errors)) {
        err.data.errors.forEach((validationErr) => {
          if (validationErr.field) {
            setError(validationErr.field, { message: validationErr.message });
          }
        });
      }
      toast({
        title: "Save Failed",
        description: err.data?.message || "Failed to save job posting.",
        variant: "destructive",
      });
    }
  };

  if (isEditMode && isJobLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          to={isAdmin ? "/admin/jobs" : "/recruiter/jobs"}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {isEditMode ? "Edit Job Posting" : "Post a New Position"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Provide key requirements, compensation details, and leverage AI to draft engaging job descriptions.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Information */}
        <Card>
          <CardHeader>
            <CardTitle>Core Details</CardTitle>
            <CardDescription>Basic role identification and classification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="title">
                Job Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                placeholder="e.g. Senior Frontend Engineer"
                error={Boolean(errors.title)}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="category">
                  Job Category <span className="text-destructive">*</span>
                </label>
                <Select id="category" error={Boolean(errors.category)} {...register("category")}>
                  <option value="">Select a category</option>
                  {categories
                    .filter((c) => c.isActive !== false)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </Select>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category.message}</p>
                )}
              </div>

              {/* Company Selection (Dropdown for admin, read-only/hidden for recruiter) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="company">
                  Company <span className="text-destructive">*</span>
                </label>
                {isAdmin ? (
                  <Select id="company" error={Boolean(errors.company)} {...register("company")}>
                    <option value="">Select a company</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div>
                    <Input
                      disabled
                      value={
                        typeof recruiterProfile?.company === "object"
                          ? recruiterProfile?.company?.name || "Your Company"
                          : "Your Company"
                      }
                      className="bg-muted text-muted-foreground"
                    />
                    {!recruiterCompanyId && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Please create your{" "}
                        <Link to="/recruiter/company" className="underline font-semibold">
                          Company Profile
                        </Link>{" "}
                        first before publishing jobs.
                      </p>
                    )}
                  </div>
                )}
                {errors.company && (
                  <p className="text-xs text-destructive">{errors.company.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="employmentType">
                  Employment Type
                </label>
                <Select id="employmentType" {...register("employmentType")}>
                  {employmentTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="workMode">
                  Work Mode
                </label>
                <Select id="workMode" {...register("workMode")}>
                  {workModes.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="location">
                  Location (City/Country)
                </label>
                <Input
                  id="location"
                  placeholder="e.g. Dhaka or Remote"
                  {...register("location")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description & AI Assistant */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Job Description</CardTitle>
              <CardDescription>
                Detailed overview of responsibilities and qualifications
              </CardDescription>
            </div>
            {/* AI Assistant Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAiModalOpen(true)}
              className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Generate with AI</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Textarea
                rows={10}
                placeholder="Write or generate a comprehensive job description..."
                error={Boolean(errors.description)}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            {watchedValues.isAiGeneratedDescription && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Contains AI-assisted draft content. Will be attributed upon saving.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requirements & Compensation */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements & Compensation</CardTitle>
            <CardDescription>Skill criteria, experience, and salary boundaries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Required Skills Tag Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Required Skills</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill (e.g. React, Docker, GraphQL)..."
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

              <div className="flex flex-wrap gap-2 pt-1">
                {currentSkills.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No skills added yet.</p>
                ) : (
                  currentSkills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="cursor-pointer gap-1.5 py-1 px-3"
                      onClick={() => removeSkill(skill)}
                      title="Click to remove"
                    >
                      <span>{skill}</span>
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="minExperienceYears">
                  Minimum Experience (Years)
                </label>
                <Input
                  id="minExperienceYears"
                  type="number"
                  min={0}
                  {...register("minExperienceYears")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="vacancies">
                  Vacancies / Openings
                </label>
                <Input
                  id="vacancies"
                  type="number"
                  min={1}
                  {...register("vacancies")}
                />
              </div>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="salaryMin">
                  Minimum Salary
                </label>
                <Input
                  id="salaryMin"
                  type="number"
                  min={0}
                  placeholder="Optional"
                  {...register("salaryMin")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="salaryMax">
                  Maximum Salary
                </label>
                <Input
                  id="salaryMax"
                  type="number"
                  min={0}
                  placeholder="Optional"
                  error={Boolean(errors.salaryMax)}
                  {...register("salaryMax")}
                />
                {errors.salaryMax && (
                  <p className="text-xs text-destructive">{errors.salaryMax.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="salaryPeriod">
                  Salary Period
                </label>
                <Select id="salaryPeriod" {...register("salaryPeriod")}>
                  {salaryPeriods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="currency">
                  Currency
                </label>
                <Input
                  id="currency"
                  placeholder="USD"
                  {...register("currency")}
                />
              </div>
            </div>

            {/* Deadline & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="applicationDeadline">
                  Application Deadline
                </label>
                <Input
                  id="applicationDeadline"
                  type="date"
                  {...register("applicationDeadline")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="status">
                  Job Status
                </label>
                <Select id="status" {...register("status")}>
                  {jobStatuses.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Link to={isAdmin ? "/admin/jobs" : "/recruiter/jobs"}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            size="lg"
            isLoading={isCreating || isUpdating}
            className="px-8 font-semibold"
          >
            {isEditMode ? "Save Changes" : "Create Position"}
          </Button>
        </div>
      </form>

      {/* AI Generator Modal */}
      <AiJobDescriptionModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        currentValues={watchedValues}
        onApplyDescription={handleApplyAiDescription}
      />
    </div>
  );
}
