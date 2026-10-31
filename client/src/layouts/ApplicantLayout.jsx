import React, { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  FileText,
  Sparkles,
  Search,
  MessageSquare,
  Bell,
  Briefcase,
  Menu,
  X,
} from "lucide-react";
import { UserNav } from "@/components/shared/UserNav";
import { NotificationBell } from "@/components/shared/NotificationBell";

export function ApplicantLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", to: "/applicant/dashboard", icon: LayoutDashboard },
    { label: "My Profile", to: "/applicant/profile", icon: User },
    { label: "Applications", to: "/applicant/applications", icon: FileText },
    { label: "Recommendations", to: "/applicant/recommendations", icon: Sparkles },
    { label: "Find Jobs", to: "/jobs", icon: Search },
    { label: "Messages", to: "/messages", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/20 text-foreground">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/applicant/dashboard" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span>Hire<span className="text-primary">Pulse</span></span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  Applicant
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <UserNav />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b bg-card px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <Link
              to="/notifications"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </Link>
          </div>
        )}
      </header>

      {/* Main content body */}
      <main className="flex-1 container py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}

