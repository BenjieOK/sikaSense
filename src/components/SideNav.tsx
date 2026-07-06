"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { useAuth } from "./AuthProvider";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/batches", label: "Batches", icon: "inventory_2" },
  { href: "/analytics", label: "Analytics", icon: "bar_chart" },
  { href: "/account", label: "Account", icon: "person" },
];

export function SideNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="side-nav">
      <div className="side-nav-brand">
        <span className="brand-mark">₵</span>
        <span className="brand-name">SikaSense</span>
      </div>
      <nav className="side-nav-links">
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`side-nav-item ${active ? "side-nav-item-active" : ""}`}>
              <Icon name={item.icon} filled={active} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="side-nav-footer">
        <div className="side-nav-user">{user?.email}</div>
        <button className="link-btn" onClick={signOut} type="button">
          Sign out
        </button>
      </div>
    </aside>
  );
}
