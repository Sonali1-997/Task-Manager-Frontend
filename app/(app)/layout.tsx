"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/providers";
import { WorkspaceProvider } from "@/components/Workspace";
import { initials, cx } from "@/lib/ui";
import {
  DashboardIcon,
  ProjectsIcon,
  TasksIcon,
  UsersIcon,
  ProfileIcon,
  LogoutIcon,
  SearchIcon,
} from "@/components/icons";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/projects", label: "Projects", Icon: ProjectsIcon },
  { href: "/tasks", label: "Tasks", Icon: TasksIcon },
  { href: "/users", label: "Users", Icon: UsersIcon, admin: true },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { me, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  const isAdmin = me?.role === "Admin";

  // Auth guard (client-side demo session).
  useEffect(() => {
    if (ready && !me) router.replace("/login");
  }, [ready, me, router]);

  // Close the mobile drawer on navigation.
  useEffect(() => setDrawer(false), [pathname]);

  // Keep non-admins off the admin-only users page.
  useEffect(() => {
    if (me && !isAdmin && pathname.startsWith("/users")) router.replace("/dashboard");
  }, [me, isAdmin, pathname, router]);

  if (!ready || !me) return <div className="loading">Loading…</div>;

  function onLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="app-grid">
      <aside className={cx("sidebar", drawer && "open")}>
        <div className="side-brand">
          <div className="logo">T</div>
          <span className="brandname">TaskFlow</span>
        </div>
        <nav className="nav-group">
          {NAV.filter((n) => !n.admin || isAdmin).map(({ href, label, Icon, admin }) => (
            <Link
              key={href}
              href={href}
              className={cx("nav", pathname.startsWith(href) && "active")}
            >
              <Icon />
              {label}
              {admin && <span className="badge">admin</span>}
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <div className="userline">
            <span className="av">{initials(me.name)}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{me.name}</div>
              <small>{me.role}</small>
            </div>
          </div>
          <a className="nav" onClick={onLogout}>
            <LogoutIcon />
            Log out
          </a>
        </div>
      </aside>

      <div className={cx("scrim", drawer && "show")} onClick={() => setDrawer(false)} />

      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setDrawer((d) => !d)} aria-label="Menu">
            ☰
          </button>
          <div className="search">
            <SearchIcon />
            <input placeholder="Search…" />
          </div>
          <div className="spacer" />
        </header>
        <div id="content">
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </div>
      </div>
    </div>
  );
}
