import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-title">Page not found</div>
        <p className="auth-subtitle">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
