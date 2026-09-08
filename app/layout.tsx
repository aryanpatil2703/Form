import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HRIS Selection Guide",
  description: "Request the ADP, BambooHR, Workday, and Rippling HRIS selection guide.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
