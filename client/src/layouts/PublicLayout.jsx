import React, { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated } from "@/features/auth/authSlice";
import { Briefcase, Building2, MessageSquare, Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UserNav } from "@/components/shared/UserNav";
import { NotificationBell } from "@/components/shared/NotificationBell";

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const getDashboardPath = () => {
    if (user?.role === "applicant") return "/applicant/dashboard";
    if (user?.role === "recruiter") return "/recruiter/dashboard";
    if (user?.role === "admin") return "/admin/users";
    return "/";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <span>Hire<span className="text-primary">Pulse</span></span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <NavLink
                to="/jobs"
                className={({ isActive }) =>
                  `transition-colors hover:text-primary ${
                    isActive ? "text-primary font-semibold" : "text-muted-foreground"
                  }`
                }
              >
                Find Jobs
              </NavLink>
              <NavLink
                to="/companies"
                className={({ isActive }) =>
                  `transition-colors hover:text-primary ${
                    isActive ? "text-primary font-semibold" : "text-muted-foreground"
                  }`
                }
              >
                Companies
              </NavLink>

              {isAuthenticated && (
                <>
                  <NavLink
                    to={getDashboardPath()}
                    className={({ isActive }) =>
                      `transition-colors hover:text-primary ${
                        isActive ? "text-primary font-semibold" : "text-muted-foreground"
                      }`
                    }
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/messages"
                    className={({ isActive }) =>
                      `transition-colors hover:text-primary flex items-center gap-1.5 ${
                        isActive ? "text-primary font-semibold" : "text-muted-foreground"
                      }`
                    }
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Messages</span>
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationBell />
                <UserNav />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Get Started</span>
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b bg-card px-4 pt-2 pb-6 space-y-3">
            <Link
              to="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-foreground hover:text-primary"
            >
              Find Jobs
            </Link>
            <Link
              to="/companies"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-foreground hover:text-primary"
            >
              Companies
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-base font-medium text-foreground hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  to="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-base font-medium text-foreground hover:text-primary"
                >
                  Messages
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-base font-medium text-foreground hover:text-primary"
                >
                  Notifications
                </Link>
              </>
            ) : (
              <div className="pt-4 border-t flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40 py-12 text-sm text-muted-foreground">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-lg text-foreground">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Briefcase className="w-4 h-4" />
              </div>
              <span>HirePulse</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Modern recruitment marketplace bridging ambitious professionals and forward-thinking companies with AI-guided precision.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">For Job Seekers</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/jobs" className="hover:text-foreground">Browse All Jobs</Link></li>
              <li><Link to="/companies" className="hover:text-foreground">Company Directory</Link></li>
              <li><Link to="/register" className="hover:text-foreground">Create Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">For Employers</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/register" className="hover:text-foreground">Post a Job</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Recruiter Portal</Link></li>
              <li><Link to="/register" className="hover:text-foreground">AI Description Assistant</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-muted-foreground">Express API + React Vite</span></li>
              <li><span className="text-muted-foreground">Built with RTK Query & Tailwind</span></li>
              <li><span className="text-muted-foreground">Privacy-focused AI integration</span></li>
            </ul>
          </div>
        </div>

        <div className="container mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} HirePulse. All rights reserved.</p>
          <p className="text-muted-foreground">AI insights provide decision support and do not guarantee hiring outcomes.</p>
        </div>
      </footer>
    </div>
  );
}

