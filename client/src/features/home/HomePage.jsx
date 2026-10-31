import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetJobsQuery } from "@/features/jobs/api";
import { useGetCategoriesQuery } from "@/features/categories/api";
import { JobCard } from "@/features/jobs/components/JobCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Search,
  Sparkles,
  Briefcase,
  Building,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: jobsData, isLoading: jobsLoading } = useGetJobsQuery({ limit: 4 });

  const categories = categoriesData || [];
  const jobs = jobsData?.items || [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/jobs");
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16 sm:py-24 border-b">
        <div className="container relative z-10 max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Talent Marketplace with AI Insights</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Find the role where you'll <span className="text-primary">thrive</span>.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover verified jobs, receive instant AI-powered application match insights, and connect directly with forward-thinking employers.
          </p>

          {/* Quick Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5 p-2 bg-card border rounded-2xl shadow-lg"
          >
            <div className="flex-1 relative flex items-center">
              <Search className="w-5 h-5 text-muted-foreground absolute left-3.5" />
              <Input
                type="text"
                placeholder="Job title, skills (e.g. Node.js, React, Product Manager)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 font-semibold text-base">
              Find Jobs
            </Button>
          </form>

          {/* Highlights */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Employers
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" /> AI Skill Gap Analysis
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" /> Direct Recruiter Chat
            </span>
          </div>
        </div>
      </section>

      {/* Explore Categories */}
      <section className="container max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Explore by Category</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse positions across high-growth domains
            </p>
          </div>
          <Link
            to="/jobs"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View all categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat._id}
                to={`/jobs?category=${cat.slug || cat._id}`}
                className="group p-5 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {cat.description}
                    </p>
                  )}
                </div>
                <div className="mt-4 text-xs font-medium text-muted-foreground group-hover:text-primary">
                  {cat.publishedJobsCount || 0} active jobs →
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured / Recent Jobs */}
      <section className="container max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Recent Opportunities</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Latest job openings posted by innovative companies
            </p>
          </div>
          <Link
            to="/jobs"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Browse all jobs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center border rounded-xl bg-card">
            <p className="text-muted-foreground text-sm">No jobs posted recently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Recruiter Callout Banner */}
      <section className="container max-w-7xl">
        <div className="rounded-3xl bg-gradient-to-r from-primary/90 via-indigo-700 to-indigo-900 p-8 sm:p-14 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
              For Employers & Hiring Teams
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Scale your team faster with AI-assisted job postings.
            </h2>
            <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
              Generate compelling job descriptions in seconds, manage applicants across customizable hiring stages, and discover top-scoring candidate recommendations.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="font-semibold text-primary">
                  Start Hiring Today
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white/30 hover:bg-white/10"
                >
                  Recruiter Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

