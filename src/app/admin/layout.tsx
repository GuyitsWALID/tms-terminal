"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { id: "users", label: "Users & Team", icon: Users, href: "/admin/users" },
  { id: "complaints", label: "Complaints", icon: Flag, href: "/admin/complaints" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/admin/notifications" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
];

type SidebarProps = {
  collapsed: boolean;
  pathname: string;
  onCollapseToggle: () => void;
  onMobileClose: () => void;
};

function SidebarContent({ collapsed, pathname, onCollapseToggle, onMobileClose }: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-[var(--line-strong)] px-4 py-4",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        <Image src="/TMSLOGO.png" alt="TMS" width={32} height={32} className="h-8 w-8 shrink-0 rounded-md object-cover" />
        {!collapsed && (
          <div>
            <p className="font-rajdhani text-sm font-bold uppercase leading-none tracking-wide text-[var(--ink-primary)]">
              TMS Admin
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Control Panel</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 pt-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-[var(--surface-hover)] text-[var(--ink-primary)]"
                  : "text-[var(--ink-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={15} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="shrink-0 border-t border-[var(--line-strong)] p-2 space-y-0.5">
        <button
          onClick={onCollapseToggle}
          className={cn(
            "hidden w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)] xl:flex",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Collapse</span></>}
        </button>
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Back to site" : undefined}
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span>Back to Site</span>}
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Skip layout on the login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleCollapseToggle = () => setCollapsed((c) => !c);
  const handleMobileClose = () => setMobileOpen(false);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-main)", color: "var(--ink-primary)" }}
      data-theme="dark"
    >
      {/* Mobile top bar */}
      <header className="flex h-14 items-center justify-between border-b border-[var(--line-strong)] bg-[var(--surface-header)] px-4 xl:hidden">
        <div className="flex items-center gap-2">
          <Image src="/TMSLOGO.png" alt="TMS" width={28} height={28} className="h-7 w-7 rounded object-cover" />
          <span className="font-rajdhani text-sm font-bold uppercase tracking-wide text-[var(--ink-primary)]">TMS Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-1)] p-2 text-[var(--ink-primary)]"
        >
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 h-full w-64 border-r border-[var(--line-strong)] bg-[var(--surface-2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              collapsed={collapsed}
              pathname={pathname}
              onCollapseToggle={handleCollapseToggle}
              onMobileClose={handleMobileClose}
            />
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-r border-[var(--line-strong)] bg-[var(--surface-2)] xl:flex",
            collapsed ? "w-[60px]" : "w-[220px]"
          )}
          style={{ minHeight: "100vh" }}
        >
          <SidebarContent
            collapsed={collapsed}
            pathname={pathname}
            onCollapseToggle={handleCollapseToggle}
            onMobileClose={handleMobileClose}
          />
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
