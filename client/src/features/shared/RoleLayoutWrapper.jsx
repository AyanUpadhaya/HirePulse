import React from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/auth/authSlice";
import { ApplicantLayout } from "@/layouts/ApplicantLayout";
import { RecruiterLayout } from "@/layouts/RecruiterLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PublicLayout } from "@/layouts/PublicLayout";

export function RoleLayoutWrapper() {
  const user = useSelector(selectCurrentUser);

  if (user?.role === "applicant") {
    return <ApplicantLayout />;
  }
  if (user?.role === "recruiter") {
    return <RecruiterLayout />;
  }
  if (user?.role === "admin") {
    return <AdminLayout />;
  }
  return <PublicLayout />;
}

