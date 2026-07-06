"use client";

import { useRouter } from "next/navigation";

export function TabBar({
  active,
  onChange,
}: {
  active: "verdict" | "sourcing";
  onChange: (tab: "verdict" | "sourcing") => void;
}) {
  const router = useRouter();
  return (
    <div className="tab-bar">
      <button className={`tab ${active === "verdict" ? "tab-active" : ""}`} onClick={() => onChange("verdict")}>
        Net Verdict
      </button>
      <button className={`tab ${active === "sourcing" ? "tab-active" : ""}`} onClick={() => onChange("sourcing")}>
        Sourcing
      </button>
      <button className="tab" onClick={() => router.push("/batches")}>
        History
      </button>
    </div>
  );
}
