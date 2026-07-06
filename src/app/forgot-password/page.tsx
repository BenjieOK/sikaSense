"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const err = validateEmail(email);
    setError(err);
    if (err) return;

    setLoading(true);
    const supabase = createClient();
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${site}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setFormError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: sent ? "center" : "left" }}>
        <div className="auth-brand" style={{ justifyContent: sent ? "center" : "flex-start" }}>
          <span className="brand-mark">₵</span>
          <span className="brand-name">SikaSense</span>
        </div>
        {sent ? (
          <>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">We sent a password reset link to {email}.</p>
            <Link href="/login" className="btn-dark btn-full" style={{ textDecoration: "none", display: "inline-flex" }}>
              Back to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-subtitle">Enter your email and we&apos;ll send you a reset link.</p>
            {formError && <div className="auth-error-banner">{formError}</div>}
            <form onSubmit={submit} noValidate>
              <div className="form-field">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                {error && <p className="field-error">{error}</p>}
              </div>
              <button className="btn-primary btn-full" disabled={loading} type="submit">
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <div className="auth-footer">
              Remembered it? <Link href="/login">Log in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
