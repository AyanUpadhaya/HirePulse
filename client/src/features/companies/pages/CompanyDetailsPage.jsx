import React from "react";
import { useParams, Link } from "react-router-dom";
import { useGetCompanyByIdQuery } from "../api";
import { JobCard } from "@/features/jobs/components/JobCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Building2, Globe, MapPin, Users, ArrowLeft, Briefcase } from "lucide-react";

export function CompanyDetailsPage() {
  const { companyId } = useParams();
  const { data, isLoading, error } = useGetCompanyByIdQuery(companyId);

  if (isLoading) {
    return (
      <div className="container py-8 max-w-5xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error || !data?.company) {
    return (
      <div className="container py-16 text-center max-w-md">
        <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
        <p className="text-muted-foreground text-sm mb-6">
          The company you are looking for does not exist or has been removed.
        </p>
        <Link to="/companies">
          <Button variant="default">Back to Directory</Button>
        </Link>
      </div>
    );
  }

  const { company, jobs = [] } = data;

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/companies"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Companies</span>
        </Link>
      </div>

      {/* Company Header Card */}
      <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.name}
                className="w-20 h-20 rounded-2xl object-contain border bg-white p-2 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0">
                <Building2 className="w-10 h-10" />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {company.name}
              </h1>
              {company.industry && (
                <p className="text-sm font-medium text-primary mt-1">{company.industry}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                {company.headquarters && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {company.headquarters}
                  </span>
                )}
                {company.companySize && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {company.companySize} employees
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {company.description && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold text-foreground mb-2">About {company.name}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {company.description}
            </p>
          </div>
        )}
      </div>

      {/* Open Positions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <span>Open Positions ({jobs.length})</span>
          </h2>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            title="No open positions currently"
            description={`${company.name} currently does not have any active job openings posted.`}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={{
                  ...job,
                  company, // Ensure populated company info is available to JobCard
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

