import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, companySizes } from "@/features/companies/schemas";
import {
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
} from "@/features/companies/api";
import { useGetMyProfileQuery, useUpdateRecruiterProfileMutation } from "@/features/profiles/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Building2, Globe, MapPin, Users, Link as LinkIcon, AlertCircle } from "lucide-react";

export function RecruiterCompanyPage() {
  const { toast } = useToast();
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useGetMyProfileQuery();
  const [createCompany, { isLoading: isCreating }] = useCreateCompanyMutation();
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation();
  const [updateRecruiterProfile] = useUpdateRecruiterProfileMutation();

  const recruiterCompany = profile?.company;
  const companyId = typeof recruiterCompany === "object" ? recruiterCompany?._id : recruiterCompany;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      industry: "",
      companySize: "11-50",
      headquarters: "",
      logo: "",
    },
  });

  const logoUrl = watch("logo");

  useEffect(() => {
    if (typeof recruiterCompany === "object" && recruiterCompany) {
      reset({
        name: recruiterCompany.name || "",
        description: recruiterCompany.description || "",
        website: recruiterCompany.website || "",
        industry: recruiterCompany.industry || "",
        companySize: recruiterCompany.companySize || "11-50",
        headquarters: recruiterCompany.headquarters || "",
        logo: recruiterCompany.logo || "",
      });
    }
  }, [recruiterCompany, reset]);

  const onSubmit = async (values) => {
    try {
      if (companyId) {
        // Update existing company
        await updateCompany({ id: companyId, ...values }).unwrap();
        toast({
          title: "Company Updated",
          description: "Company details have been saved successfully.",
          variant: "success",
        });
      } else {
        // Create new company and link to recruiter profile
        const created = await createCompany(values).unwrap();
        await updateRecruiterProfile({ company: created._id }).unwrap();
        toast({
          title: "Company Created",
          description: "Your company profile is set up and linked to your recruiter account.",
          variant: "success",
        });
      }
      refetchProfile();
    } catch (err) {
      toast({
        title: "Save Failed",
        description: err.data?.message || "Failed to save company information.",
        variant: "destructive",
      });
    }
  };

  if (isProfileLoading) {
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
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Company Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {companyId
            ? "Manage public branding, headquarters, and description for your organization."
            : "Set up your company profile to start publishing job listings and discovering talent."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            This information is showcased on all job postings created by your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="name">
                  Company Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="e.g. Acme Technologies Inc."
                  error={Boolean(errors.name)}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="industry">
                  Industry / Sector
                </label>
                <Input
                  id="industry"
                  placeholder="e.g. Fintech, Healthcare, Cloud Software"
                  {...register("industry")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="companySize">
                  Company Size
                </label>
                <Select id="companySize" {...register("companySize")}>
                  {companySizes.map((size) => (
                    <option key={size} value={size}>
                      {size} employees
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="headquarters">
                  Headquarters
                </label>
                <Input
                  id="headquarters"
                  placeholder="e.g. Dhaka, Bangladesh or New York, NY"
                  {...register("headquarters")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="website">
                  Website URL
                </label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  error={Boolean(errors.website)}
                  {...register("website")}
                />
                {errors.website && (
                  <p className="text-xs text-destructive">{errors.website.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="logo">
                  Logo Image URL
                </label>
                <Input
                  id="logo"
                  type="url"
                  placeholder="https://.../logo.png"
                  error={Boolean(errors.logo)}
                  {...register("logo")}
                />
              </div>
            </div>

            {logoUrl && (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                <img
                  src={logoUrl}
                  alt="Company Logo Preview"
                  className="w-12 h-12 rounded-lg object-contain border bg-white p-1"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="text-xs text-muted-foreground">Logo preview</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="description">
                Company Description & Mission
              </label>
              <Textarea
                id="description"
                rows={5}
                placeholder="Tell applicants about your company culture, technology stack, and vision..."
                {...register("description")}
              />
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" size="lg" isLoading={isCreating || isUpdating}>
                {companyId ? "Save Company Changes" : "Create Company Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

