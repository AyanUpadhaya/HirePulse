import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Briefcase, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl mb-4">
        <Briefcase className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        404 - Page Not Found
      </h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-sm">
        The page you are looking for doesn't exist, has been removed, or has moved to a new destination.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/">
          <Button variant="default" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
        <Link to="/jobs">
          <Button variant="outline">Browse Jobs</Button>
        </Link>
      </div>
    </div>
  );
}

