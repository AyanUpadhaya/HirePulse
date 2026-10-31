import React from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useGetNotificationsQuery } from "@/features/notifications/api";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/features/auth/authSlice";

export function NotificationBell() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { data } = useGetNotificationsQuery(
    { unread: true, limit: 1 },
    { skip: !isAuthenticated, pollingInterval: 30000 }
  );

  const unreadCount = data?.unread || 0;

  if (!isAuthenticated) return null;

  return (
    <Link
      to="/notifications"
      className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
      title="Notifications"
      aria-label={`Notifications, ${unreadCount} unread`}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white leading-none animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

