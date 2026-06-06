import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact | ${SITE_NAME}`,
  description: "Contact Financial Vibe for support, account questions, policy concerns, and partnership requests.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
