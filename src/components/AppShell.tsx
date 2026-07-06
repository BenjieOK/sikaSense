import { SideNav } from "./SideNav";
import { BottomNav } from "./BottomNav";

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <SideNav />
      <div className="app-shell-main">
        <header className="app-header">
          <h1 className="app-header-title">{title}</h1>
        </header>
        <main className="app-content">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
