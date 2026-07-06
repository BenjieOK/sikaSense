"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateSignupForm } from "@/lib/validation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v = validateSignupForm(email, password, confirm);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setLoading(true);
    const supabase = createClient();
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${site}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-brand" style={{ justifyContent: "center" }}>
            <span className="brand-mark">₵</span>
            <span className="brand-name">SikaSense</span>
          </div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">We sent a confirmation link to {email}. Tap it to activate your account.</p>
          <Link href="/login" className="btn-dark btn-full" style={{ textDecoration: "none", display: "inline-flex" }}>
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">₵</span>
          <span className="brand-name">SikaSense</span>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start tracking what your batches actually earn.</p>

        {formError && <div className="auth-error-banner">{formError}</div>}

        <form onSubmit={submit} noValidate>
          <div className="form-field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          <div className="form-field">
            <label>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            {errors.confirm && <p className="field-error">{errors.confirm}</p>}
          </div>
          <button className="btn-primary btn-full" disabled={loading} type="submit">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
