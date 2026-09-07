"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  Users,
  Star,
  CalendarOff,
  LogOut,
  CalendarCheck,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const menu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
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
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-[#1c3053] text-white flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-6 border-b border-white/10 mb-4">
          <Link
            href="/admin"
            className="block"
            aria-label="OneKey Admin Dashboard"
          >
            <img
              src="/onekey-logo.png"
              alt="OneKey Estate Agency"
              className="w-44 h-auto brightness-0 invert"
            />
          </Link>

          <p className="text-xs text-gray-400 mt-3 font-light">
            Management Portal
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
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

      <main className="flex-1 min-w-0 overflow-y-auto p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}