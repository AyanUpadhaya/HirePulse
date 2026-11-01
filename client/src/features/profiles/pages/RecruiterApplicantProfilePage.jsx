import React from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Briefcase, GraduationCap, MapPin, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetApplicantProfileByIdQuery } from "../api";
import { getInitials } from "@/lib/utils";
import { selectCurrentUser } from "@/features/auth/authSlice";

const formatDate = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short" }).format(new Date(date));
};

export function RecruiterApplicantProfilePage() {
  const { applicantId } = useParams();
  const currentUser = useSelector(selectCurrentUser);
  const backTo = currentUser?.role === "applicant" ? "/applicant/dashboard" : "/recruiter/candidates";
  const backLabel = currentUser?.role === "applicant" ? "Back to dashboard" : "Back to candidates";
  const { data: profile, isLoading, error, refetch } = useGetApplicantProfileByIdQuery(applicantId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !profile) {
    const unavailable = error?.status === 404;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to={backTo} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <h1 className="text-xl font-semibold">
              {unavailable ? "Profile unavailable" : "Could not load profile"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {unavailable
                ? "This applicant profile is not available for recruiter viewing."
                : "Please check your connection and try again."}
            </p>
            {!unavailable && (
              <Button className="mt-5" variant="outline" onClick={refetch}>Retry</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, skills = [], experience = [], education = [] } = profile;
  const avatar = user?.avatar;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to={backTo} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          {avatar ? (
            <img src={avatar} alt="" className="h-20 w-20 rounded-full border object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {getInitials(user?.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{user?.name || "Applicant"}</h1>
            {profile.headline && <p className="mt-1 text-lg text-muted-foreground">{profile.headline}</p>}
            {profile.location && (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {profile.location}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {profile.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" /> About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{profile.summary}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Skills</CardTitle>
          <CardDescription>Skills the applicant has added to their discoverable profile.</CardDescription>
        </CardHeader>
        <CardContent>
          {skills.length ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => <Badge key={skill} variant="secondary" className="capitalize">{skill}</Badge>)}
            </div>
          ) : <p className="text-sm text-muted-foreground">No skills added.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {experience.length ? experience.map((item, index) => (
            <div key={item._id || `${item.company}-${item.title}-${index}`} className="border-l-2 border-primary/20 pl-4">
              <h2 className="font-semibold">{item.title || "Experience"}</h2>
              {item.company && <p className="text-sm text-muted-foreground">{item.company}</p>}
              {(item.startDate || item.endDate || item.current) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(item.startDate)} – {item.current ? "Present" : formatDate(item.endDate)}
                </p>
              )}
              {item.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.description}</p>}
            </div>
          )) : <p className="text-sm text-muted-foreground">No experience added.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Education</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {education.length ? education.map((item, index) => (
            <div key={item._id || `${item.institution}-${item.qualification}-${index}`} className="border-l-2 border-primary/20 pl-4">
              <h2 className="font-semibold">{item.qualification || "Education"}</h2>
              {item.institution && <p className="text-sm text-muted-foreground">{item.institution}</p>}
              {item.fieldOfStudy && <p className="mt-1 text-sm">{item.fieldOfStudy}</p>}
              {(item.startDate || item.endDate) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(item.startDate)}{item.endDate ? ` – ${formatDate(item.endDate)}` : ""}
                </p>
              )}
            </div>
          )) : <p className="text-sm text-muted-foreground">No education added.</p>}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Applicant profile shared for recruiter review. Contact details and resume are not included on this page.
      </p>
    </div>
  );
}
