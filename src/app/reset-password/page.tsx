"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateResetForm } from "@/lib/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v = validateResetForm(password, confirm);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">₵</span>
          <span className="brand-name">SikaSense</span>
        </div>
        <h1 className="auth-title">Set a new password</h1>
        <p className="auth-subtitle">Choose something you&apos;ll remember, at least 8 characters.</p>

        {formError && <div className="auth-error-banner">{formError}</div>}
        {done && <div className="auth-success-banner">Password updated. Taking you to your dashboard…</div>}

        <form onSubmit={submit} noValidate>
          <div className="form-field">
            <label>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          <div className="form-field">
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            {errors.confirm && <p className="field-error">{errors.confirm}</p>}
          </div>
          <button className="btn-primary btn-full" disabled={loading} type="submit">
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
