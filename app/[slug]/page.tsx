import { notFound, redirect } from "next/navigation";
import { getCampaignBySlug } from "@/lib/campaigns";
import { SelectHubForm } from "@/components/selecthub/SelectHubForm";
import { getFormUserId } from "@/lib/auth";
import { getUserById, canAccessCampaign } from "@/lib/users";
import { cookies } from "next/headers";

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const campaign = await getCampaignBySlug(resolvedParams.slug);

  if (!campaign) {
    notFound();
  }

  const userId = await getFormUserId({ cookies: await cookies() });
  const user = userId && userId !== "legacy" ? await getUserById(userId) : null;
  if (user && !canAccessCampaign(user, campaign.slug)) redirect("/dashboard");

  const { visuals, content, formConfig } = campaign;
  const primaryColor = visuals.primaryColor || "var(--blue-500)"; // Default from globals.css if needed

  return (
    <main className="page-shell" style={{ "--primary-color": primaryColor } as React.CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          ${visuals.primaryColor ? `--brand-color: ${visuals.primaryColor};` : ""}
        }
      `}} />
      <section className="intro" aria-labelledby="page-title">
        {visuals.logoUrl && (
          <img src={visuals.logoUrl} alt="Logo" style={{ maxWidth: "200px", marginBottom: "2rem" }} />
        )}
        <p className="eyebrow">{content.eyebrow}</p>
        <h1 id="page-title">{content.title}</h1>
        <p className="intro-copy">{content.introCopy}</p>
        
        {visuals.coverImageUrl && (
          <img src={visuals.coverImageUrl} alt="Cover" style={{ width: "100%", borderRadius: "8px", margin: "2rem 0" }} />
        )}

        {content.guideNoteNumber && content.guideNoteText && (
          <div className="guide-note">
            <span aria-hidden="true">{content.guideNoteNumber}</span>
            <p>{content.guideNoteText}</p>
          </div>
        )}
      </section>
      <section className="form-panel" aria-labelledby="form-title">
        <div className="form-heading">
          <p className="eyebrow">{content.formEyebrow}</p>
          <h2 id="form-title">{content.formTitle}</h2>
          <p>Fields marked <span aria-hidden="true">*</span> are required.</p>
        </div>
        <SelectHubForm 
          campaignSlug={campaign.slug} 
          submitButtonText={formConfig.submitButtonText} 
          customFields={formConfig.customFields} 
          suppressedCompanies={campaign.competitors}
        />
      </section>
    </main>
  );
}
