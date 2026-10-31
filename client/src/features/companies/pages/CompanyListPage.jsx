import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGetCompaniesQuery } from "../api";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Building2, Search, MapPin, Users, Globe, ExternalLink } from "lucide-react";

export function CompanyListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: companies, isLoading, error, refetch } = useGetCompaniesQuery();

  const filteredCompanies = (companies || []).filter((comp) => {
    const term = searchTerm.toLowerCase();
    return (
      comp.name?.toLowerCase().includes(term) ||
      comp.industry?.toLowerCase().includes(term) ||
      comp.headquarters?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Top Employers
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Learn about companies hiring on HirePulse and explore their open positions.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-md relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by company name, industry, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 border border-destructive/30 rounded-xl bg-destructive/5 text-center">
          <p className="text-destructive font-medium mb-3">Failed to load companies.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies found"
          description={
            searchTerm
              ? `No companies matched "${searchTerm}". Try a different keyword.`
              : "No companies have registered yet."
          }
          actionLabel={searchTerm ? "Clear Search" : undefined}
          onAction={searchTerm ? () => setSearchTerm("") : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((comp) => (
            <Card key={comp._id} className="hover:shadow-md transition-shadow flex flex-col justify-between p-6">
              <div>
                <div className="flex items-start gap-4 mb-4">
                  {comp.logo ? (
                    <img
                      src={comp.logo}
                      alt={comp.name}
                      className="w-14 h-14 rounded-xl object-contain border bg-white p-1.5 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                      <Building2 className="w-7 h-7" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/companies/${comp._id}`}
                      className="font-bold text-lg text-foreground hover:text-primary transition-colors truncate block"
                    >
                      {comp.name}
                    </Link>
                    {comp.industry && (
                      <span className="text-xs text-muted-foreground block truncate">
                        {comp.industry}
                      </span>
                    )}
                  </div>
                </div>

                {comp.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                    {comp.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                  {comp.headquarters && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{comp.headquarters}</span>
                    </div>
                  )}
                  {comp.companySize && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{comp.companySize} employees</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                {comp.website ? (
                  <a
                    href={comp.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                ) : (
                  <span />
                )}

                <Link to={`/companies/${comp._id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    View Jobs & Profile →
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

