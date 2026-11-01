import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { ApplicantLayout } from "@/layouts/ApplicantLayout";
import { RecruiterLayout } from "@/layouts/RecruiterLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { RoleLayoutWrapper } from "@/features/shared/RoleLayoutWrapper";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

// Public Pages
import { HomePage } from "@/features/home/HomePage";
import { JobListPage } from "@/features/jobs/pages/JobListPage";
import { JobDetailsPage } from "@/features/jobs/pages/JobDetailsPage";
import { CompanyListPage } from "@/features/companies/pages/CompanyListPage";
import { CompanyDetailsPage } from "@/features/companies/pages/CompanyDetailsPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { NotFoundPage } from "@/components/shared/NotFoundPage";

// Applicant Pages
import { ApplicantDashboardPage } from "@/features/dashboard/ApplicantDashboardPage";
import { ApplicantProfilePage } from "@/features/profiles/pages/ApplicantProfilePage";
import { RecruiterApplicantProfilePage } from "@/features/profiles/pages/RecruiterApplicantProfilePage";
import { ApplicantApplicationsPage } from "@/features/applications/pages/ApplicantApplicationsPage";
import { ApplicantRecommendationsPage } from "@/features/recommendations/pages/ApplicantRecommendationsPage";

// Recruiter Pages
import { RecruiterDashboardPage } from "@/features/dashboard/RecruiterDashboardPage";
import { RecruiterCompanyPage } from "@/features/recruiter/pages/RecruiterCompanyPage";
import { RecruiterJobsPage } from "@/features/recruiter/pages/RecruiterJobsPage";
import { RecruiterJobFormPage } from "@/features/recruiter/pages/RecruiterJobFormPage";
import { RecruiterJobApplicantsPage } from "@/features/recruiter/pages/RecruiterJobApplicantsPage";
import { RecruiterCandidatesPage } from "@/features/recruiter/pages/RecruiterCandidatesPage";

// Admin Pages
import { AdminUsersPage } from "@/features/admin/pages/AdminUsersPage";
import { AdminCategoriesPage } from "@/features/admin/pages/AdminCategoriesPage";
import { AdminJobsPage } from "@/features/admin/pages/AdminJobsPage";
import { AdminRecommendationsPage } from "@/features/admin/pages/AdminRecommendationsPage";

// Shared Authenticated Pages
import { MessagesPage } from "@/features/messaging/pages/MessagesPage";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";

export const router = createBrowserRouter([
  // Public Routes
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "jobs", element: <JobListPage /> },
      { path: "jobs/:jobId", element: <JobDetailsPage /> },
      { path: "companies", element: <CompanyListPage /> },
      { path: "companies/:companyId", element: <CompanyDetailsPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
    ],
  },

  // Applicant Routes
  {
    path: "/applicant",
    element: <ProtectedRoute allowedRoles={["applicant"]} />,
    children: [
      {
        element: <ApplicantLayout />,
        children: [
          { index: true, element: <Navigate to="/applicant/dashboard" replace /> },
          { path: "dashboard", element: <ApplicantDashboardPage /> },
          { path: "profile", element: <ApplicantProfilePage /> },
          { path: "applications", element: <ApplicantApplicationsPage /> },
          { path: "recommendations", element: <ApplicantRecommendationsPage /> },
        ],
      },
    ],
  },

  // Recruiter Routes
  {
    path: "/recruiter",
    element: <ProtectedRoute allowedRoles={["recruiter", "admin"]} />,
    children: [
      {
        element: <RecruiterLayout />,
        children: [
          { index: true, element: <Navigate to="/recruiter/dashboard" replace /> },
          { path: "dashboard", element: <RecruiterDashboardPage /> },
          { path: "company", element: <RecruiterCompanyPage /> },
          { path: "jobs", element: <RecruiterJobsPage /> },
          { path: "jobs/new", element: <RecruiterJobFormPage /> },
          { path: "jobs/:jobId/edit", element: <RecruiterJobFormPage /> },
          { path: "jobs/:jobId/applicants", element: <RecruiterJobApplicantsPage /> },
          { path: "candidates", element: <RecruiterCandidatesPage /> },
        ],
      },
    ],
  },

  // Shareable applicant profiles are visible to signed-in recruiters and applicants.
  {
    element: <ProtectedRoute allowedRoles={["recruiter", "applicant"]} />,
    children: [
      {
        element: <RoleLayoutWrapper />,
        children: [
          { path: "applicants/:applicantId", element: <RecruiterApplicantProfilePage /> },
        ],
      },
    ],
  },

  // Admin Routes
  {
    path: "/admin",
    element: <ProtectedRoute allowedRoles={["admin"]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/users" replace /> },
          { path: "users", element: <AdminUsersPage /> },
          { path: "categories", element: <AdminCategoriesPage /> },
          { path: "jobs", element: <AdminJobsPage /> },
          { path: "recommendations", element: <AdminRecommendationsPage /> },
        ],
      },
    ],
  },

  // Shared Authenticated Routes (RoleLayoutWrapper provides role-specific shell)
  {
    element: <ProtectedRoute allowedRoles={["applicant", "recruiter", "admin"]} />,
    children: [
      {
        element: <RoleLayoutWrapper />,
        children: [
          { path: "messages", element: <MessagesPage /> },
          { path: "messages/:conversationId", element: <MessagesPage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },

  // Catch-all 404
  {
    path: "*",
    element: <PublicLayout />,
    children: [{ path: "*", element: <NotFoundPage /> }],
  },
]);
