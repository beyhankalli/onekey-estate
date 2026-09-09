"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Contact,
  Home,
  Users,
  Star,
  CalendarOff,
  LogOut,
  CalendarCheck,
  MessageSquare,
  MessageCircle,
  BarChart3,
  Settings,
  Bell,
  CheckCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [updatingNotificationId, setUpdatingNotificationId] = useState<
    string | null
  >(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const notificationRef = useRef<HTMLDivElement | null>(null);

  const menu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
    },
    {
      name: "Customers",
      icon: Contact,
      href: "/admin/customers",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: "/admin/whatsapp",
    },
    {
      name: "Lead Tracking",
      icon: Users,
      href: "/admin/leads",
    },
    {
      name: "Properties",
      icon: Home,
      href: "/admin/properties",
    },
    {
      name: "Agents",
      icon: Users,
      href: "/admin/agents",
    },
    {
      name: "Bookings",
      icon: CalendarCheck,
      href: "/admin/bookings",
    },
    {
      name: "Blocked Dates",
      icon: CalendarOff,
      href: "/admin/blocked-dates",
    },
    {
      name: "Messages",
      icon: MessageSquare,
      href: "/admin/messages",
    },
    {
      name: "Reviews",
      icon: Star,
      href: "/admin/reviews",
    },
    {
      name: "Reports",
      icon: BarChart3,
      href: "/admin/reports",
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/admin/settings",
    },
  ];

  const unreadCount = useMemo(
    () =>
      notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);

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
        .limit(50);

      if (error) {
        console.error("Error fetching admin notifications:", error);
        return;
      }

      setNotifications((data || []) as Notification[]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (pathname === "/admin/login") return;

    fetchNotifications();

    // Master v2 - Madde 28: Polling (setInterval) iptal edildi, Supabase Realtime entegre edildi.
    let userId = "";
    
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const channel = supabase
        .channel('admin_notifications_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_notifications',
            filter: `recipient_user_id=eq.${userId}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications((current) => [newNotification, ...current]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'admin_notifications',
            filter: `recipient_user_id=eq.${userId}`
          },
          (payload) => {
            const updatedNotification = payload.new as Notification;
            setNotifications((current) =>
              current.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            );
          }
        )
        .subscribe();
        
      return channel;
    };

    const channelPromise = setupRealtime();

    return () => {
      channelPromise.then((channel) => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, [pathname, supabase]);

  useEffect(() => {
    if (pathname === "/admin/login") return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const markNotificationAsRead = async (
    notification: Notification,
    navigate = false
  ) => {
    if (notification.is_read) {
      if (navigate && notification.href) {
        router.push(notification.href);
        setNotificationOpen(false);
      }

      return;
    }

    setUpdatingNotificationId(notification.id);

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

      if (navigate && notification.href) {
        setNotificationOpen(false);
        router.push(notification.href);
      }
    } finally {
      setUpdatingNotificationId(null);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.is_read
    );

    if (unreadNotifications.length === 0) return;

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

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const difference = now.getTime() - date.getTime();
    const minutes = Math.floor(difference / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-[#1c3053] text-white flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-6 border-b border-white/10 mb-4">
          <Link
            href="/admin"
            className="block"
            aria-label="OneKey Admin Dashboard"
          >
            <Image
              src="/onekey-logo.png"
              alt="OneKey Estate Agency"
              width={176}
              height={84}
              sizes="176px"
              className="w-44 h-auto brightness-0 invert"
            />
          </Link>

          <p className="text-xs text-gray-400 mt-3 font-light">
            Management Portal
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menu.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  isActive
                    ? "bg-[#ae884e] text-white shadow-md"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-300 hover:bg-red-500/20 transition-all font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-end px-8 shrink-0">
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() =>
                setNotificationOpen((current) => !current)
              }
              className="relative w-11 h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-600"
              aria-label="Notifications"
              aria-expanded={notificationOpen}
            >
              <Bell className="w-5 h-5" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-14 w-[420px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Notifications
                    </h2>

                    <p className="text-xs text-gray-500 mt-0.5">
                      {unreadCount === 0
                        ? "You're all caught up."
                        : `${unreadCount} unread ${
                            unreadCount === 1
                              ? "notification"
                              : "notifications"
                          }`}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      disabled={markingAllRead}
                      className="text-xs font-medium text-[#ae884e] hover:text-[#8d6d3f] disabled:opacity-50 flex items-center gap-1"
                    >
                      {markingAllRead ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mb-3" />
                      <p className="text-sm">
                        Loading notifications...
                      </p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-12 px-6 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-3">
                        <Bell className="w-5 h-5 text-gray-300" />
                      </div>

                      <p className="text-sm font-medium text-gray-700">
                        No notifications
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        New activity will appear here.
                      </p>
                    </div>
                  ) : (
                    notifications
                      .slice(0, 10)
                      .map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() =>
                            markNotificationAsRead(
                              notification,
                              true
                            )
                          }
                          disabled={
                            updatingNotificationId ===
                            notification.id
                          }
                          className={`w-full text-left px-5 py-4 border-b border-gray-50 transition-colors ${
                            notification.is_read
                              ? "bg-white hover:bg-gray-50"
                              : "bg-blue-50/40 hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${getNotificationIconContainer(
                                notification.type
                              )}`}
                            >
                              {updatingNotificationId ===
                              notification.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                getNotificationIcon(
                                  notification.type
                                )
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <p
                                  className={`text-sm ${
                                    notification.is_read
                                      ? "font-medium text-gray-800"
                                      : "font-semibold text-gray-900"
                                  }`}
                                >
                                  {notification.title}
                                </p>

                                {!notification.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                                )}
                              </div>

                              {notification.message && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                              )}

                              <p className="text-[11px] text-gray-400 mt-2">
                                {formatNotificationTime(
                                  notification.created_at
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                  )}
                </div>

                <div className="border-t border-gray-100 p-3">
                  <Link
                    href="/admin/notifications"
                    onClick={() =>
                      setNotificationOpen(false)
                    }
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                  >
                    View all notifications
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Master v2 - Madde 30: Nested <main> hatası çözüldü (Burası div'e çevrildi) */}
        <div className="flex-1 min-w-0 overflow-y-auto p-8 bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
}