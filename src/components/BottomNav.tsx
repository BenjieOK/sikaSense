"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/batches", label: "Batches", icon: "inventory_2" },
  { href: "/analytics", label: "Analytics", icon: "bar_chart" },
  { href: "/account", label: "Account", icon: "person" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${active ? "bottom-nav-item-active" : ""}`}
          >
            <Icon name={item.icon} filled={active} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
