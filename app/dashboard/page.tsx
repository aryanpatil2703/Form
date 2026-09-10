"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SubmissionsTable } from "@/components/selecthub/SubmissionsTable";

type Campaign = { slug: string; content: { title: string }; visuals: { coverImageUrl?: string } };
type Submission = Record<string, unknown>;

export default function UserDashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [name, setName] = useState("");
  useEffect(() => {
    Promise.all([fetch("/api/user/campaigns"), fetch("/api/user/submissions")])
      .then(async ([campaignResponse, submissionResponse]) => {
        const campaignData = await campaignResponse.json();
        const submissionData = await submissionResponse.json();
        if (campaignData.success) {
          setCampaigns(campaignData.campaigns);
          setName(campaignData.user.displayName);
        }
        if (submissionData.success) setSubmissions(submissionData.submissions);
      })
      .catch(() => undefined);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <main className="user-dashboard">
      <header className="user-dashboard-header">
        <div>
          <p className="eyebrow">SAGA RESEARCH / YOUR WORKSPACE</p>
          <h1>Welcome back{name ? `, ${name}` : ""}.</h1>
          <p className="dashboard-muted">Your assigned guides and submitted requests, all in one place.</p>
        </div>
        <button className="quiet-button" onClick={logout}>Sign out</button>
      </header>

      <section>
        <div className="section-title">
          <div>
            <p className="eyebrow">AVAILABLE TO YOU</p>
            <h2>Your campaigns</h2>
          </div>
        </div>
        <div className="campaign-grid">
          {campaigns.map((campaign) => (
            <a className="campaign-card" href={`/${campaign.slug}`} key={campaign.slug}>
              {campaign.visuals.coverImageUrl && <img src={campaign.visuals.coverImageUrl} alt="" />}
              <div>
                <span>{campaign.slug}</span>
                <h3>{campaign.content.title}</h3>
                <strong>Open guide <span aria-hidden="true">-&gt;</span></strong>
              </div>
            </a>
          ))}
        </div>
        {campaigns.length === 0 && <p className="dashboard-muted">No campaigns have been assigned to your account yet.</p>}
      </section>

      <section className="user-submissions">
        <div className="section-title">
          <div>
            <p className="eyebrow">YOUR ACTIVITY</p>
            <h2>Submission history</h2>
          </div>
        </div>
        <SubmissionsTable submissions={submissions} emptyMessage="Your submissions will appear here." />
      </section>
    </main>
  );
}
