"use client";

import { FormEvent, useState } from "react";
import { COMPANY_SIZES } from "@/lib/selecthub/config";
import { leadSchema } from "@/lib/selecthub/validation";

type FormValues = Record<string, string>;
type Field = { name: string; label: string; autoComplete: string; required?: boolean; type?: string };

const fields: Field[] = [
  { name: "email", label: "Email address", autoComplete: "email", required: true, type: "email" },
  { name: "first_name", label: "First name", autoComplete: "given-name", required: true },
  { name: "last_name", label: "Last name", autoComplete: "family-name", required: true },
  { name: "industry", label: "Industry", autoComplete: "organization-title", required: true },
  { name: "industry_other", label: "Sub industry", autoComplete: "off" },
  { name: "function", label: "Function", autoComplete: "organization-title", required: true },
  { name: "title", label: "Position", autoComplete: "organization-title", required: true },
  { name: "company_name", label: "Company", autoComplete: "organization", required: true },
  { name: "address", label: "Street address", autoComplete: "street-address", required: true },
  { name: "address_2", label: "Address 2", autoComplete: "address-line2" },
  { name: "city", label: "City", autoComplete: "address-level2", required: true },
  { name: "state", label: "State", autoComplete: "address-level1", required: true },
  { name: "zip", label: "Zip / postal code", autoComplete: "postal-code", required: true },
  { name: "country", label: "Country", autoComplete: "country-name", required: true },
  { name: "phone_number", label: "Phone", autoComplete: "tel", required: true, type: "tel" },
];

export function SelectHubForm({ campaignSlug, submitButtonText = "Submit", customFields = [] }: { campaignSlug: string; submitButtonText?: string; customFields?: { name: string; label: string; type: string }[] }) {
  const allFields = [...fields, ...customFields.map(cf => ({ ...cf, autoComplete: "off" }))];
  const initialValues = Object.fromEntries([...allFields.map(({ name }) => [name, ""]), ["company_size", ""]]);

  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function update(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    if (status !== "idle") setStatus("idle");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = leadSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const name = String(issue.path[0]);
        if (!nextErrors[name]) nextErrors[name] = issue.message;
      }
      setErrors(nextErrors);
      setStatus("error");
      setMessage("Please correct the highlighted fields.");
      document.getElementById(Object.keys(nextErrors)[0] || "email")?.focus();
      return;
    }

    setStatus("submitting");
    setMessage("");
    try {
      const payload = { ...result.data, campaignSlug };
      const response = await fetch("/api/selecthub", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrors(data.errors ? Object.fromEntries(Object.entries(data.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : String(value)])) : {});
        setStatus("error");
        setMessage(data.message || "We couldn't submit your information right now. Please try again.");
        return;
      }
      setStatus("success");
      setMessage("Thank you. Your guide request has been submitted successfully.");
      setValues(initialValues);
    } catch {
      setStatus("error");
      setMessage("We couldn't submit your information right now. Please try again.");
    }
  }

  if (status === "success") {
    return <div className="success-state" role="status"><span className="success-mark" aria-hidden="true">✓</span><h3>Request received</h3><p>{message}</p><button type="button" className="text-button" onClick={() => { setStatus("idle"); setMessage(""); }}>Submit another request</button></div>;
  }

  return (
    <form onSubmit={submit} noValidate>
      {message && <p className="form-alert" role="alert">{message}</p>}
      <div className="field-grid">
        {fields.slice(0, 8).map((field) => <Input key={field.name} field={field} value={values[field.name]} error={errors[field.name]} onChange={update} />)}
        <div className="field"><label htmlFor="company_size">Company size <span aria-hidden="true">*</span></label><select id="company_size" name="company_size" value={values.company_size} onChange={(event) => update("company_size", event.target.value)} aria-invalid={Boolean(errors.company_size)} aria-describedby={errors.company_size ? "company_size-error" : undefined} required><option value="">Select a range</option>{COMPANY_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}</select>{errors.company_size && <Error id="company_size-error" text={errors.company_size} />}</div>
        {fields.slice(8).map((field) => <Input key={field.name} field={field} value={values[field.name] || ""} error={errors[field.name]} onChange={update} />)}
        {customFields.map((field) => <Input key={field.name} field={{ ...field, autoComplete: "off" }} value={values[field.name] || ""} error={errors[field.name]} onChange={update} />)}
      </div>
      <button className="submit-button" type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Sending request..." : submitButtonText}<span aria-hidden="true">↗</span></button>
      <p className="privacy-note">By submitting, you agree to receive this guide and related research from SAGA.</p>
    </form>
  );
}

function Input({ field, value, error, onChange }: { field: Field; value: string; error?: string; onChange: (name: string, value: string) => void }) {
  const errorId = `${field.name}-error`;
  return <div className="field"><label htmlFor={field.name}>{field.label} {field.required && <span aria-hidden="true">*</span>}</label><input id={field.name} name={field.name} type={field.type || "text"} value={value} onChange={(event) => onChange(field.name, event.target.value)} autoComplete={field.autoComplete} required={field.required} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />{error && <Error id={errorId} text={error} />}</div>;
}

function Error({ id, text }: { id: string; text: string }) { return <p className="field-error" id={id}>{text}</p>; }
