import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  Bell,
  CheckCheck,
  Briefcase,
  FileText,
  MessageSquare,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export function NotificationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error, refetch } = useGetNotificationsQuery({
    page,
    limit,
    unread: unreadOnly ? true : undefined,
  });

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  const notifications = data?.items || [];
  const unreadCount = data?.unread || 0;
  const totalPages = data?.pages || 1;

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markRead({ id: notif._id, isRead: true }).unwrap();
      } catch {
        // ignore
      }
    }

    // In-app navigation by resource
    if (notif.resourceType === "conversation" && notif.resourceId) {
      navigate(`/messages/${notif.resourceId}`);
    } else if (notif.resourceType === "job" && notif.resourceId) {
      navigate(`/jobs/${notif.resourceId}`);
    } else if (notif.resourceType === "application") {
      navigate(`/applicant/applications`);
    } else if (notif.type === "job_recommendation") {
      navigate("/applicant/recommendations");
    } else if (notif.type === "candidate_recommendation") {
      navigate("/recruiter/candidates");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      toast({
        title: "All Marked as Read",
        description: "All unread notifications have been marked as read.",
        variant: "success",
      });
      refetch();
    } catch {
      toast({
        title: "Action failed",
        description: "Could not mark all notifications as read.",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "application_submitted":
      case "application_status_changed":
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case "new_message":
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case "job_recommendation":
      case "candidate_recommendation":
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="w-7 h-7 text-primary" />
            <span>Notifications</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay informed on application progress, match insights, and conversation alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={unreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setUnreadOnly(!unreadOnly);
              setPage(1);
            }}
          >
            {unreadOnly ? "Showing Unread" : "Filter Unread"}
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              isLoading={isMarkingAll}
              className="gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 border border-destructive/30 rounded-xl bg-destructive/5 text-center">
          <p className="text-destructive font-medium mb-3">Failed to load notifications.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description={
            unreadOnly
              ? "You have caught up with all your unread notifications."
              : "You have no notifications right now."
          }
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                n.isRead
                  ? "bg-card hover:bg-muted/40 text-muted-foreground"
                  : "bg-primary/5 border-primary/20 hover:bg-primary/10 text-foreground shadow-sm"
              }`}
            >
              <div className="p-2 rounded-lg bg-card border shrink-0">
                {getNotificationIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-semibold truncate ${!n.isRead ? "text-foreground" : ""}`}>
                    {n.title || "Notification"}
                  </h4>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {!n.isRead && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

