import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetJobsQuery } from "../api";
import { useGetCategoriesQuery } from "@/features/categories/api";
import { JobCard } from "../components/JobCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Filter, X, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { employmentTypes, workModes } from "../schemas";

export function JobListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const employmentType = searchParams.get("employmentType") || "";
  const workMode = searchParams.get("workMode") || "";
  const location = searchParams.get("location") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 10;

  const [searchInput, setSearchInput] = useState(q);
  const [locationInput, setLocationInput] = useState(location);

  const { data: categoriesData } = useGetCategoriesQuery();
  const categories = categoriesData || [];

  const { data, isLoading, isFetching, error, refetch } = useGetJobsQuery({
    q: q || undefined,
    category: category || undefined,
    employmentType: employmentType || undefined,
    workMode: workMode || undefined,
    location: location || undefined,
    page,
    limit,
  });

  const jobs = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.pages || 1;

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    nextParams.set("page", "1"); // Reset to page 1 on filter change
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      nextParams.set("q", searchInput.trim());
    } else {
      nextParams.delete("q");
    }
    if (locationInput.trim()) {
      nextParams.set("location", locationInput.trim());
    } else {
      nextParams.delete("location");
    }
    nextParams.set("page", "1");
    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setSearchInput("");
    setLocationInput("");
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(q || category || employmentType || workMode || location);

  return (
    <div className="container py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Discover Opportunities
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Find your next career move with top employers and innovative startups.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-card border rounded-2xl p-4 sm:p-6 shadow-sm mb-8 space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Job title, keywords, or skills..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="sm:col-span-4">
            <Input
              type="text"
              placeholder="City, country, or remote..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" className="w-full">
              Search
            </Button>
          </div>
        </form>

        {/* Secondary filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
          <Select
            value={category}
            onChange={(e) => updateParam("category", e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.slug || cat._id}>
                {cat.name}
              </option>
            ))}
          </Select>

          <Select
            value={employmentType}
            onChange={(e) => updateParam("employmentType", e.target.value)}
          >
            <option value="">All Employment Types</option>
            {employmentTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>

          <Select
            value={workMode}
            onChange={(e) => updateParam("workMode", e.target.value)}
          >
            <option value="">All Work Modes</option>
            {workModes.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Active filters indicators */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="text-muted-foreground flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" />
              Active filters:
            </span>

            {q && (
              <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full">
                "{q}"
                <button onClick={() => { setSearchInput(""); updateParam("q", ""); }}>
                  <X className="w-3 h-3 hover:text-destructive" />
                </button>
              </span>
            )}

            {location && (
              <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full">
                Location: {location}
                <button onClick={() => { setLocationInput(""); updateParam("location", ""); }}>
                  <X className="w-3 h-3 hover:text-destructive" />
                </button>
              </span>
            )}

            {category && (
              <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full">
                Category
                <button onClick={() => updateParam("category", "")}>
                  <X className="w-3 h-3 hover:text-destructive" />
                </button>
              </span>
            )}

            {employmentType && (
              <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full capitalize">
                {employmentType.replace("_", " ")}
                <button onClick={() => updateParam("employmentType", "")}>
                  <X className="w-3 h-3 hover:text-destructive" />
                </button>
              </span>
            )}

            {workMode && (
              <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full capitalize">
                {workMode}
                <button onClick={() => updateParam("workMode", "")}>
                  <X className="w-3 h-3 hover:text-destructive" />
                </button>
              </span>
            )}

            <button
              onClick={clearFilters}
              className="text-primary hover:underline font-semibold ml-2"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{total}</span> jobs
          {isFetching && !isLoading && <span className="ml-2 animate-pulse text-xs text-primary">(updating...)</span>}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Failed to load jobs</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {error?.data?.message || "There was a problem reaching the jobs API."}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl border bg-card space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs found"
          description="We couldn't find any positions matching your search criteria. Try adjusting your filters or search keywords."
          actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(page - 1));
              setSearchParams(next);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(page + 1));
              setSearchParams(next);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

