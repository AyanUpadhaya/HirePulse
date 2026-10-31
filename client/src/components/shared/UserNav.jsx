import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/api";
import { getInitials } from "@/lib/utils";
import { LogOut, User, LayoutDashboard, Briefcase, Building, Shield, ChevronDown, Settings } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

export function UserNav() {
  const user = useSelector(selectCurrentUser);
  const [logout, { isLoading }] = useLogoutMutation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      navigate("/");
    } catch {
      toast({
        title: "Logged out",
        description: "Session closed.",
      });
      navigate("/");
    }
  };

  const getDashboardLink = () => {
    if (user.role === "applicant") return "/applicant/dashboard";
    if (user.role === "recruiter") return "/recruiter/dashboard";
    if (user.role === "admin") return "/admin/users";
    return "/";
  };

  const getRoleBadgeVariant = (role) => {
    if (role === "admin") return "purple";
    if (role === "recruiter") return "info";
    return "success";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-muted/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover border"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center border border-primary/20">
            {getInitials(user.name)}
          </div>
        )}
        <span className="hidden md:inline-block text-sm font-medium text-foreground max-w-[120px] truncate">
          {user.name}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:inline-block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-card p-1 shadow-lg z-50 text-card-foreground animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <div className="mt-1.5">
              <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize text-[10px] py-0">
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="py-1">
            <Link
              to={getDashboardLink()}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
              <span>Dashboard</span>
            </Link>

            {user.role === "applicant" && (
              <Link
                to="/applicant/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                <span>My Profile</span>
              </Link>
            )}

            {user.role === "recruiter" && (
              <Link
                to="/recruiter/company"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground transition-colors"
              >
                <Building className="w-4 h-4 text-muted-foreground" />
                <span>Company Profile</span>
              </Link>
            )}

            {user.role === "admin" && (
              <Link
                to="/admin/users"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground transition-colors"
              >
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          <div className="border-t pt-1">
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground transition-colors"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span>Account settings</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
