"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    const data = await response.json();
    if (data.success) router.push("/admin"); else { setError(data.message); setBusy(false); }
  }
  return <main className="admin-auth"><form onSubmit={submit} className="admin-auth-form"><p className="eyebrow">SELECTHUB CONTROL ROOM</p><h1>Sign in</h1><p>Manage campaigns and review delivery records.</p>{error && <p className="form-alert" role="alert">{error}</p>}<label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="submit-button" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button></form></main>;
}
