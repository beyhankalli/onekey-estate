"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  CalendarCheck,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
  Trash2,
} from "lucide-react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  href: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

export default function AdminNotificationsPage() {
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from("admin_notifications")
        .select(
          "id, type, title, message, href, related_id, is_read, created_at"
        )
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications((data || []) as Notification[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = window.setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const markAsRead = async (notification: Notification) => {
    if (notification.is_read) return;

    setUpdatingId(notification.id);

    try {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", notification.id);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    setMarkingAllRead(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("recipient_user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } finally {
      setMarkingAllRead(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setUpdatingId(notificationId);

    try {
      const { error } = await supabase
        .from("admin_notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error("Error deleting notification:", error);
        return;
      }

      setNotifications((current) =>
        current.filter((notification) => notification.id !== notificationId)
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type === "booking" || type === "booking_status") {
      return <CalendarCheck className="w-5 h-5" />;
    }

    if (
      type === "message" ||
      type === "contact" ||
      type === "customer_message"
    ) {
      return <MessageSquare className="w-5 h-5" />;
    }

    return <Bell className="w-5 h-5" />;
  };

  const getNotificationIconContainer = (type: string) => {
    if (type === "booking" || type === "booking_status") {
      return "bg-blue-50 text-blue-600";
    }

    if (
      type === "message" ||
      type === "contact" ||
      type === "customer_message"
    ) {
      return "bg-purple-50 text-purple-600";
    }

    return "bg-gray-100 text-gray-600";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Notifications
          </h1>
          <p className="text-gray-500 font-light mt-1">
            Review important activity across the OneKey management portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-sm">
            <span className="text-gray-500">Unread:</span>{" "}
            <span className="font-semibold text-gray-900">{unreadCount}</span>
          </div>

          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || markingAllRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c3053] text-white text-sm font-medium hover:bg-[#162743] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {markingAllRead ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Mark all read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin mb-3" />
            <p className="text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-gray-300" />
            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              No notifications
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              New bookings and messages will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 transition-colors ${
                  notification.is_read
                    ? "bg-white"
                    : "bg-blue-50/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${getNotificationIconContainer(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <h2
                        className={`text-sm ${
                          notification.is_read
                            ? "font-medium text-gray-800"
                            : "font-semibold text-gray-900"
                        }`}
                      >
                        {notification.title}
                      </h2>

                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      )}
                    </div>

                    {notification.message && (
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.message}
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(notification.created_at)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {notification.href && (
                        <Link
                          href={notification.href}
                          onClick={() => markAsRead(notification)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1c3053] text-white text-xs font-medium hover:bg-[#162743] transition-colors"
                        >
                          Open
                        </Link>
                      )}

                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification)}
                          disabled={updatingId === notification.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          {updatingId === notification.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Mark read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          deleteNotification(notification.id)
                        }
                        disabled={updatingId === notification.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}