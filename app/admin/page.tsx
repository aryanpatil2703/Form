"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Campaign = { slug: string; content?: { title?: string } };
type User = { id: string; username: string; displayName: string; allowedCampaigns: string[]; createdAt: string };
type Submission = Record<string, unknown>;

export default function AdminPage() {
  const router = useRouter();
  const [section, setSection] = useState<"overview" | "submissions" | "users" | "campaigns">("overview");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  async function loadSubmissions(campaign = filter) {
    const response = await fetch(`/api/admin/submissions${campaign === "all" ? "" : `?campaign=${encodeURIComponent(campaign)}`}`);
    const data = await response.json();
    if (data.success) setSubmissions(data.submissions);
  }
  async function load() {
    const [campaignResponse, userResponse] = await Promise.all([fetch("/api/admin/campaigns"), fetch("/api/admin/users")]);
    const campaignData = await campaignResponse.json(); const userData = await userResponse.json();
    if (campaignData.success) setCampaigns(campaignData.campaigns);
    if (userData.success) setUsers(userData.users);
    await loadSubmissions();
  }
  useEffect(() => { const timer = window.setTimeout(() => { load().catch(() => setMessage("Unable to load dashboard data.")); }, 0); return () => window.clearTimeout(timer); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const timer = window.setTimeout(() => { loadSubmissions().catch(() => undefined); }, 0); return () => window.clearTimeout(timer); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin/login"); }
  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), displayName: form.get("displayName"), password: form.get("password"), allowedCampaigns: form.getAll("allowedCampaigns") }) });
    const data = await response.json(); setMessage(data.message || (data.success ? "User created." : "Unable to create user."));
    if (data.success) { event.currentTarget.reset(); await load(); }
  }
  async function removeUser(id: string) { if (!window.confirm("Delete this user?")) return; await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" }); await load(); }
  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const response = await fetch("/api/admin/campaigns", { method: "POST", body: new FormData(event.currentTarget) }); const data = await response.json();
    setMessage(data.success ? "Campaign created." : data.error || "Unable to create campaign."); if (data.success) await load();
  }

  return <div className="dashboard-shell">
    <aside className="dashboard-sidebar"><div className="brand-mark"><span>SH</span><div><strong>SelectHub</strong><small>Control room</small></div></div><nav><button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}>Overview</button><button className={section === "submissions" ? "active" : ""} onClick={() => setSection("submissions")}>Submissions <b>{submissions.length}</b></button><button className={section === "users" ? "active" : ""} onClick={() => setSection("users")}>Users <b>{users.length}</b></button><button className={section === "campaigns" ? "active" : ""} onClick={() => setSection("campaigns")}>Campaigns</button></nav><button className="sidebar-signout" onClick={logout}>Sign out</button></aside>
    <main className="dashboard-main"><header className="dashboard-header"><div><p className="eyebrow">WORKSPACE / ADMIN</p><h1>{section === "overview" ? "Good morning, admin." : section[0].toUpperCase() + section.slice(1)}</h1><p className="dashboard-muted">Manage access, campaigns, and every delivery from one place.</p></div><button className="quiet-button" onClick={() => load()}>Refresh data</button></header>{message && <div className="dashboard-notice">{message}</div>}
      {section === "overview" && <><div className="metric-grid"><div><span>Campaigns</span><strong>{campaigns.length}</strong><small>Active forms</small></div><div><span>Assigned users</span><strong>{users.length}</strong><small>Managed accounts</small></div><div><span>Submissions</span><strong>{submissions.length}</strong><small>Latest records</small></div></div><section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">QUICK ACCESS</p><h2>Recent submissions</h2></div><button className="text-button" onClick={() => setSection("submissions")}>View all</button></div><SubmissionList submissions={submissions.slice(0, 5)} /></section></>}
      {section === "submissions" && <section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">DELIVERY LOG</p><h2>Submission records</h2></div><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All campaigns</option>{campaigns.map((campaign) => <option key={campaign.slug} value={campaign.slug}>{campaign.slug}</option>)}</select></div><SubmissionList submissions={submissions} /></section>}
      {section === "users" && <div className="content-grid"><section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">ACCESS MANAGEMENT</p><h2>Create a user</h2></div></div><form className="stack-form" onSubmit={createUser}><label>Username<input name="username" required /></label><label>Display name<input name="displayName" required /></label><label>Temporary password<input name="password" type="password" minLength={8} required /></label><fieldset><legend>Campaign access</legend>{campaigns.map((campaign) => <label className="check-row" key={campaign.slug}><input type="checkbox" name="allowedCampaigns" value={campaign.slug} />{campaign.slug}</label>)}</fieldset><button className="primary-button">Create user</button></form></section><section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">DIRECTORY</p><h2>People with access</h2></div></div><div className="user-list">{users.length === 0 ? <p className="dashboard-muted">No users yet.</p> : users.map((user) => <div className="user-row" key={user.id}><div><strong>{user.displayName}</strong><small>{user.username}</small><small>{user.allowedCampaigns.length ? user.allowedCampaigns.join(", ") : "No campaigns assigned"}</small></div><button className="danger-button" onClick={() => removeUser(user.id)}>Delete</button></div>)}</div></section></div>}
      {section === "campaigns" && <section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">FORM BUILDER</p><h2>Create a campaign</h2></div></div><form className="campaign-form" onSubmit={createCampaign}><label>URL slug<input name="slug" placeholder="hris-guide" required /></label><label>Campaign title<input name="title" defaultValue="Make the next decision with a clearer view." required /></label><label>Intro copy<textarea name="introCopy" defaultValue="Get the practical selection guide." /></label><label>Primary color<input name="primaryColor" defaultValue="#d8ed65" /></label><button className="primary-button">Create campaign</button></form></section>}
    </main></div>;
}

function SubmissionList({ submissions }: { submissions: Submission[] }) { return submissions.length === 0 ? <p className="dashboard-muted">No submissions match this view.</p> : <div className="submission-list">{submissions.map((submission) => <details key={String(submission.id)}><summary><strong className={`status-${submission.status}`}>{String(submission.status).toUpperCase()}</strong><span>{String(submission.campaign_slug)}</span><span>{new Date(String(submission.created_at)).toLocaleString()}</span></summary><pre>{JSON.stringify({ lead: submission.lead, error: submission.error }, null, 2)}</pre></details>)}</div>; }
