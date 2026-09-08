import { z } from "zod";
import { COMPANY_SIZES, IMPLEMENTATION_TIMELINES } from "./config";

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required.`).max(300);

export const leadSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address.").max(320),
  first_name: requiredText("First name"),
  last_name: requiredText("Last name"),
  industry: requiredText("Industry"),
  industry_other: z.string().trim().max(300),
  function: requiredText("Function"),
  title: requiredText("Position"),
  company_name: requiredText("Company"),
  company_size: z.enum(COMPANY_SIZES, { message: "Please select a company size." }),
  timeframe_to_decision: z.enum(IMPLEMENTATION_TIMELINES, { message: "Please select an implementation timeline." }),
  address: requiredText("Street address"),
  address_2: z.string().trim().max(300),
  city: requiredText("City"),
  state: requiredText("State"),
  zip: requiredText("Zip/postal code"),
  country: requiredText("Country"),
  phone_number: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(40, "Please enter a valid phone number.")
    .regex(/^[+()\-\s.\d]+$/, "Please enter a valid phone number."),
}).strict();

export type LeadData = z.infer<typeof leadSchema>;

export function validationErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
