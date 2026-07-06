"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const { show } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    show("Signed out", "info");
  };

  return (
    <AppShell title="Account">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="stat-label">Signed in as</div>
        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{user?.email}</div>
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        <Link href="/forgot-password" className="side-nav-item" style={{ padding: 0 }}>
          <Icon name="lock_reset" /> Change password
        </Link>
      </div>

      <button className="btn-ghost btn-full" onClick={handleSignOut} disabled={signingOut}>
        <Icon name="logout" /> {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </AppShell>
  );
}
