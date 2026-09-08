"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [submissions, setSubmissions] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    fetch("/api/admin/submissions")
      .then((response) => response.json())
      .then((data) => { if (data.success) setSubmissions(data.submissions); })
      .catch(() => undefined);
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setTimeout(() => router.push(`/${data.slug}`), 1000);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Failed to create campaign");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("An unexpected error occurred.");
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
        <div><p className="eyebrow">SELECTHUB CONTROL ROOM</p><h1>Campaign platform</h1></div>
        <button type="button" onClick={logout} style={{ padding: "10px 14px", background: "transparent", border: "1px solid #ccc", cursor: "pointer" }}>Sign out</button>
      </header>

      <section style={{ marginBottom: "48px" }}>
        <h2>Submission records</h2>
        <p style={{ color: "#617069" }}>Every delivery attempt is retained with its campaign, timestamp, scorecard, lead fields, and server-built SelectHub payload.</p>
        {submissions.length === 0 ? <p>No submissions recorded yet.</p> : <div style={{ display: "grid", gap: "12px" }}>{submissions.map((submission) => <details key={String(submission.id)} style={{ border: "1px solid #d8ddd2", padding: "14px", background: "#fffef9" }}><summary style={{ cursor: "pointer", display: "flex", gap: "18px", flexWrap: "wrap" }}><strong>{String(submission.status).toUpperCase()}</strong><span>{String(submission.campaign_slug)}</span><span>{new Date(String(submission.created_at)).toLocaleString()}</span><span>{String(submission.scorecard_id)}</span></summary><pre style={{ overflowX: "auto", whiteSpace: "pre-wrap", fontSize: "12px", marginTop: "16px" }}>{JSON.stringify({ lead: submission.lead, selecthub_payload: submission.selecthub_payload, error: submission.error }, null, 2)}</pre></details>)}</div>}
      </section>

      <h2>Create or update campaign</h2>
      
      {status === "error" && <div style={{ color: "red", marginBottom: "20px" }}>{errorMsg}</div>}
      {status === "success" && <div style={{ color: "green", marginBottom: "20px" }}>Campaign created! Redirecting...</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <section style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h2>Basic Settings</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label>
              URL Slug (e.g., &quot;my-campaign&quot;): <br />
              <input name="slug" required style={{ width: "100%", padding: "8px" }} />
            </label>
            <label>
              Primary Color (CSS value, e.g., &quot;#ff0000&quot; or &quot;blue&quot;): <br />
              <input name="primaryColor" placeholder="#0056b3" style={{ width: "100%", padding: "8px" }} />
            </label>
          </div>
        </section>

        <section style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h2>Visuals</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label>
              Logo Upload: <br />
              <input type="file" name="logo" accept="image/*" />
            </label>
            <label>
              Cover Image Upload: <br />
              <input type="file" name="coverImage" accept="image/*" />
            </label>
          </div>
        </section>

        <section style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h2>Content</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label>Eyebrow: <input name="eyebrow" defaultValue="SAGA / RESEARCH BRIEF" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Title: <input name="title" defaultValue="Make the next decision with a clearer view." style={{ width: "100%", padding: "8px" }} /></label>
            <label>Intro Copy: <textarea name="introCopy" defaultValue="Get the practical selection guide." style={{ width: "100%", padding: "8px" }} /></label>
            <label>Guide Note Number: <input name="guideNoteNumber" defaultValue="01" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Guide Note Text: <input name="guideNoteText" defaultValue="One concise guide for teams weighing their next system." style={{ width: "100%", padding: "8px" }} /></label>
            <label>Form Eyebrow: <input name="formEyebrow" defaultValue="YOUR DETAILS" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Form Title: <input name="formTitle" defaultValue="Send me the guide" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Submit Button Text: <input name="submitButtonText" defaultValue="Submit" style={{ width: "100%", padding: "8px" }} /></label>
          </div>
        </section>

        <section style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h2>SelectHub API (Hidden Fields)</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label>Lead Source: <input name="lead_source" defaultValue="SAGA-PPL" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Campaign: <input name="campaign" defaultValue="asset_request" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Category: <input name="category" defaultValue="HR Management Software" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Category Slug: <input name="category_slug" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Survey Slug: <input name="survey_slug" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Asset Type: <input name="asset_type" defaultValue="Selection Guide" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Team: <input name="team" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Contract PO Number: <input name="contract_po_number" defaultValue="SAGA-HR-Global" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Campaign Name: <input name="campaign_name" defaultValue="SAGA HRIS Systems ADP VS BattleCard 26" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Page URL: <input name="page_url" defaultValue="https://get.softwarebattlecard.com/" style={{ width: "100%", padding: "8px" }} /></label>
            <label>User Journey: <input name="user_journey" defaultValue="HRIS BattleCard, ADP vs BambooHR vs Workday vs Rippling PPL" style={{ width: "100%", padding: "8px" }} /></label>
            <label>Timeframe to Decision: <input name="timeframe_to_decision" style={{ width: "100%", padding: "8px" }} /></label>
          </div>
        </section>

        <button type="submit" disabled={status === "submitting"} style={{ padding: "15px", fontSize: "16px", background: "#000", color: "#fff", cursor: "pointer", borderRadius: "8px" }}>
          {status === "submitting" ? "Creating..." : "Create Campaign"}
        </button>
      </form>
    </div>
  );
}
