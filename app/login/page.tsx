"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function FormLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    const data = await response.json();
    if (data.success) {
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && /^\/[A-Za-z0-9/_-]*$/.test(next) ? next : "/dashboard");
    } else {
      setError(data.message || "Invalid email or password.");
      setBusy(false);
    }
  }

  return <main className="admin-auth"><form onSubmit={submit} className="admin-auth-form"><p className="eyebrow">SAGA RESEARCH</p><h1>Sign in to continue</h1><p>Access your assigned guides and submission history.</p>{error && <p className="form-alert" role="alert">{error}</p>}<label>Username<input name="username" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="submit-button" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button></form></main>;
}