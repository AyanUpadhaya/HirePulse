import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Briefcase, DollarSign, Calendar, Building2 } from "lucide-react";
import { formatSalaryRange, formatDate } from "@/lib/utils";

export function JobCard({ job }) {
  if (!job) return null;

  const companyName = job.company?.name || "Company";
  const categoryName = job.category?.name || "General";
  const hasSalary = job.salaryMin != null || job.salaryMax != null;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-muted flex flex-col justify-between p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            {job.company?.logo ? (
              <img
                src={job.company.logo}
                alt={companyName}
                className="w-12 h-12 rounded-lg object-contain border bg-white p-1 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
            )}
            <div>
              <Link
                to={`/jobs/${job._id}`}
                className="font-semibold text-lg text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {job.title}
              </Link>
              {job.company?._id ? (
                <Link
                  to={`/companies/${job.company._id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {companyName}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">{companyName}</span>
              )}
            </div>
          </div>

          <Badge variant="outline" className="shrink-0 text-xs capitalize">
            {categoryName}
          </Badge>
        </div>

        {/* Badges / Metadata row */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-muted-foreground">
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{job.location}</span>
            </div>
          )}

          <div className="flex items-center gap-1 capitalize">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{job.employmentType?.replace("_", " ") || "Full-time"}</span>
          </div>

          {job.workMode && (
            <Badge variant="secondary" className="text-[11px] font-normal capitalize py-0 px-2">
              {job.workMode}
            </Badge>
          )}

          {hasSalary && (
            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <DollarSign className="w-3.5 h-3.5" />
              <span>
                {formatSalaryRange(job)}
              </span>
            </div>
          )}
        </div>

        {/* Required skills */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {job.requiredSkills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="inline-block bg-muted text-muted-foreground text-[11px] px-2 py-0.5 rounded-md"
              >
                {skill}
              </span>
            ))}
            {job.requiredSkills.length > 4 && (
              <span className="text-[11px] text-muted-foreground self-center">
                +{job.requiredSkills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t mt-4 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {job.applicationDeadline
              ? `Deadline: ${formatDate(job.applicationDeadline)}`
              : `Posted ${formatDate(job.createdAt)}`}
          </span>
        </div>

        <Link
          to={`/jobs/${job._id}`}
          className="text-primary hover:text-primary/80 font-medium text-xs"
        >
          View Details →
        </Link>
      </div>
    </Card>
  );
}
