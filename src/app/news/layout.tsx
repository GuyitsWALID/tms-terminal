import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Market News | ${SITE_NAME}`,
  description: "Live market headlines with Financial Vibe editorial context, source notes, and risk-aware news reading guidance.",
  alternates: {
    canonical: `${SITE_URL}/news`,
  },
};

export default function NewsLayout({ children }: { children: ReactNode }) {
  return children;
}
